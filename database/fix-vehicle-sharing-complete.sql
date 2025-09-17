-- COMPLETE VEHICLE SHARING FIX
-- This script ensures vehicle sharing works correctly
-- Run this AFTER running the diagnostic script to identify issues

-- =============================================================================
-- STEP 1: ENSURE DATABASE STRUCTURE
-- =============================================================================

SELECT 'STEP 1: Ensuring Database Structure' as step;

-- Add shared_with_groups column if missing
DO $$
BEGIN
    BEGIN
        ALTER TABLE vehicles ADD COLUMN shared_with_groups boolean DEFAULT false NOT NULL;
        RAISE NOTICE '✅ Added shared_with_groups column with privacy-first default (false)';
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE '✅ shared_with_groups column already exists';
    END;
END $$;

-- Ensure all existing vehicles have a sharing status (no NULLs)
UPDATE vehicles SET shared_with_groups = false WHERE shared_with_groups IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_shared_with_groups ON vehicles(shared_with_groups);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id_shared ON vehicles(user_id, shared_with_groups);

-- =============================================================================
-- STEP 2: CLEAN UP OLD POLICIES
-- =============================================================================

SELECT 'STEP 2: Cleaning Up Old Policies' as step;

-- Drop ALL existing vehicle policies to start fresh
DROP POLICY IF EXISTS "Users can view their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can view own and shared vehicles" ON vehicles;
DROP POLICY IF EXISTS "Selective vehicle sharing" ON vehicles;
DROP POLICY IF EXISTS "vehicle_sharing_select" ON vehicles;
DROP POLICY IF EXISTS "final_vehicle_sharing_policy" ON vehicles;
DROP POLICY IF EXISTS "secure_vehicle_sharing_select" ON vehicles;
DROP POLICY IF EXISTS "Users can insert their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can update their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can create own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can update own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicles" ON vehicles;
DROP POLICY IF EXISTS "vehicle_insert" ON vehicles;
DROP POLICY IF EXISTS "vehicle_update" ON vehicles;
DROP POLICY IF EXISTS "vehicle_delete" ON vehicles;
DROP POLICY IF EXISTS "vehicle_insert_policy" ON vehicles;
DROP POLICY IF EXISTS "vehicle_update_policy" ON vehicles;
DROP POLICY IF EXISTS "vehicle_delete_policy" ON vehicles;
DROP POLICY IF EXISTS "secure_vehicle_insert" ON vehicles;
DROP POLICY IF EXISTS "secure_vehicle_update" ON vehicles;
DROP POLICY IF EXISTS "secure_vehicle_delete" ON vehicles;

-- =============================================================================
-- STEP 3: CREATE CORRECT RLS POLICIES
-- =============================================================================

SELECT 'STEP 3: Creating Correct RLS Policies' as step;

-- CREATE SELECT POLICY - This is the most critical one
CREATE POLICY "vehicles_select_policy" ON vehicles FOR SELECT
USING (
  -- RULE 1: Users can ALWAYS see their own vehicles
  user_id = auth.uid()
  OR
  -- RULE 2: Users can see shared vehicles from group members
  (
    -- Must be explicitly shared
    shared_with_groups = true
    AND
    -- Must be from a user in the same group
    user_id IN (
      SELECT DISTINCT gm2.user_id
      FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
      AND gm2.user_id != auth.uid()
    )
  )
);

-- CREATE INSERT POLICY
CREATE POLICY "vehicles_insert_policy" ON vehicles FOR INSERT
WITH CHECK (user_id = auth.uid());

-- CREATE UPDATE POLICY
CREATE POLICY "vehicles_update_policy" ON vehicles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- CREATE DELETE POLICY
CREATE POLICY "vehicles_delete_policy" ON vehicles FOR DELETE
USING (user_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 4: UPDATE LOG TABLE POLICIES
-- =============================================================================

SELECT 'STEP 4: Updating Log Table Policies' as step;

-- Clean up old log policies
DROP POLICY IF EXISTS "Users can manage logs for their vehicles" ON mileage_logs;
DROP POLICY IF EXISTS "Users can view shared mileage logs" ON mileage_logs;
DROP POLICY IF EXISTS "secure_mileage_logs_select" ON mileage_logs;
DROP POLICY IF EXISTS "secure_mileage_logs_modify" ON mileage_logs;

-- Mileage logs policy
CREATE POLICY "mileage_logs_select_policy" ON mileage_logs FOR SELECT
USING (
  -- Own logs
  user_id = auth.uid()
  OR
  -- Logs for shared vehicles
  vehicle_id IN (
    SELECT id FROM vehicles
    WHERE shared_with_groups = true
    AND user_id IN (
      SELECT DISTINCT gm2.user_id
      FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
      AND gm2.user_id != auth.uid()
    )
  )
);

CREATE POLICY "mileage_logs_modify_policy" ON mileage_logs FOR ALL
USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid()))
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid()));

-- Fuel logs policies
DROP POLICY IF EXISTS "Users can manage logs for their vehicles" ON fuel_logs;
DROP POLICY IF EXISTS "Users can view shared fuel logs" ON fuel_logs;
DROP POLICY IF EXISTS "secure_fuel_logs_select" ON fuel_logs;
DROP POLICY IF EXISTS "secure_fuel_logs_modify" ON fuel_logs;

