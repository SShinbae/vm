-- =====================================================
-- VEHICLES MANAGEMENT V2 - ENHANCED SCHEMA
-- =====================================================
-- This schema includes:
-- 1. Selective group sharing (not just boolean)
-- 2. Image support for vehicles and profiles
-- 3. Enhanced security and privacy
-- 4. Better performance with proper indexes
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies and tables if recreating
-- (Uncomment if doing a fresh install)
-- DROP POLICY IF EXISTS "Users can view own vehicles" ON vehicles;
-- DROP POLICY IF EXISTS "Group members can view shared vehicles" ON vehicles;
-- DROP TABLE IF EXISTS vehicle_group_shares CASCADE;
-- DROP TABLE IF EXISTS vehicle_images CASCADE;

-- =====================================================
-- CUSTOM TYPES AND ENUMS
-- =====================================================

-- Enhanced invitation status
DO $$ BEGIN
    CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enhanced service types
DO $$ BEGIN
    CREATE TYPE service_type AS ENUM (
        'oil_change',
        'tire_rotation',
        'brake_service',
        'general_maintenance',
        'repair',
        'inspection',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Image types for different contexts
DO $$ BEGIN
    CREATE TYPE image_type AS ENUM ('profile_avatar', 'vehicle_main', 'vehicle_gallery');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- STORAGE BUCKETS FOR IMAGES
-- =====================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
    ('profile-avatars', 'profile-avatars', true),
    ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ENHANCED PROFILES TABLE
-- =====================================================

-- Update profiles table to include avatar
DO $$
BEGIN
    -- Add avatar_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE profiles ADD COLUMN avatar_url text;
    END IF;

    -- Add phone number for enhanced contact
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'phone'
    ) THEN
        ALTER TABLE profiles ADD COLUMN phone text;
    END IF;

    -- Add bio for profile enhancement
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'bio'
    ) THEN
        ALTER TABLE profiles ADD COLUMN bio text;
    END IF;
END $$;

-- =====================================================
-- ENHANCED VEHICLES TABLE
-- =====================================================

-- Update vehicles table for image support
DO $$
BEGIN
    -- Add main image URL
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'vehicles' AND column_name = 'main_image_url'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN main_image_url text;
    END IF;

    -- Add color information
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'vehicles' AND column_name = 'color'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN color text;
    END IF;

    -- Add mileage information
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'vehicles' AND column_name = 'current_mileage'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN current_mileage integer DEFAULT 0;
    END IF;

    -- Remove the old boolean sharing column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicles'
        AND column_name = 'shared_with_groups'
    ) THEN
        ALTER TABLE vehicles DROP COLUMN shared_with_groups;
        RAISE NOTICE 'Dropped shared_with_groups column from vehicles table';
    ELSE
        RAISE NOTICE 'shared_with_groups column does not exist, skipping drop';
    END IF;
END $$;

-- =====================================================
-- NEW TABLE: VEHICLE IMAGES
-- =====================================================

