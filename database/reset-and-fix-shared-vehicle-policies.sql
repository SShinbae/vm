-- =============================================================================
-- RESET AND FIX SHARED VEHICLE LOG RLS POLICIES
-- =============================================================================
--
-- This script completely resets and rebuilds the RLS policies for log tables
-- to ensure group members can edit/delete logs for shared vehicles
-- =============================================================================

SELECT 'Starting complete RLS policy reset and fix for shared vehicle logs...' as status;

-- =============================================================================
-- STEP 1: COMPLETELY REMOVE ALL EXISTING LOG TABLE POLICIES
-- =============================================================================

SELECT 'STEP 1: Removing all existing policies for log tables...' as step;

-- Drop ALL policies for mileage_logs
DROP POLICY IF EXISTS "mileage_logs_select_policy" ON mileage_logs;
DROP POLICY IF EXISTS "mileage_logs_insert_policy" ON mileage_logs;
DROP POLICY IF EXISTS "mileage_logs_update_policy" ON mileage_logs;
DROP POLICY IF EXISTS "mileage_logs_delete_policy" ON mileage_logs;
DROP POLICY IF EXISTS "mileage_logs_modify_policy" ON mileage_logs;
DROP POLICY IF EXISTS "secure_mileage_logs_modify" ON mileage_logs;
DROP POLICY IF EXISTS "Users can insert own mileage logs" ON mileage_logs;
DROP POLICY IF EXISTS "Users can update own mileage logs" ON mileage_logs;
DROP POLICY IF EXISTS "Users can view shared vehicle mileage logs" ON mileage_logs;
DROP POLICY IF EXISTS "Users can manage own vehicle mileage logs" ON mileage_logs;

-- Drop ALL policies for fuel_logs
DROP POLICY IF EXISTS "fuel_logs_select_policy" ON fuel_logs;
DROP POLICY IF EXISTS "fuel_logs_insert_policy" ON fuel_logs;
DROP POLICY IF EXISTS "fuel_logs_update_policy" ON fuel_logs;
DROP POLICY IF EXISTS "fuel_logs_delete_policy" ON fuel_logs;
DROP POLICY IF EXISTS "fuel_logs_modify_policy" ON fuel_logs;
DROP POLICY IF EXISTS "secure_fuel_logs_modify" ON fuel_logs;
DROP POLICY IF EXISTS "Users can insert own fuel logs" ON fuel_logs;
DROP POLICY IF EXISTS "Users can update own fuel logs" ON fuel_logs;
DROP POLICY IF EXISTS "Users can view shared vehicle fuel logs" ON fuel_logs;
DROP POLICY IF EXISTS "Users can manage own vehicle fuel logs" ON fuel_logs;

-- Drop ALL policies for service_logs
DROP POLICY IF EXISTS "service_logs_select_policy" ON service_logs;
DROP POLICY IF EXISTS "service_logs_insert_policy" ON service_logs;
DROP POLICY IF EXISTS "service_logs_update_policy" ON service_logs;
DROP POLICY IF EXISTS "service_logs_delete_policy" ON service_logs;
DROP POLICY IF EXISTS "service_logs_modify_policy" ON service_logs;
DROP POLICY IF EXISTS "secure_service_logs_modify" ON service_logs;
DROP POLICY IF EXISTS "Users can insert own service logs" ON service_logs;
DROP POLICY IF EXISTS "Users can update own service logs" ON service_logs;
DROP POLICY IF EXISTS "Users can view shared vehicle service logs" ON service_logs;
DROP POLICY IF EXISTS "Users can manage own vehicle service logs" ON service_logs;

SELECT 'All existing policies removed.' as status;

-- =============================================================================
-- STEP 2: CREATE NEW COMPREHENSIVE POLICIES FOR MILEAGE LOGS
-- =============================================================================

SELECT 'STEP 2: Creating new mileage_logs policies...' as step;