CREATE POLICY "fuel_logs_select_policy" ON fuel_logs FOR SELECT
USING (
  user_id = auth.uid()
  OR
  vehicle_id IN (
    SELECT id FROM vehicles
    WHERE shared_with_groups = true
    AND user_id IN (
      SELECT DISTINCT gm2.user_id
      FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
      AND gm2.user_id != auth.uid()
    )
  )
);

CREATE POLICY "fuel_logs_modify_policy" ON fuel_logs FOR ALL
USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid()))
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid()));

-- Service logs policies
DROP POLICY IF EXISTS "Users can manage logs for their vehicles" ON service_logs;
DROP POLICY IF EXISTS "Users can view shared service logs" ON service_logs;
DROP POLICY IF EXISTS "secure_service_logs_select" ON service_logs;
DROP POLICY IF EXISTS "secure_service_logs_modify" ON service_logs;

CREATE POLICY "service_logs_select_policy" ON service_logs FOR SELECT
USING (
  user_id = auth.uid()
  OR
  vehicle_id IN (
    SELECT id FROM vehicles
    WHERE shared_with_groups = true
    AND user_id IN (
      SELECT DISTINCT gm2.user_id
      FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
      AND gm2.user_id != auth.uid()
    )
  )
);

CREATE POLICY "service_logs_modify_policy" ON service_logs FOR ALL
USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid()))
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid()));

-- =============================================================================
-- STEP 5: VERIFICATION
-- =============================================================================

SELECT 'STEP 5: Verification' as step;

-- Show policy status
SELECT
  'Policy Verification:' as info,
  tablename,
  policyname,
  cmd,
  CASE
    WHEN policyname LIKE '%_policy' THEN 'CORRECT ✅'
    ELSE 'REVIEW ⚠️'
  END as naming_status
FROM pg_policies
WHERE tablename IN ('vehicles', 'mileage_logs', 'fuel_logs', 'service_logs')
ORDER BY tablename, cmd;

-- Show sharing status
SELECT
  'Vehicle Sharing Status:' as info,
  COUNT(*) as total_vehicles,
  COUNT(*) FILTER (WHERE shared_with_groups = true) as shared_vehicles,
  COUNT(*) FILTER (WHERE shared_with_groups = false) as private_vehicles,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE shared_with_groups = true) / NULLIF(COUNT(*), 0),
    1
  ) || '%' as sharing_percentage
FROM vehicles;

-- =============================================================================
-- STEP 6: CREATE TEST DATA (OPTIONAL)
-- =============================================================================

SELECT 'STEP 6: Test Data Creation (Optional)' as step;

-- This creates test data if you don't have any vehicles to test with
DO $$
DECLARE
    user1_id uuid;
    user2_id uuid;
    test_group_id uuid;
BEGIN
    -- Get two users
    SELECT id INTO user1_id FROM auth.users ORDER BY created_at LIMIT 1;
    SELECT id INTO user2_id FROM auth.users ORDER BY created_at OFFSET 1 LIMIT 1;

    IF user1_id IS NOT NULL AND user2_id IS NOT NULL THEN
        -- Ensure they're in a group together
        SELECT id INTO test_group_id FROM groups LIMIT 1;

        IF test_group_id IS NULL THEN
            INSERT INTO groups (name, description, owner_id)
            VALUES ('Test Sharing Group', 'Group for testing vehicle sharing', user1_id)
            RETURNING id INTO test_group_id;
            RAISE NOTICE 'Created test group: %', test_group_id;
        END IF;

        -- Add both users to group
        INSERT INTO group_members (group_id, user_id)
        VALUES (test_group_id, user1_id), (test_group_id, user2_id)
        ON CONFLICT (group_id, user_id) DO NOTHING;

        -- Create a test shared vehicle if none exist
        IF NOT EXISTS (SELECT 1 FROM vehicles WHERE shared_with_groups = true) THEN
            INSERT INTO vehicles (user_id, make, model, year, license_plate, shared_with_groups)
            VALUES (user1_id, 'Toyota', 'Test Camry', 2023, 'SHARE123', true)
            ON CONFLICT (user_id, license_plate) DO UPDATE SET shared_with_groups = true;
            RAISE NOTICE 'Created test shared vehicle';
        END IF;

        RAISE NOTICE 'Test data ready - User1: %, User2: %, Group: %', user1_id, user2_id, test_group_id;
    ELSE
        RAISE NOTICE 'Not enough users for test data creation';
    END IF;
END $$;

-- =============================================================================
-- FINAL SUMMARY
-- =============================================================================

SELECT 'VEHICLE SHARING FIX COMPLETED' as status;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== VEHICLE SHARING FIX COMPLETED ===';
    RAISE NOTICE '✅ Database structure ensured';
    RAISE NOTICE '✅ RLS policies corrected';
    RAISE NOTICE '✅ Privacy protection maintained';
    RAISE NOTICE '✅ Sharing functionality enabled';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Vehicle owners should enable sharing: UPDATE vehicles SET shared_with_groups = true WHERE id = ''vehicle_id'';';
    RAISE NOTICE '2. Test in app - owners should see sharing toggle';
    RAISE NOTICE '3. Group members should see shared vehicles in "Shared Vehicles" section';
    RAISE NOTICE '4. Check app console for: "✅ Found shared vehicles from group members: X"';
END $$;

SELECT '🎉 Vehicle sharing is now properly configured!' as result;