CREATE TABLE IF NOT EXISTS vehicle_images (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
    image_url text NOT NULL,
    image_type image_type DEFAULT 'vehicle_gallery',
    caption text,
    display_order integer DEFAULT 0,
    uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for vehicle images
CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle_id ON vehicle_images(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_images_type ON vehicle_images(image_type);
CREATE INDEX IF NOT EXISTS idx_vehicle_images_order ON vehicle_images(vehicle_id, display_order);

-- =====================================================
-- NEW TABLE: SELECTIVE VEHICLE GROUP SHARING
-- =====================================================

-- This replaces the boolean shared_with_groups column
-- Now vehicles can be shared with specific groups only
CREATE TABLE IF NOT EXISTS vehicle_group_shares (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
    group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
    shared_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    shared_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Prevent duplicate shares
    UNIQUE(vehicle_id, group_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_shares_vehicle ON vehicle_group_shares(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_shares_group ON vehicle_group_shares(group_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_shares_composite ON vehicle_group_shares(vehicle_id, group_id);

-- =====================================================
-- UTILITY FUNCTIONS TO AVOID RLS RECURSION
-- =====================================================

-- Function to get user's group memberships (breaks recursion)
CREATE OR REPLACE FUNCTION get_user_group_ids(user_uuid uuid)
RETURNS uuid[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT ARRAY(
        SELECT group_id
        FROM group_members
        WHERE user_id = user_uuid
    );
$$;

-- =====================================================
-- ENHANCED RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_group_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE mileage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR ALL USING (auth.uid() = id);

-- Users can view profiles of group members (for sharing context)
DROP POLICY IF EXISTS "Users can view group member profiles" ON profiles;
CREATE POLICY "Users can view group member profiles" ON profiles
    FOR SELECT USING (
        id IN (
            SELECT gm1.user_id
            FROM group_members gm1
            JOIN group_members gm2 ON gm1.group_id = gm2.group_id
            WHERE gm2.user_id = auth.uid()
        )
    );

-- =====================================================
-- VEHICLES POLICIES
-- =====================================================

-- Users can manage their own vehicles
DROP POLICY IF EXISTS "Users can manage own vehicles" ON vehicles;
CREATE POLICY "Users can manage own vehicles" ON vehicles
    FOR ALL USING (auth.uid() = user_id);

-- Users can view vehicles shared with their groups
DROP POLICY IF EXISTS "Users can view shared vehicles" ON vehicles;
CREATE POLICY "Users can view shared vehicles" ON vehicles
    FOR SELECT USING (
        id IN (
            SELECT vgs.vehicle_id
            FROM vehicle_group_shares vgs
            JOIN group_members gm ON vgs.group_id = gm.group_id
            WHERE gm.user_id = auth.uid()
            AND vgs.vehicle_id != vehicles.id -- Don't double-count own vehicles
        )
    );

-- =====================================================
-- VEHICLE IMAGES POLICIES
-- =====================================================

-- Users can manage images for their own vehicles
DROP POLICY IF EXISTS "Users can manage own vehicle images" ON vehicle_images;
CREATE POLICY "Users can manage own vehicle images" ON vehicle_images
    FOR ALL USING (
        vehicle_id IN (
            SELECT id FROM vehicles WHERE user_id = auth.uid()
        )
    );

-- Users can view images of shared vehicles
DROP POLICY IF EXISTS "Users can view shared vehicle images" ON vehicle_images;
CREATE POLICY "Users can view shared vehicle images" ON vehicle_images
    FOR SELECT USING (
        vehicle_id IN (
            SELECT vgs.vehicle_id
            FROM vehicle_group_shares vgs
            JOIN group_members gm ON vgs.group_id = gm.group_id
            WHERE gm.user_id = auth.uid()
        )
    );

-- =====================================================
-- VEHICLE GROUP SHARES POLICIES
-- =====================================================

-- Users can manage sharing for their own vehicles
DROP POLICY IF EXISTS "Users can manage own vehicle shares" ON vehicle_group_shares;
CREATE POLICY "Users can manage own vehicle shares" ON vehicle_group_shares
    FOR ALL USING (
        vehicle_id IN (
            SELECT id FROM vehicles WHERE user_id = auth.uid()
        )
    );

-- Users can view shares for vehicles shared with them
DROP POLICY IF EXISTS "Users can view relevant shares" ON vehicle_group_shares;
CREATE POLICY "Users can view relevant shares" ON vehicle_group_shares
    FOR SELECT USING (
        group_id = ANY(get_user_group_ids(auth.uid()))
    );

-- =====================================================
-- GROUPS POLICIES (Enhanced)
-- =====================================================

-- Users can manage groups they own
DROP POLICY IF EXISTS "Users can manage own groups" ON groups;
CREATE POLICY "Users can manage own groups" ON groups
    FOR ALL USING (auth.uid() = owner_id);

-- Users can view groups they are members of or own
DROP POLICY IF EXISTS "Users can view member groups" ON groups;
CREATE POLICY "Users can view member groups" ON groups
    FOR SELECT USING (
        owner_id = auth.uid() OR
        id = ANY(get_user_group_ids(auth.uid()))
    );

-- =====================================================
-- GROUP MEMBERS POLICIES (Enhanced)
-- =====================================================

-- Group owners can manage all memberships
DROP POLICY IF EXISTS "Group owners can manage memberships" ON group_members;
CREATE POLICY "Group owners can manage memberships" ON group_members
    FOR ALL USING (
        group_id IN (
            SELECT id FROM groups WHERE owner_id = auth.uid()
        )
    );

-- Users can view memberships of their groups
DROP POLICY IF EXISTS "Users can view group memberships" ON group_members;
CREATE POLICY "Users can view group memberships" ON group_members
    FOR SELECT USING (
        user_id = auth.uid() OR
        group_id IN (
            SELECT id FROM groups WHERE owner_id = auth.uid()
        )
    );

-- Users can leave groups (delete their own membership)
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
CREATE POLICY "Users can leave groups" ON group_members
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- LOGS POLICIES (Enhanced for shared vehicles)
-- =====================================================

-- Mileage logs
DROP POLICY IF EXISTS "Users can manage own vehicle logs" ON mileage_logs;
CREATE POLICY "Users can manage own vehicle logs" ON mileage_logs
    FOR ALL USING (
        vehicle_id IN (
            SELECT id FROM vehicles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can view shared vehicle logs" ON mileage_logs;
CREATE POLICY "Users can view shared vehicle logs" ON mileage_logs
    FOR SELECT USING (
        vehicle_id IN (
            SELECT vgs.vehicle_id
            FROM vehicle_group_shares vgs
            JOIN group_members gm ON vgs.group_id = gm.group_id
            WHERE gm.user_id = auth.uid()
        )
    );

-- Fuel logs (same pattern)
DROP POLICY IF EXISTS "Users can manage own fuel logs" ON fuel_logs;
CREATE POLICY "Users can manage own fuel logs" ON fuel_logs
    FOR ALL USING (
        vehicle_id IN (
            SELECT id FROM vehicles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can view shared fuel logs" ON fuel_logs;
CREATE POLICY "Users can view shared fuel logs" ON fuel_logs
    FOR SELECT USING (
        vehicle_id IN (
            SELECT vgs.vehicle_id
            FROM vehicle_group_shares vgs
            JOIN group_members gm ON vgs.group_id = gm.group_id
            WHERE gm.user_id = auth.uid()
        )
    );

-- Service logs (same pattern)
DROP POLICY IF EXISTS "Users can manage own service logs" ON service_logs;
CREATE POLICY "Users can manage own service logs" ON service_logs
    FOR ALL USING (
        vehicle_id IN (
            SELECT id FROM vehicles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can view shared service logs" ON service_logs;
CREATE POLICY "Users can view shared service logs" ON service_logs
    FOR SELECT USING (
        vehicle_id IN (
            SELECT vgs.vehicle_id
            FROM vehicle_group_shares vgs
            JOIN group_members gm ON vgs.group_id = gm.group_id
            WHERE gm.user_id = auth.uid()
        )
    );

-- =====================================================
-- STORAGE POLICIES FOR IMAGES
-- =====================================================

-- Profile avatars storage policy
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'profile-avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'profile-avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'profile-avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Vehicle images storage policy
DROP POLICY IF EXISTS "Vehicle images are publicly accessible" ON storage.objects;
CREATE POLICY "Vehicle images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'vehicle-images');

DROP POLICY IF EXISTS "Users can upload vehicle images" ON storage.objects;
CREATE POLICY "Users can upload vehicle images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'vehicle-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Users can update vehicle images" ON storage.objects;
CREATE POLICY "Users can update vehicle images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'vehicle-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Users can delete vehicle images" ON storage.objects;
CREATE POLICY "Users can delete vehicle images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'vehicle-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- =====================================================
-- USEFUL FUNCTIONS
-- =====================================================

-- Function to get vehicles with sharing info
CREATE OR REPLACE FUNCTION get_user_vehicles_with_sharing(user_uuid uuid)
RETURNS TABLE (
    vehicle_id uuid,
    make text,
    model text,
    year integer,
    license_plate text,
    main_image_url text,
    is_own_vehicle boolean,
    owner_name text,
    owner_email text,
    shared_groups text[]
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    -- Own vehicles
    SELECT
        v.id,
        v.make,
        v.model,
        v.year,
        v.license_plate,
        v.main_image_url,
        true as is_own_vehicle,
        p.full_name as owner_name,
        p.email as owner_email,
        ARRAY(
            SELECT g.name
            FROM vehicle_group_shares vgs
            JOIN groups g ON vgs.group_id = g.id
            WHERE vgs.vehicle_id = v.id
        ) as shared_groups
    FROM vehicles v
    JOIN profiles p ON v.user_id = p.id
    WHERE v.user_id = user_uuid

    UNION ALL

    -- Shared vehicles
    SELECT
        v.id,
        v.make,
        v.model,
        v.year,
        v.license_plate,
        v.main_image_url,
        false as is_own_vehicle,
        p.full_name as owner_name,
        p.email as owner_email,
        ARRAY(
            SELECT g.name
            FROM vehicle_group_shares vgs
            JOIN groups g ON vgs.group_id = g.id
            WHERE vgs.vehicle_id = v.id
        ) as shared_groups
    FROM vehicles v
    JOIN profiles p ON v.user_id = p.id
    JOIN vehicle_group_shares vgs ON v.id = vgs.vehicle_id
    JOIN group_members gm ON vgs.group_id = gm.group_id
    WHERE gm.user_id = user_uuid
    AND v.user_id != user_uuid
$$;

-- Function to share vehicle with multiple groups
CREATE OR REPLACE FUNCTION share_vehicle_with_groups(
    vehicle_uuid uuid,
    group_uuids uuid[]
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    group_uuid uuid;
BEGIN
    -- Verify user owns the vehicle
    IF NOT EXISTS (
        SELECT 1 FROM vehicles
        WHERE id = vehicle_uuid AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You can only share your own vehicles';
    END IF;

    -- Remove existing shares for this vehicle
    DELETE FROM vehicle_group_shares WHERE vehicle_id = vehicle_uuid;

    -- Add new shares
    FOREACH group_uuid IN ARRAY group_uuids
    LOOP
        -- Verify user is member of the group
        IF EXISTS (
            SELECT 1 FROM group_members
            WHERE group_id = group_uuid AND user_id = auth.uid()
        ) THEN
            INSERT INTO vehicle_group_shares (vehicle_id, group_id, shared_by)
            VALUES (vehicle_uuid, group_uuid, auth.uid())
            ON CONFLICT (vehicle_id, group_id) DO NOTHING;
        END IF;
    END LOOP;

    RETURN true;
END;
$$;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to tables that need updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicle_images_updated_at ON vehicle_images;
CREATE TRIGGER update_vehicle_images_updated_at
    BEFORE UPDATE ON vehicle_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check schema is properly set up
SELECT
    'Schema v2 setup verification' as status,

    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'vehicle_group_shares'
    ) THEN '✅ Selective sharing table exists'
    ELSE '❌ Selective sharing table missing'
    END as selective_sharing,

    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'vehicle_images'
    ) THEN '✅ Vehicle images table exists'
    ELSE '❌ Vehicle images table missing'
    END as vehicle_images,

    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'avatar_url'
    ) THEN '✅ Profile avatars supported'
    ELSE '❌ Profile avatars missing'
    END as profile_avatars,

    CASE WHEN EXISTS (
        SELECT 1 FROM storage.buckets
        WHERE id = 'vehicle-images'
    ) THEN '✅ Storage buckets created'
    ELSE '❌ Storage buckets missing'
    END as storage_buckets;

-- Count sharing relationships
SELECT
    COUNT(*) as total_vehicles,
    COUNT(CASE WHEN main_image_url IS NOT NULL THEN 1 END) as vehicles_with_images,
    (SELECT COUNT(*) FROM vehicle_group_shares) as total_shares,
    (SELECT COUNT(DISTINCT vehicle_id) FROM vehicle_group_shares) as vehicles_being_shared
FROM vehicles;

DO $$
BEGIN
    RAISE NOTICE '🎉 Enhanced schema v2 setup completed!';
    RAISE NOTICE '📋 Key features: Selective group sharing, Image uploads, Enhanced security';
    RAISE NOTICE '📖 Next: Update your TypeScript types and services to use the new schema';
END $$;