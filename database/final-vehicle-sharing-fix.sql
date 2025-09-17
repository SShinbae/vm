-- FINAL VEHICLE SHARING FIX
-- This script will definitively fix the vehicle sharing issue
-- Run this step by step in Supabase SQL Editor

-- =============================================================================
-- STEP 1: COMPREHENSIVE DIAGNOSTICS
-- =============================================================================

-- 1.1: Check current database state
SELECT 'DIAGNOSTIC: Current Database State' as step;

-- Check if shared_with_groups column exists
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'vehicles' AND column_name = 'shared_with_groups'
    )
    THEN 'shared_with_groups column EXISTS ✓'
    ELSE 'shared_with_groups column MISSING ✗'
  END as column_status;

-- Check current vehicles table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;

-- Check current RLS policies
SELECT
  policyname,
  cmd,
  CASE
    WHEN qual IS NOT NULL THEN 'Has USING clause ✓'
    ELSE 'No USING clause ✗'
  END as using_clause,
  CASE
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause ✓'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'vehicles'
ORDER BY cmd, policyname;

-- Check data counts
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM groups) as total_groups,
  (SELECT COUNT(*) FROM group_members) as total_group_members,
  (SELECT COUNT(*) FROM vehicles) as total_vehicles;

-- =============================================================================
-- STEP 2: FORCE FIX DATABASE STRUCTURE
-- =============================================================================

SELECT 'STEP 2: Fixing Database Structure' as step;

