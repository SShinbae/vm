-- =====================================================
-- FINAL DATABASE FIX - RUN THIS IN SUPABASE SQL EDITOR
-- =====================================================
-- This script contains all the necessary fixes for the 
-- vehicle sharing system V2 migration issues:
-- 1. Infinite recursion in RLS policies
-- 2. Group invitation query problems
-- =====================================================

-- First, run the vehicle recursion fix
-- (This fixes the infinite recursion error)

-- Drop all policies that depend on the functions first
DROP POLICY IF EXISTS "Users can view accessible vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can view own vehicles and shared vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can view shared vehicle images" ON vehicle_images;
DROP POLICY IF EXISTS "Users can view shared vehicle mileage logs" ON mileage_logs;
DROP POLICY IF EXISTS "Users can view shared vehicle fuel logs" ON fuel_logs;
DROP POLICY IF EXISTS "Users can view shared vehicle service logs" ON service_logs;
DROP POLICY IF EXISTS "Users can view shares for their vehicles and groups" ON vehicle_group_shares;
DROP POLICY IF EXISTS "Users can view relevant shares" ON vehicle_group_shares;

-- Now drop existing functions
DROP FUNCTION IF EXISTS get_accessible_vehicle_ids(uuid);
DROP FUNCTION IF EXISTS get_accessible_share_ids(uuid);

-- Function to get accessible vehicle IDs (bypasses RLS)
CREATE OR REPLACE FUNCTION get_accessible_vehicle_ids(user_uuid uuid)
RETURNS TABLE (vehicle_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT v.id as vehicle_id
    FROM vehicles v
    WHERE v.user_id = user_uuid
    
    UNION
    
    SELECT vgs.vehicle_id
    FROM vehicle_group_shares vgs
    JOIN group_members gm ON vgs.group_id = gm.group_id
    WHERE gm.user_id = user_uuid;
END;
$$;

-- Function to get accessible share IDs (bypasses RLS)
CREATE OR REPLACE FUNCTION get_accessible_share_ids(user_uuid uuid)
RETURNS TABLE (share_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT vgs.id as share_id
    FROM vehicle_group_shares vgs
    JOIN vehicles v ON vgs.vehicle_id = v.id
    WHERE v.user_id = user_uuid
    
    UNION
    
    SELECT vgs.id as share_id
    FROM vehicle_group_shares vgs
    JOIN group_members gm ON vgs.group_id = gm.group_id
    WHERE gm.user_id = user_uuid;
END;
$$;

-- Update vehicles RLS policy to use the function
CREATE POLICY "Users can view own vehicles and shared vehicles" ON vehicles
    FOR SELECT USING (
        id IN (SELECT vehicle_id FROM get_accessible_vehicle_ids(auth.uid()))
    );

-- Update vehicle_group_shares RLS policy to use the function  
CREATE POLICY "Users can view shares for their vehicles and groups" ON vehicle_group_shares
    FOR SELECT USING (
        id IN (SELECT share_id FROM get_accessible_share_ids(auth.uid()))
    );

-- Recreate other vehicle-related policies that depend on the function
CREATE POLICY "Users can view shared vehicle images" ON vehicle_images
    FOR SELECT USING (
        vehicle_id IN (SELECT vehicle_id FROM get_accessible_vehicle_ids(auth.uid()))
    );

CREATE POLICY "Users can view shared vehicle mileage logs" ON mileage_logs
    FOR SELECT USING (
        vehicle_id IN (SELECT vehicle_id FROM get_accessible_vehicle_ids(auth.uid()))
    );

CREATE POLICY "Users can view shared vehicle fuel logs" ON fuel_logs
    FOR SELECT USING (
        vehicle_id IN (SELECT vehicle_id FROM get_accessible_vehicle_ids(auth.uid()))
    );

CREATE POLICY "Users can view shared vehicle service logs" ON service_logs
    FOR SELECT USING (
        vehicle_id IN (SELECT vehicle_id FROM get_accessible_vehicle_ids(auth.uid()))
    );

-- =====================================================
-- Second, run the group invitations fix
-- (This fixes the null groups/profiles issue)

-- Drop existing invitation functions first to avoid conflicts
DROP FUNCTION IF EXISTS get_user_invitations_with_details(text);
DROP FUNCTION IF EXISTS get_group_invitations_with_details(uuid);

-- Function to get user invitations with full details (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_invitations_with_details(user_email text)
RETURNS TABLE (
    invitation_id uuid,
    group_id uuid,
    group_name text,
    group_description text,
    invited_by_id uuid,
    invited_by_name text,
    invited_by_email text,
    status invitation_status,
    created_at timestamp with time zone,
    expires_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        gi.id as invitation_id,
        gi.group_id,
        g.name as group_name,
        g.description as group_description,
        gi.invited_by as invited_by_id,
        p.full_name as invited_by_name,
        p.email as invited_by_email,
        gi.status,
        gi.created_at,
        gi.expires_at
    FROM group_invitations gi
    JOIN groups g ON gi.group_id = g.id
    JOIN profiles p ON gi.invited_by = p.id
    WHERE gi.email = user_email
    ORDER BY gi.created_at DESC;
END;
$$;

-- Function to get group invitations for group owners (bypasses RLS)
CREATE OR REPLACE FUNCTION get_group_invitations_with_details(group_uuid uuid)
RETURNS TABLE (
    invitation_id uuid,
    group_id uuid,
    group_name text,
    group_description text,
    invited_email text,
    invited_by_id uuid,
    invited_by_name text,
    invited_by_email text,
    status invitation_status,
    created_at timestamp with time zone,
    expires_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        gi.id as invitation_id,
        gi.group_id,
        g.name as group_name,
        g.description as group_description,
        gi.email as invited_email,
        gi.invited_by as invited_by_id,
        p.full_name as invited_by_name,
        p.email as invited_by_email,
        gi.status,
        gi.created_at,
        gi.expires_at
    FROM group_invitations gi
    JOIN groups g ON gi.group_id = g.id
    JOIN profiles p ON gi.invited_by = p.id
    WHERE gi.group_id = group_uuid
    ORDER BY gi.created_at DESC;
END;
$$;

-- =====================================================
-- VERIFICATION QUERIES (optional - run these to test)
-- =====================================================

-- Test 1: Check if vehicle recursion is fixed
-- SELECT * FROM get_accessible_vehicle_ids(auth.uid());

-- Test 2: Check if invitation queries work
-- SELECT * FROM get_user_invitations_with_details('your-email@example.com');

-- Test 3: Check if you can query vehicles without recursion
-- SELECT id, make, model, owner_id FROM vehicles LIMIT 5;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
-- After running this script:
-- 1. The infinite recursion error should be fixed
-- 2. Group invitations should return proper group/profile data
-- 3. All V2 sharing functionality should work correctly
-- =====================================================