-- =============================================================================
-- FIX SHARED VEHICLE LOG CREATION RLS POLICIES
-- =============================================================================
--
-- PROBLEM: Group members cannot add logs to shared vehicles due to restrictive
-- RLS policies that only allow operations on owned vehicles.
--
-- SOLUTION: Update RLS policies to allow log creation for both owned vehicles
-- and shared vehicles that users have access to through group membership.
-- =============================================================================

SELECT 'Starting RLS policy fix for shared vehicle log creation...' as status;

-- =============================================================================
-- STEP 1: UPDATE MILEAGE LOGS POLICIES
-- =============================================================================

SELECT 'STEP 1: Updating mileage_logs RLS policies...' as step;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "mileage_logs_modify_policy" ON mileage_logs;
DROP POLICY IF EXISTS "secure_mileage_logs_modify" ON mileage_logs;

-- Create new INSERT policy that allows both owned and shared vehicle access
CREATE POLICY "mileage_logs_insert_policy" ON mileage_logs FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND (
    -- Can insert logs for owned vehicles
    EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid())
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

-- Create new UPDATE policy that allows both owned and shared vehicle access
CREATE POLICY "mileage_logs_update_policy" ON mileage_logs FOR UPDATE
USING (
  user_id = auth.uid()
  AND (
    -- Can update logs for owned vehicles
    EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid())
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
    EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid())
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

-- Create new DELETE policy that allows both owned and shared vehicle access
CREATE POLICY "mileage_logs_delete_policy" ON mileage_logs FOR DELETE
USING (
  user_id = auth.uid()
  AND (
    -- Can delete logs for owned vehicles
    EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid())
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
-- STEP 2: UPDATE FUEL LOGS POLICIES
-- =============================================================================

SELECT 'STEP 2: Updating fuel_logs RLS policies...' as step;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "fuel_logs_modify_policy" ON fuel_logs;
DROP POLICY IF EXISTS "secure_fuel_logs_modify" ON fuel_logs;

-- Create new INSERT policy that allows both owned and shared vehicle access
CREATE POLICY "fuel_logs_insert_policy" ON fuel_logs FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND (
    -- Can insert logs for owned vehicles
    EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid())
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

-- Create new UPDATE policy that allows both owned and shared vehicle access
CREATE POLICY "fuel_logs_update_policy" ON fuel_logs FOR UPDATE
USING (
  user_id = auth.uid()
  AND (
    -- Can update logs for owned vehicles
    EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid())
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
    EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid())
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

-- Create new DELETE policy that allows both owned and shared vehicle access
CREATE POLICY "fuel_logs_delete_policy" ON fuel_logs FOR DELETE
USING (
  user_id = auth.uid()
  AND (
    -- Can delete logs for owned vehicles
    EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid())
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
-- STEP 3: UPDATE SERVICE LOGS POLICIES
-- =============================================================================

SELECT 'STEP 3: Updating service_logs RLS policies...' as step;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "service_logs_modify_policy" ON service_logs;
DROP POLICY IF EXISTS "secure_service_logs_modify" ON service_logs;

-- Create new INSERT policy that allows both owned and shared vehicle access
CREATE POLICY "service_logs_insert_policy" ON service_logs FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND (
    -- Can insert logs for owned vehicles
    EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid())
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

-- Create new UPDATE policy that allows both owned and shared vehicle access
CREATE POLICY "service_logs_update_policy" ON service_logs FOR UPDATE
USING (
  user_id = auth.uid()
  AND (
    -- Can update logs for owned vehicles
    EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid())
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
    EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid())
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

-- Create new DELETE policy that allows both owned and shared vehicle access
CREATE POLICY "service_logs_delete_policy" ON service_logs FOR DELETE
USING (
  user_id = auth.uid()
  AND (
    -- Can delete logs for owned vehicles
    EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid())
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
-- STEP 4: ENSURE RLS IS ENABLED ON ALL LOG TABLES
-- =============================================================================

SELECT 'STEP 4: Ensuring RLS is enabled on all log tables...' as step;

ALTER TABLE mileage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_logs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 5: VERIFY POLICIES ARE CREATED
-- =============================================================================

SELECT 'STEP 5: Verifying policies are created...' as step;

-- Show all policies for log tables
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE
    WHEN cmd = 'INSERT' THEN 'INSERT'
    WHEN cmd = 'SELECT' THEN 'SELECT'
    WHEN cmd = 'UPDATE' THEN 'UPDATE'
    WHEN cmd = 'DELETE' THEN 'DELETE'
    WHEN cmd = 'ALL' THEN 'ALL'
    ELSE cmd
  END as operation
FROM pg_policies
WHERE tablename IN ('mileage_logs', 'fuel_logs', 'service_logs')
ORDER BY tablename, cmd, policyname;

SELECT 'RLS policy fix completed successfully! Group members should now be able to add logs to shared vehicles.' as status;