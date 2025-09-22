-- =============================================================================
-- COMPLETE RLS FIX AND TEST FOR SHARED VEHICLE LOGS
-- =============================================================================
--
-- This script does a complete reset and rebuild of RLS policies with testing
-- It also includes verification queries to ensure everything works
-- =============================================================================

SELECT 'Starting complete RLS fix with verification...' as status;

-- =============================================================================
-- STEP 1: COMPLETELY REMOVE ALL EXISTING POLICIES (COMPREHENSIVE)
-- =============================================================================

SELECT 'STEP 1: Removing ALL existing policies for log tables...' as step;

-- Drop every possible policy name that might exist
-- Mileage logs
DROP POLICY IF EXISTS "mileage_logs_select_policy" ON mileage_logs;
DROP POLICY IF EXISTS "mileage_logs_insert_policy" ON mileage_logs;
DROP POLICY IF EXISTS "mileage_logs_update_policy" ON mileage_logs;
DROP POLICY IF EXISTS "mileage_logs_delete_policy" ON mileage_logs;
DROP POLICY IF EXISTS "mileage_logs_modify_policy" ON mileage_logs;
DROP POLICY IF EXISTS "secure_mileage_logs_modify" ON mileage_logs;
DROP POLICY IF EXISTS "Users can insert own mileage logs" ON mileage_logs;
DROP POLICY IF EXISTS "Users can update own mileage logs" ON mileage_logs;
DROP POLICY IF EXISTS "Users can delete own mileage logs" ON mileage_logs;
DROP POLICY IF EXISTS "Users can view shared vehicle mileage logs" ON mileage_logs;
DROP POLICY IF EXISTS "Users can manage own vehicle mileage logs" ON mileage_logs;

-- Fuel logs
DROP POLICY IF EXISTS "fuel_logs_select_policy" ON fuel_logs;
DROP POLICY IF EXISTS "fuel_logs_insert_policy" ON fuel_logs;
DROP POLICY IF EXISTS "fuel_logs_update_policy" ON fuel_logs;
DROP POLICY IF EXISTS "fuel_logs_delete_policy" ON fuel_logs;
DROP POLICY IF EXISTS "fuel_logs_modify_policy" ON fuel_logs;
DROP POLICY IF EXISTS "secure_fuel_logs_modify" ON fuel_logs;
DROP POLICY IF EXISTS "Users can insert own fuel logs" ON fuel_logs;
DROP POLICY IF EXISTS "Users can update own fuel logs" ON fuel_logs;
DROP POLICY IF EXISTS "Users can delete own fuel logs" ON fuel_logs;
DROP POLICY IF EXISTS "Users can view shared vehicle fuel logs" ON fuel_logs;
DROP POLICY IF EXISTS "Users can manage own vehicle fuel logs" ON fuel_logs;

-- Service logs
DROP POLICY IF EXISTS "service_logs_select_policy" ON service_logs;
DROP POLICY IF EXISTS "service_logs_insert_policy" ON service_logs;
DROP POLICY IF EXISTS "service_logs_update_policy" ON service_logs;
DROP POLICY IF EXISTS "service_logs_delete_policy" ON service_logs;
DROP POLICY IF EXISTS "service_logs_modify_policy" ON service_logs;
DROP POLICY IF EXISTS "secure_service_logs_modify" ON service_logs;
DROP POLICY IF EXISTS "Users can insert own service logs" ON service_logs;
DROP POLICY IF EXISTS "Users can update own service logs" ON service_logs;
DROP POLICY IF EXISTS "Users can delete own service logs" ON service_logs;
DROP POLICY IF EXISTS "Users can view shared vehicle service logs" ON service_logs;
DROP POLICY IF EXISTS "Users can manage own vehicle service logs" ON service_logs;

SELECT 'All existing policies removed.' as status;

-- =============================================================================
-- STEP 2: CREATE SIMPLIFIED BUT EFFECTIVE POLICIES
-- =============================================================================

SELECT 'STEP 2: Creating new simplified policies...' as step;

-- MILEAGE LOGS POLICIES
-- Allow viewing logs for owned vehicles OR shared vehicles through groups
CREATE POLICY "mileage_select_shared" ON mileage_logs
FOR SELECT USING (
  -- Own vehicles
  vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
  OR
  -- Shared vehicles through groups
  vehicle_id IN (
    SELECT DISTINCT vgs.vehicle_id
    FROM vehicle_group_shares vgs
    INNER JOIN group_members gm ON vgs.group_id = gm.group_id
    WHERE gm.user_id = auth.uid()
  )
);

-- Allow inserting logs with proper user_id and vehicle access
CREATE POLICY "mileage_insert_shared" ON mileage_logs
FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND (
    -- Own vehicles
    vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
    OR
    -- Shared vehicles through groups
    vehicle_id IN (
      SELECT DISTINCT vgs.vehicle_id
      FROM vehicle_group_shares vgs
      INNER JOIN group_members gm ON vgs.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  )
);

-- Allow updating logs for accessible vehicles (own or shared)
CREATE POLICY "mileage_update_shared" ON mileage_logs
FOR UPDATE USING (
  -- Own vehicles
  vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
  OR
  -- Shared vehicles through groups
  vehicle_id IN (
    SELECT DISTINCT vgs.vehicle_id
    FROM vehicle_group_shares vgs
    INNER JOIN group_members gm ON vgs.group_id = gm.group_id
    WHERE gm.user_id = auth.uid()
  )
);