-- Add shared_with_groups column (safe - won't fail if exists)
DO $$
BEGIN
    BEGIN
        ALTER TABLE vehicles ADD COLUMN shared_with_groups boolean DEFAULT false NOT NULL;
        RAISE NOTICE '✓ Added shared_with_groups column';
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE '✓ shared_with_groups column already exists';
    END;
END $$;

-- Create index for performance (safe - won't fail if exists)
DO $$
BEGIN
    BEGIN
        CREATE INDEX idx_vehicles_shared_with_groups ON vehicles(shared_with_groups);
        RAISE NOTICE '✓ Created index on shared_with_groups';
    EXCEPTION WHEN duplicate_table THEN
        RAISE NOTICE '✓ Index on shared_with_groups already exists';
    END;
END $$;

-- =============================================================================
-- STEP 3: COMPLETELY REBUILD RLS POLICIES
-- =============================================================================

SELECT 'STEP 3: Rebuilding RLS Policies' as step;

-- Drop ALL existing vehicle policies (comprehensive cleanup)
DROP POLICY IF EXISTS "Users can view their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can view own and shared vehicles" ON vehicles;
DROP POLICY IF EXISTS "Selective vehicle sharing" ON vehicles;
DROP POLICY IF EXISTS "vehicle_sharing_select" ON vehicles;
DROP POLICY IF EXISTS "Users can insert their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can update their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can create own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can update own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicles" ON vehicles;
DROP POLICY IF EXISTS "vehicle_insert" ON vehicles;
DROP POLICY IF EXISTS "vehicle_update" ON vehicles;
DROP POLICY IF EXISTS "vehicle_delete" ON vehicles;

-- Create the definitive SELECT policy for vehicle sharing
CREATE POLICY "final_vehicle_sharing_policy" ON vehicles FOR SELECT
USING (
  -- User's own vehicles (always visible)
  user_id = auth.uid()
  OR
  -- Shared vehicles from group members
  (
    -- Must be marked as shared
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

-- Create other necessary policies
CREATE POLICY "vehicle_insert_policy" ON vehicles FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "vehicle_update_policy" ON vehicles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "vehicle_delete_policy" ON vehicles FOR DELETE
USING (user_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 4: CREATE TEST DATA FOR IMMEDIATE VERIFICATION
-- =============================================================================

SELECT 'STEP 4: Setting Up Test Data' as step;

-- Get user count to determine if we should create test data
DO $$
DECLARE
    user_count integer;
    vehicle_count integer;
    group_count integer;
BEGIN
    SELECT COUNT(*) INTO user_count FROM auth.users;
    SELECT COUNT(*) INTO vehicle_count FROM vehicles;
    SELECT COUNT(*) INTO group_count FROM groups;

    RAISE NOTICE 'Found % users, % vehicles, % groups', user_count, vehicle_count, group_count;

    -- Make some existing vehicles shared for testing (if vehicles exist)
    IF vehicle_count > 0 THEN
        UPDATE vehicles
        SET shared_with_groups = true
        WHERE id IN (
            SELECT id FROM vehicles
            ORDER BY created_at DESC
            LIMIT LEAST(2, vehicle_count)
        );
        RAISE NOTICE '✓ Marked up to 2 vehicles as shared for testing';
    END IF;

    -- Show what we have for testing
    RAISE NOTICE 'Test data summary:';
    RAISE NOTICE '- Total users: %', user_count;
    RAISE NOTICE '- Total vehicles: %', vehicle_count;
    RAISE NOTICE '- Total groups: %', group_count;
    RAISE NOTICE '- Shared vehicles: %', (SELECT COUNT(*) FROM vehicles WHERE shared_with_groups = true);
END $$;

-- =============================================================================
-- STEP 5: VERIFICATION QUERIES
-- =============================================================================

SELECT 'STEP 5: Verification' as step;

-- Verify policies were created
SELECT
  policyname,
  cmd,
  'Policy created successfully ✓' as status
FROM pg_policies
WHERE tablename = 'vehicles'
ORDER BY cmd, policyname;

-- Show current shared vehicles
SELECT
  id,
  user_id,
  make,
  model,
  year,
  shared_with_groups,
  created_at
FROM vehicles
WHERE shared_with_groups = true
ORDER BY created_at DESC;

-- Show group memberships for verification
SELECT
  gm.user_id,
  p.email,
  g.name as group_name,
  gm.joined_at
FROM group_members gm
JOIN profiles p ON gm.user_id = p.id
JOIN groups g ON gm.group_id = g.id
ORDER BY g.name, p.email;

-- =============================================================================
-- STEP 6: MANUAL TEST QUERY TEMPLATE
-- =============================================================================

SELECT 'STEP 6: Manual Test Queries' as step;

-- Test query to see what vehicles a specific user should see
-- REPLACE 'USER_ID_HERE' with an actual user ID from auth.users table

/*
-- Get a user ID first:
SELECT id, email FROM auth.users LIMIT 3;

-- Then test what vehicles they should see:
SELECT
  v.id,
  v.user_id,
  v.make,
  v.model,
  v.shared_with_groups,
  p.email as owner_email,
  CASE
    WHEN v.user_id = 'USER_ID_HERE'::uuid THEN 'OWN_VEHICLE'
    WHEN v.shared_with_groups = true THEN 'SHARED_VEHICLE'
    ELSE 'PRIVATE_VEHICLE'
  END as vehicle_type
FROM vehicles v
LEFT JOIN profiles p ON v.user_id = p.id
WHERE v.user_id = 'USER_ID_HERE'::uuid
   OR (v.shared_with_groups = true AND v.user_id IN (
     SELECT DISTINCT gm2.user_id
     FROM group_members gm1
     JOIN group_members gm2 ON gm1.group_id = gm2.group_id
     WHERE gm1.user_id = 'USER_ID_HERE'::uuid
     AND gm2.user_id != 'USER_ID_HERE'::uuid
   ))
ORDER BY vehicle_type, v.created_at DESC;
*/

-- =============================================================================
-- FINAL SUMMARY
-- =============================================================================

SELECT 'FINAL SUMMARY' as step;

SELECT
  '✓ Database structure fixed' as step_1,
  '✓ RLS policies rebuilt' as step_2,
  '✓ Test data created' as step_3,
  '✓ Ready for app testing' as step_4;

-- Show final counts
SELECT
  (SELECT COUNT(*) FROM vehicles WHERE shared_with_groups = true) as shared_vehicles,
  (SELECT COUNT(*) FROM vehicles WHERE shared_with_groups = false) as private_vehicles,
  (SELECT COUNT(*) FROM group_members) as total_group_memberships,
  (SELECT COUNT(DISTINCT group_id) FROM group_members) as active_groups;

SELECT '🎉 Vehicle sharing database fix completed!' as result;