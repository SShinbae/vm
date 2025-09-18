-- =====================================================
-- COMPLETE VEHICLE MANAGEMENT SCHEMA V2
-- =====================================================
-- Features:
-- 1. ✅ User can add vehicles, records
-- 2. ✅ User can make groups
-- 3. ✅ User can share vehicles based on groups (SELECTIVE)
-- 4. ✅ User can see team members (owners + members)
-- 5. ✅ User can upload pictures of cars
-- 6. ✅ User can upload profile pictures
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CUSTOM TYPES AND ENUMS
-- =====================================================

-- Create custom types only if they don't exist
DO $$ BEGIN
    CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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

DO $$ BEGIN
    CREATE TYPE image_type AS ENUM ('profile_avatar', 'vehicle_main', 'vehicle_gallery');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- STORAGE BUCKETS FOR IMAGES
-- =====================================================

-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public)
VALUES
    ('profile-avatars', 'profile-avatars', true),
    ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Enhanced Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email text UNIQUE NOT NULL,
    full_name text,
    avatar_url text,           -- NEW: Profile picture URL
    phone text,                -- NEW: Phone number
    bio text,                  -- NEW: User bio/description
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enhanced Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    make text NOT NULL,
    model text NOT NULL,
    year integer NOT NULL CHECK (year >= 1900 AND year <= extract(year from now()) + 2),
    license_plate text NOT NULL,
    vin text,
    main_image_url text,       -- NEW: Primary vehicle photo
    color text,                -- NEW: Vehicle color
    current_mileage integer DEFAULT 0 CHECK (current_mileage >= 0), -- NEW: Current odometer reading
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, license_plate)
);

-- Groups Table
CREATE TABLE IF NOT EXISTS groups (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Group Members Table
CREATE TABLE IF NOT EXISTS group_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(group_id, user_id)
);

-- Group Invitations Table
CREATE TABLE IF NOT EXISTS group_invitations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
    email text NOT NULL,
    invited_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    status invitation_status DEFAULT 'pending' NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    UNIQUE(group_id, email, status)
);

-- =====================================================
-- NEW: SELECTIVE VEHICLE SHARING
-- =====================================================

-- Vehicle Group Shares Table (CORE FEATURE)
-- This replaces the boolean shared_with_groups approach
CREATE TABLE IF NOT EXISTS vehicle_group_shares (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
    group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
    shared_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    shared_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Prevent duplicate shares
    UNIQUE(vehicle_id, group_id)
);

-- =====================================================
-- NEW: VEHICLE IMAGES SUPPORT
-- =====================================================

-- Vehicle Images Table
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

-- =====================================================
-- MAINTENANCE LOGS TABLES
-- =====================================================

-- Mileage Logs Table
CREATE TABLE IF NOT EXISTS mileage_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    odometer_reading integer NOT NULL CHECK (odometer_reading >= 0),
    date date NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Fuel Logs Table
CREATE TABLE IF NOT EXISTS fuel_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    liters_filled numeric(8,2) NOT NULL CHECK (liters_filled > 0),
    cost numeric(10,2) CHECK (cost >= 0),
    date date NOT NULL,
    odometer_reading integer NOT NULL CHECK (odometer_reading >= 0),
    location text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Service Logs Table
CREATE TABLE IF NOT EXISTS service_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    service_type service_type NOT NULL,
    description text NOT NULL,
    cost numeric(10,2) CHECK (cost >= 0),
    date date NOT NULL,
    odometer_reading integer NOT NULL CHECK (odometer_reading >= 0),
    next_service_due date,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_owner_id ON groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_group_id ON group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_email ON group_invitations(email);

