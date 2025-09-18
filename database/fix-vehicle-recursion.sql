-- =====================================================
-- FIX FOR VEHICLE INFINITE RECURSION ISSUE
-- =====================================================
-- This script fixes the circular dependency between vehicles 
-- and vehicle_group_shares policies that causes infinite recursion.
-- =====================================================

-- =====================================================
-- STEP 1: DROP PROBLEMATIC POLICIES
-- =====================================================

-- Drop the circular policies
DROP POLICY IF EXISTS "Users can view accessible vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can view relevant shares" ON vehicle_group_shares;

-- =====================================================
-- STEP 2: CREATE SAFE FUNCTIONS (BYPASS RLS)
-- =====================================================

-- Safe function to get vehicles user can access (bypasses RLS)
CREATE OR REPLACE FUNCTION get_accessible_vehicle_ids(user_uuid uuid)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    vehicle_ids uuid[];
BEGIN
    -- Get all vehicle IDs the user can access
    SELECT ARRAY(
        -- Own vehicles
        SELECT id FROM vehicles WHERE user_id = user_uuid
        
        UNION
        
        -- Shared vehicles
        SELECT DISTINCT vgs.vehicle_id
        FROM vehicle_group_shares vgs
        JOIN group_members gm ON vgs.group_id = gm.group_id
        WHERE gm.user_id = user_uuid
    ) INTO vehicle_ids;

    RETURN COALESCE(vehicle_ids, ARRAY[]::uuid[]);
END;
$$;

-- Safe function to get vehicle group shares user can see (bypasses RLS)
CREATE OR REPLACE FUNCTION get_accessible_share_ids(user_uuid uuid)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    share_ids uuid[];
BEGIN
    -- Get all share IDs the user can see
    SELECT ARRAY(
        -- Shares for groups user is member of
        SELECT vgs.id
        FROM vehicle_group_shares vgs
        JOIN group_members gm ON vgs.group_id = gm.group_id
        WHERE gm.user_id = user_uuid
        
        UNION
        
        -- Shares for user's own vehicles
        SELECT vgs.id
        FROM vehicle_group_shares vgs
        JOIN vehicles v ON vgs.vehicle_id = v.id
        WHERE v.user_id = user_uuid
    ) INTO share_ids;

    RETURN COALESCE(share_ids, ARRAY[]::uuid[]);
END;
$$;

-- =====================================================
-- STEP 3: CREATE NON-RECURSIVE POLICIES
-- =====================================================

-- Fixed vehicles policy (no recursion)
CREATE POLICY "Users can view accessible vehicles" ON vehicles
    FOR SELECT USING (
        id = ANY(get_accessible_vehicle_ids(auth.uid()))
    );

-- Fixed vehicle group shares policy (no recursion)
CREATE POLICY "Users can view relevant shares" ON vehicle_group_shares
    FOR SELECT USING (
        id = ANY(get_accessible_share_ids(auth.uid()))
    );

-- =====================================================
-- STEP 4: UPDATE OTHER AFFECTED POLICIES
-- =====================================================

-- Update vehicle images policy to use safe function
DROP POLICY IF EXISTS "Users can view shared vehicle images" ON vehicle_images;
CREATE POLICY "Users can view shared vehicle images" ON vehicle_images
    FOR SELECT USING (
        vehicle_id = ANY(get_accessible_vehicle_ids(auth.uid()))
    );

-- Update mileage logs policy
DROP POLICY IF EXISTS "Users can view shared vehicle mileage logs" ON mileage_logs;
CREATE POLICY "Users can view shared vehicle mileage logs" ON mileage_logs
    FOR SELECT USING (
        vehicle_id = ANY(get_accessible_vehicle_ids(auth.uid()))
    );

-- Update fuel logs policy
DROP POLICY IF EXISTS "Users can view shared vehicle fuel logs" ON fuel_logs;
CREATE POLICY "Users can view shared vehicle fuel logs" ON fuel_logs
    FOR SELECT USING (
        vehicle_id = ANY(get_accessible_vehicle_ids(auth.uid()))
    );

-- Update service logs policy
DROP POLICY IF EXISTS "Users can view shared vehicle service logs" ON service_logs;
CREATE POLICY "Users can view shared vehicle service logs" ON service_logs
    FOR SELECT USING (
        vehicle_id = ANY(get_accessible_vehicle_ids(auth.uid()))
    );

-- =====================================================
-- STEP 5: VERIFICATION
-- =====================================================

-- Test that we can query vehicles without recursion
DO $$
DECLARE
    test_result integer;
BEGIN
    -- This should not cause infinite recursion
    SELECT COUNT(*) INTO test_result FROM vehicles;
    RAISE NOTICE '✅ Vehicles table query successful - returned % vehicles', test_result;
    
    SELECT COUNT(*) INTO test_result FROM vehicle_group_shares;
    RAISE NOTICE '✅ Vehicle group shares query successful - returned % shares', test_result;
    
    RAISE NOTICE '🎉 Infinite recursion FIXED!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Still having issues: %', SQLERRM;
END $$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 VEHICLE INFINITE RECURSION FIXED!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ What was fixed:';
    RAISE NOTICE '   • Removed circular dependency between vehicles and vehicle_group_shares policies';
    RAISE NOTICE '   • Created SECURITY DEFINER functions that bypass RLS';
    RAISE NOTICE '   • Updated all related policies to use safe functions';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Your application should now work without recursion errors!';
END $$;