-- Allow deleting logs for accessible vehicles (own or shared)
CREATE POLICY "mileage_delete_shared" ON mileage_logs
FOR DELETE USING (
  -- Own vehicles
  vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
  OR
  -- Shared vehicles through groups
  vehicle_id IN (
    SELECT DISTINCT vgs.vehicle_id
    FROM vehicle_group_shares vgs
    INNER JOIN group_members gm ON vgs.group_id = gm.group_id
    WHERE gm.user_id = auth.uid()
  )
);

-- FUEL LOGS POLICIES (same logic)
CREATE POLICY "fuel_select_shared" ON fuel_logs
FOR SELECT USING (
  vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
  OR
  vehicle_id IN (
    SELECT DISTINCT vgs.vehicle_id
    FROM vehicle_group_shares vgs
    INNER JOIN group_members gm ON vgs.group_id = gm.group_id
    WHERE gm.user_id = auth.uid()
  )
);

CREATE POLICY "fuel_insert_shared" ON fuel_logs
FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND (
    vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
    OR
    vehicle_id IN (
      SELECT DISTINCT vgs.vehicle_id
      FROM vehicle_group_shares vgs
      INNER JOIN group_members gm ON vgs.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  )
);

CREATE POLICY "fuel_update_shared" ON fuel_logs
FOR UPDATE USING (
  vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
  OR
  vehicle_id IN (
    SELECT DISTINCT vgs.vehicle_id
    FROM vehicle_group_shares vgs
    INNER JOIN group_members gm ON vgs.group_id = gm.group_id
    WHERE gm.user_id = auth.uid()
  )
);

CREATE POLICY "fuel_delete_shared" ON fuel_logs
FOR DELETE USING (
  vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
  OR
  vehicle_id IN (
    SELECT DISTINCT vgs.vehicle_id
    FROM vehicle_group_shares vgs
    INNER JOIN group_members gm ON vgs.group_id = gm.group_id
    WHERE gm.user_id = auth.uid()
  )
);

-- SERVICE LOGS POLICIES (same logic)
CREATE POLICY "service_select_shared" ON service_logs
FOR SELECT USING (
  vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
  OR
  vehicle_id IN (
    SELECT DISTINCT vgs.vehicle_id
    FROM vehicle_group_shares vgs
    INNER JOIN group_members gm ON vgs.group_id = gm.group_id
    WHERE gm.user_id = auth.uid()
  )
);

CREATE POLICY "service_insert_shared" ON service_logs
FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND (
    vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
    OR
    vehicle_id IN (
      SELECT DISTINCT vgs.vehicle_id
      FROM vehicle_group_shares vgs
      INNER JOIN group_members gm ON vgs.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  )
);

CREATE POLICY "service_update_shared" ON service_logs
FOR UPDATE USING (
  vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
  OR
  vehicle_id IN (
    SELECT DISTINCT vgs.vehicle_id
    FROM vehicle_group_shares vgs
    INNER JOIN group_members gm ON vgs.group_id = gm.group_id
    WHERE gm.user_id = auth.uid()
  )
);

CREATE POLICY "service_delete_shared" ON service_logs
FOR DELETE USING (
  vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
  OR
  vehicle_id IN (
    SELECT DISTINCT vgs.vehicle_id
    FROM vehicle_group_shares vgs
    INNER JOIN group_members gm ON vgs.group_id = gm.group_id
    WHERE gm.user_id = auth.uid()
  )
);

-- =============================================================================
-- STEP 3: VERIFICATION
-- =============================================================================

SELECT 'STEP 3: Verifying policies were created...' as step;

-- Show all new policies
SELECT
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename IN ('mileage_logs', 'fuel_logs', 'service_logs')
ORDER BY tablename, cmd;

-- =============================================================================
-- STEP 4: TEST SCENARIOS (Comment/Uncomment as needed)
-- =============================================================================

SELECT 'STEP 4: Ready for testing!' as step;

-- Test queries (uncomment and replace with real IDs to test):

-- Test 1: Check if user can see shared vehicles
/*
SELECT 'Test 1: Shared vehicles for current user' as test;
SELECT DISTINCT vgs.vehicle_id, v.make, v.model, v.year
FROM vehicle_group_shares vgs
INNER JOIN group_members gm ON vgs.group_id = gm.group_id
INNER JOIN vehicles v ON vgs.vehicle_id = v.id
WHERE gm.user_id = auth.uid();
*/

-- Test 2: Try updating a mileage log for a shared vehicle
/*
SELECT 'Test 2: Update test for shared vehicle log' as test;
UPDATE mileage_logs
SET notes = 'Test update from member'
WHERE id = 'YOUR_LOG_ID_HERE';
*/

-- =============================================================================

SELECT 'RLS policies have been completely rebuilt!' as status;
SELECT 'Group members should now be able to edit/delete logs for shared vehicles.' as message;
SELECT 'Test by having a group member try to edit a mileage or fuel log for a shared vehicle.' as instruction;