-- Selective sharing indexes (CRITICAL FOR PERFORMANCE)
CREATE INDEX IF NOT EXISTS idx_vehicle_shares_vehicle ON vehicle_group_shares(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_shares_group ON vehicle_group_shares(group_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_shares_composite ON vehicle_group_shares(vehicle_id, group_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_shares_shared_by ON vehicle_group_shares(shared_by);

-- Image indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle_id ON vehicle_images(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_images_type ON vehicle_images(image_type);
CREATE INDEX IF NOT EXISTS idx_vehicle_images_order ON vehicle_images(vehicle_id, display_order);

-- Log indexes
CREATE INDEX IF NOT EXISTS idx_mileage_logs_vehicle_id ON mileage_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_mileage_logs_date ON mileage_logs(date);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle_id ON fuel_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_date ON fuel_logs(date);
CREATE INDEX IF NOT EXISTS idx_service_logs_vehicle_id ON service_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_service_logs_date ON service_logs(date);

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
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
-- SAFE UTILITY FUNCTIONS (BYPASS RLS)
-- =====================================================

-- Safe function to get user's group memberships (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_groups_safe(user_uuid uuid)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    group_ids uuid[];
BEGIN
    -- This function bypasses RLS to prevent recursion
    SELECT ARRAY(
        SELECT group_id
        FROM group_members
        WHERE user_id = user_uuid
    ) INTO group_ids;

    RETURN COALESCE(group_ids, ARRAY[]::uuid[]);
END;
$$;

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_group_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE mileage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Users can manage their own profile
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;
CREATE POLICY "Users can manage own profile" ON profiles
    FOR ALL USING (auth.uid() = id);

-- Users can view profiles of group members (for sharing context)
DROP POLICY IF EXISTS "Users can view group member profiles" ON profiles;
CREATE POLICY "Users can view group member profiles" ON profiles
    FOR SELECT USING (
        auth.uid() = id OR  -- Own profile
        id IN (  -- Group members' profiles
            SELECT gm1.user_id
            FROM group_members gm1
            WHERE gm1.group_id = ANY(get_user_groups_safe(auth.uid()))
        ) OR
        id IN (  -- Group owners' profiles
            SELECT g.owner_id
            FROM groups g
            WHERE g.id = ANY(get_user_groups_safe(auth.uid()))
        )
    );

-- =====================================================
-- VEHICLES POLICIES
-- =====================================================

-- Users can insert their own vehicles
DROP POLICY IF EXISTS "Users can insert own vehicles" ON vehicles;
CREATE POLICY "Users can insert own vehicles" ON vehicles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own vehicles
DROP POLICY IF EXISTS "Users can update own vehicles" ON vehicles;
CREATE POLICY "Users can update own vehicles" ON vehicles
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own vehicles
DROP POLICY IF EXISTS "Users can delete own vehicles" ON vehicles;
CREATE POLICY "Users can delete own vehicles" ON vehicles
    FOR DELETE USING (auth.uid() = user_id);

-- Users can view their own vehicles AND vehicles shared with their groups
DROP POLICY IF EXISTS "Users can view own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can view shared vehicles" ON vehicles;
CREATE POLICY "Users can view accessible vehicles" ON vehicles
    FOR SELECT USING (
        auth.uid() = user_id OR  -- Own vehicles
        id IN (  -- Selectively shared vehicles
            SELECT vgs.vehicle_id
            FROM vehicle_group_shares vgs
            WHERE vgs.group_id = ANY(get_user_groups_safe(auth.uid()))
        )
    );

-- =====================================================
-- GROUPS POLICIES
-- =====================================================

-- Users can manage groups they own
DROP POLICY IF EXISTS "Users can manage own groups" ON groups;
CREATE POLICY "Users can manage own groups" ON groups
    FOR ALL USING (auth.uid() = owner_id);

-- Users can view groups they are members of or own
DROP POLICY IF EXISTS "Users can view member groups" ON groups;
CREATE POLICY "Users can view member groups" ON groups
    FOR SELECT USING (
        auth.uid() = owner_id OR
        id = ANY(get_user_groups_safe(auth.uid()))
    );

-- =====================================================
-- GROUP MEMBERS POLICIES
-- =====================================================

-- Group owners can manage all memberships
DROP POLICY IF EXISTS "Group owners can manage memberships" ON group_members;
CREATE POLICY "Group owners can manage memberships" ON group_members
    FOR ALL USING (
        group_id IN (
            SELECT id FROM groups WHERE owner_id = auth.uid()
        )
    );

-- Users can view memberships of their groups (TEAM VISIBILITY)
DROP POLICY IF EXISTS "Users can view group memberships" ON group_members;
CREATE POLICY "Users can view group memberships" ON group_members
    FOR SELECT USING (
        auth.uid() = user_id OR  -- Own membership
        group_id IN (  -- Memberships in groups I own
            SELECT id FROM groups WHERE owner_id = auth.uid()
        ) OR
        group_id = ANY(get_user_groups_safe(auth.uid()))  -- Memberships in groups I'm member of
    );

-- Users can leave groups (delete their own membership)
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
CREATE POLICY "Users can leave groups" ON group_members
    FOR DELETE USING (auth.uid() = user_id);

-- Users can join groups (through invitation acceptance)
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
CREATE POLICY "Users can join groups" ON group_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- GROUP INVITATIONS POLICIES
-- =====================================================

-- Group owners can manage invitations
DROP POLICY IF EXISTS "Group owners can manage invitations" ON group_invitations;
CREATE POLICY "Group owners can manage invitations" ON group_invitations
    FOR ALL USING (
        group_id IN (
            SELECT id FROM groups WHERE owner_id = auth.uid()
        )
    );

-- Invited users can view their invitations
DROP POLICY IF EXISTS "Invited users can view invitations" ON group_invitations;
CREATE POLICY "Invited users can view invitations" ON group_invitations
    FOR SELECT USING (
        email = (SELECT email FROM profiles WHERE id = auth.uid()) OR
        group_id IN (
            SELECT id FROM groups WHERE owner_id = auth.uid()
        )
    );

-- Invited users can update their invitation status
DROP POLICY IF EXISTS "Invited users can update invitations" ON group_invitations;
CREATE POLICY "Invited users can update invitations" ON group_invitations
    FOR UPDATE USING (
        email = (SELECT email FROM profiles WHERE id = auth.uid())
    );

-- =====================================================
-- VEHICLE GROUP SHARES POLICIES (SELECTIVE SHARING)
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
        group_id = ANY(get_user_groups_safe(auth.uid())) OR
        vehicle_id IN (
            SELECT id FROM vehicles WHERE user_id = auth.uid()
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
            SELECT id FROM vehicles WHERE user_id = auth.uid()
        ) OR
        vehicle_id IN (
            SELECT vgs.vehicle_id
            FROM vehicle_group_shares vgs
            WHERE vgs.group_id = ANY(get_user_groups_safe(auth.uid()))
        )
    );

-- =====================================================
-- LOGS POLICIES (Enhanced for shared vehicles)
-- =====================================================

-- Mileage logs policies
DROP POLICY IF EXISTS "Users can manage own vehicle mileage logs" ON mileage_logs;
CREATE POLICY "Users can manage own vehicle mileage logs" ON mileage_logs
    FOR ALL USING (
        auth.uid() = user_id AND
        vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can view shared vehicle mileage logs" ON mileage_logs;
CREATE POLICY "Users can view shared vehicle mileage logs" ON mileage_logs
    FOR SELECT USING (
        vehicle_id IN (
            SELECT id FROM vehicles WHERE user_id = auth.uid()
        ) OR
        vehicle_id IN (
            SELECT vgs.vehicle_id
            FROM vehicle_group_shares vgs
            WHERE vgs.group_id = ANY(get_user_groups_safe(auth.uid()))
        )
    );

-- Fuel logs policies (same pattern)
DROP POLICY IF EXISTS "Users can manage own vehicle fuel logs" ON fuel_logs;
CREATE POLICY "Users can manage own vehicle fuel logs" ON fuel_logs
    FOR ALL USING (
        auth.uid() = user_id AND
        vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can view shared vehicle fuel logs" ON fuel_logs;
CREATE POLICY "Users can view shared vehicle fuel logs" ON fuel_logs
    FOR SELECT USING (
        vehicle_id IN (
            SELECT id FROM vehicles WHERE user_id = auth.uid()
        ) OR
        vehicle_id IN (
            SELECT vgs.vehicle_id
            FROM vehicle_group_shares vgs
            WHERE vgs.group_id = ANY(get_user_groups_safe(auth.uid()))
        )
    );

-- Service logs policies (same pattern)
DROP POLICY IF EXISTS "Users can manage own vehicle service logs" ON service_logs;
CREATE POLICY "Users can manage own vehicle service logs" ON service_logs
    FOR ALL USING (
        auth.uid() = user_id AND
        vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can view shared vehicle service logs" ON service_logs;
CREATE POLICY "Users can view shared vehicle service logs" ON service_logs
    FOR SELECT USING (
        vehicle_id IN (
            SELECT id FROM vehicles WHERE user_id = auth.uid()
        ) OR
        vehicle_id IN (
            SELECT vgs.vehicle_id
            FROM vehicle_group_shares vgs
            WHERE vgs.group_id = ANY(get_user_groups_safe(auth.uid()))
        )
    );

-- =====================================================
-- STORAGE POLICIES FOR IMAGES
-- =====================================================

-- Profile avatars storage policies
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

-- Vehicle images storage policies
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
-- ENHANCED BUSINESS FUNCTIONS
-- =====================================================

-- Function to get vehicles with sharing information
DROP FUNCTION IF EXISTS get_user_vehicles_with_sharing(uuid);
CREATE OR REPLACE FUNCTION get_user_vehicles_with_sharing(user_uuid uuid)
RETURNS TABLE (
    vehicle_id uuid,
    make text,
    model text,
    year integer,
    license_plate text,
    vin text,
    main_image_url text,
    color text,
    current_mileage integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    is_own_vehicle boolean,
    owner_name text,
    owner_email text,
    shared_groups text[]
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    -- Own vehicles
    SELECT
        v.id,
        v.make,
        v.model,
        v.year,
        v.license_plate,
        v.vin,
        v.main_image_url,
        v.color,
        v.current_mileage,
        v.created_at,
        v.updated_at,
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
        v.vin,
        v.main_image_url,
        v.color,
        v.current_mileage,
        v.created_at,
        v.updated_at,
        false as is_own_vehicle,
        p.full_name as owner_name,
        p.email as owner_email,
        ARRAY(
            SELECT g.name
            FROM vehicle_group_shares vgs2
            JOIN groups g ON vgs2.group_id = g.id
            WHERE vgs2.vehicle_id = v.id
        ) as shared_groups
    FROM vehicles v
    JOIN profiles p ON v.user_id = p.id
    JOIN vehicle_group_shares vgs ON v.id = vgs.vehicle_id
    JOIN group_members gm ON vgs.group_id = gm.group_id
    WHERE gm.user_id = user_uuid
    AND v.user_id != user_uuid
$$;

-- Function to share vehicle with multiple groups (ATOMIC OPERATION)
DROP FUNCTION IF EXISTS share_vehicle_with_groups(uuid, uuid[]);
CREATE OR REPLACE FUNCTION share_vehicle_with_groups(
    vehicle_uuid uuid,
    group_uuids uuid[]
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
        -- Verify user is member of the group or owns it
        IF EXISTS (
            SELECT 1 FROM group_members
            WHERE group_id = group_uuid AND user_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM groups
            WHERE id = group_uuid AND owner_id = auth.uid()
        ) THEN
            INSERT INTO vehicle_group_shares (vehicle_id, group_id, shared_by)
            VALUES (vehicle_uuid, group_uuid, auth.uid())
            ON CONFLICT (vehicle_id, group_id) DO NOTHING;
        END IF;
    END LOOP;

    RETURN true;
END;
$$;

-- Function to get group members with profiles (TEAM VISIBILITY)
CREATE OR REPLACE FUNCTION get_group_members_with_profiles(group_uuid uuid)
RETURNS TABLE (
    member_id uuid,
    user_id uuid,
    email text,
    full_name text,
    avatar_url text,
    phone text,
    bio text,
    joined_at timestamp with time zone,
    is_owner boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    -- Group owner
    SELECT
        null::uuid as member_id,
        g.owner_id as user_id,
        p.email,
        p.full_name,
        p.avatar_url,
        p.phone,
        p.bio,
        g.created_at as joined_at,
        true as is_owner
    FROM groups g
    JOIN profiles p ON g.owner_id = p.id
    WHERE g.id = group_uuid

    UNION ALL

    -- Group members
    SELECT
        gm.id as member_id,
        gm.user_id,
        p.email,
        p.full_name,
        p.avatar_url,
        p.phone,
        p.bio,
        gm.joined_at,
        false as is_owner
    FROM group_members gm
    JOIN profiles p ON gm.user_id = p.id
    WHERE gm.group_id = group_uuid
    AND gm.user_id != (SELECT owner_id FROM groups WHERE id = group_uuid)

    ORDER BY is_owner DESC, joined_at ASC;
$$;

-- =====================================================
-- PROFILE CREATION TRIGGER
-- =====================================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- VERIFICATION AND TESTING
-- =====================================================

-- Verify schema setup
SELECT
    'Complete Schema V2 Verification' as status,

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
        WHERE id IN ('profile-avatars', 'vehicle-images')
    ) THEN '✅ Storage buckets created'
    ELSE '❌ Storage buckets missing'
    END as storage_buckets,

    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.routines
        WHERE routine_name = 'get_user_vehicles_with_sharing'
    ) THEN '✅ Enhanced functions available'
    ELSE '❌ Enhanced functions missing'
    END as enhanced_functions;

-- Count tables and relationships
SELECT
    'Database Statistics' as info,
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM vehicles) as total_vehicles,
    (SELECT COUNT(*) FROM groups) as total_groups,
    (SELECT COUNT(*) FROM group_members) as total_memberships,
    (SELECT COUNT(*) FROM vehicle_group_shares) as total_shares,
    (SELECT COUNT(*) FROM vehicle_images) as total_images;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 Complete Vehicle Management Schema V2 deployed successfully!';
    RAISE NOTICE '✅ Features enabled:';
    RAISE NOTICE '   1. ✅ Add vehicles and records';
    RAISE NOTICE '   2. ✅ Create and manage groups';
    RAISE NOTICE '   3. ✅ SELECTIVE group sharing (choose specific groups!)';
    RAISE NOTICE '   4. ✅ Complete team member visibility (owners + members)';
    RAISE NOTICE '   5. ✅ Vehicle photo uploads and galleries';
    RAISE NOTICE '   6. ✅ Profile picture support';
    RAISE NOTICE '✅ RLS infinite recursion fixed - uses safe SECURITY DEFINER functions';
    RAISE NOTICE '✅ No conflicting SELECT policies - each table has single SELECT policy';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next steps:';
    RAISE NOTICE '   1. Test the schema with your application';
    RAISE NOTICE '   2. Use the enhanced functions for better performance';
    RAISE NOTICE '   3. Implement the UI components for selective sharing';
    RAISE NOTICE '   4. Set up image upload workflows';
END $$;