-- SELECT policy: Allow viewing logs for owned and shared vehicles
CREATE POLICY "mileage_logs_select_policy" ON mileage_logs
FOR SELECT USING (
  -- Can view logs for owned vehicles
  vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
  OR
  -- Can view logs for shared vehicles through group membership
  vehicle_id IN (
    SELECT vgs.vehicle_id
    FROM vehicle_group_shares vgs
    JOIN group_members gm ON vgs.group_id = gm.group_id
    WHERE gm.user_id = auth.uid()
  )
);

-- INSERT policy: Allow creating logs for owned and shared vehicles
CREATE POLICY "mileage_logs_insert_policy" ON mileage_logs
FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND (
    -- Can insert logs for owned vehicles
    vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
    OR
    -- Can insert logs for shared vehicles through group membership
    vehicle_id IN (
      SELECT vgs.vehicle_id
      FROM vehicle_group_shares vgs
      JOIN group_members gm ON vgs.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  )
);

-- UPDATE policy: Allow updating logs for owned and shared vehicles
CREATE POLICY "mileage_logs_update_policy" ON mileage_logs
FOR UPDATE USING (
  user_id = auth.uid()
  AND (
    -- Can update logs for owned vehicles
    vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
    OR
    -- Can update logs for shared vehicles through group membership
    vehicle_id IN (
      SELECT vgs.vehicle_id
      FROM vehicle_group_shares vgs
      JOIN group_members gm ON vgs.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND (
    -- Can update logs for owned vehicles
    vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
    OR
    -- Can update logs for shared vehicles through group membership
    vehicle_id IN (
      SELECT vgs.vehicle_id
      FROM vehicle_group_shares vgs
      JOIN group_members gm ON vgs.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  )
);

-- DELETE policy: Allow deleting logs for owned and shared vehicles
CREATE POLICY "mileage_logs_delete_policy" ON mileage_logs
FOR DELETE USING (
  user_id = auth.uid()
  AND (
    -- Can delete logs for owned vehicles
    vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
    OR
    -- Can delete logs for shared vehicles through group membership
    vehicle_id IN (
      SELECT vgs.vehicle_id
      FROM vehicle_group_shares vgs
      JOIN group_members gm ON vgs.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  )
);

-- =============================================================================
-- STEP 3: CREATE NEW COMPREHENSIVE POLICIES FOR FUEL LOGS
-- =============================================================================

SELECT 'STEP 3: Creating new fuel_logs policies...' as step;

-- SELECT policy: Allow viewing logs for owned and shared vehicles
CREATE POLICY "fuel_logs_select_policy" ON fuel_logs
FOR SELECT USING (
  -- Can view logs for owned vehicles
  vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
  OR
  -- Can view logs for shared vehicles through group membership
  vehicle_id IN (
    SELECT vgs.vehicle_id
    FROM vehicle_group_shares vgs
    JOIN group_members gm ON vgs.group_id = gm.group_id
    WHERE gm.user_id = auth.uid()
  )
);

-- INSERT policy: Allow creating logs for owned and shared vehicles
CREATE POLICY "fuel_logs_insert_policy" ON fuel_logs
FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND (
    -- Can insert logs for owned vehicles
    vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
    OR
    -- Can insert logs for shared vehicles through group membership
    vehicle_id IN (
      SELECT vgs.vehicle_id
      FROM vehicle_group_shares vgs
      JOIN group_members gm ON vgs.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  )
);

-- UPDATE policy: Allow updating logs for owned and shared vehicles
CREATE POLICY "fuel_logs_update_policy" ON fuel_logs
FOR UPDATE USING (
  user_id = auth.uid()
  AND (
    -- Can update logs for owned vehicles
    vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
    OR
    -- Can update logs for shared vehicles through group membership
    vehicle_id IN (
      SELECT vgs.vehicle_id
      FROM vehicle_group_shares vgs
      JOIN group_members gm ON vgs.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND (
    -- Can update logs for owned vehicles
    vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
    OR
    -- Can update logs for shared vehicles through group membership
    vehicle_id IN (
      SELECT vgs.vehicle_id
      FROM vehicle_group_shares vgs
      JOIN group_members gm ON vgs.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  )
);

-- DELETE policy: Allow deleting logs for owned and shared vehicles
CREATE POLICY "fuel_logs_delete_policy" ON fuel_logs
FOR DELETE USING (
  user_id = auth.uid()
  AND (
    -- Can delete logs for owned vehicles
    vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
    OR
    -- Can delete logs for shared vehicles through group membership
    vehicle_id IN (
      SELECT vgs.vehicle_id
      FROM vehicle_group_shares vgs
      JOIN group_members gm ON vgs.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  )
);

-- =============================================================================
-- STEP 4: CREATE NEW COMPREHENSIVE POLICIES FOR SERVICE LOGS
-- =============================================================================

SELECT 'STEP 4: Creating new service_logs policies...' as step;

-- SELECT policy: Allow viewing logs for owned and shared vehicles
CREATE POLICY "service_logs_select_policy" ON service_logs
FOR SELECT USING (
  -- Can view logs for owned vehicles
  vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
  OR
  -- Can view logs for shared vehicles through group membership
  vehicle_id IN (
    SELECT vgs.vehicle_id
    FROM vehicle_group_shares vgs
    JOIN group_members gm ON vgs.group_id = gm.group_id
    WHERE gm.user_id = auth.uid()
  )
);

-- INSERT policy: Allow creating logs for owned and shared vehicles
CREATE POLICY "service_logs_insert_policy" ON service_logs
FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND (
    -- Can insert logs for owned vehicles
    vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
    OR
    -- Can insert logs for shared vehicles through group membership
    vehicle_id IN (
      SELECT vgs.vehicle_id
      FROM vehicle_group_shares vgs
      JOIN group_members gm ON vgs.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  )
);

-- UPDATE policy: Allow updating logs for owned and shared vehicles
CREATE POLICY "service_logs_update_policy" ON service_logs
FOR UPDATE USING (
  user_id = auth.uid()
  AND (
    -- Can update logs for owned vehicles
    vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
    OR
    -- Can update logs for shared vehicles through group membership
    vehicle_id IN (
      SELECT vgs.vehicle_id
      FROM vehicle_group_shares vgs
      JOIN group_members gm ON vgs.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND (
    -- Can update logs for owned vehicles
    vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
    OR
    -- Can update logs for shared vehicles through group membership
    vehicle_id IN (
      SELECT vgs.vehicle_id
      FROM vehicle_group_shares vgs
      JOIN group_members gm ON vgs.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  )
);

-- DELETE policy: Allow deleting logs for owned and shared vehicles
CREATE POLICY "service_logs_delete_policy" ON service_logs
FOR DELETE USING (
  user_id = auth.uid()
  AND (
    -- Can delete logs for owned vehicles
    vehicle_id IN (SELECT id FROM vehicles WHERE user_id = auth.uid())
    OR
    -- Can delete logs for shared vehicles through group membership
    vehicle_id IN (
      SELECT vgs.vehicle_id
      FROM vehicle_group_shares vgs
      JOIN group_members gm ON vgs.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  )
);

-- =============================================================================
-- STEP 5: VERIFICATION
-- =============================================================================

SELECT 'STEP 5: Verifying all policies were created correctly...' as step;

-- Show all policies for the log tables
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE
    WHEN cmd = 'SELECT' THEN 'SELECT'
    WHEN cmd = 'INSERT' THEN 'INSERT'
    WHEN cmd = 'UPDATE' THEN 'UPDATE'
    WHEN cmd = 'DELETE' THEN 'DELETE'
    ELSE cmd
  END as operation
FROM pg_policies
WHERE tablename IN ('mileage_logs', 'fuel_logs', 'service_logs')
ORDER BY tablename, cmd, policyname;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

SELECT 'RLS policy reset and fix completed successfully!' as status;
SELECT 'Group members should now be able to edit and delete logs for shared vehicles.' as message;
SELECT 'Please test the edit/delete functionality for shared vehicle logs.' as next_step;