-- =============================================================================
-- DEBUG RLS POLICIES FOR SHARED VEHICLE LOGS
-- =============================================================================
--
-- This script helps diagnose why group members can't edit shared vehicle logs
-- Run this in Supabase SQL Editor to understand the current state
-- =============================================================================

SELECT 'STEP 1: Current RLS Policy State' as debug_step;

-- Check what policies currently exist for log tables
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation
FROM pg_policies
WHERE tablename IN ('mileage_logs', 'fuel_logs', 'service_logs')
ORDER BY tablename, cmd, policyname;

-- =============================================================================

SELECT 'STEP 2: Verify Group Membership Setup' as debug_step;

-- Show current user's groups (replace with your user ID for testing)
-- SELECT
--   gm.group_id,
--   g.name as group_name,
--   g.owner_id
-- FROM group_members gm
-- JOIN groups g ON gm.group_id = g.id
-- WHERE gm.user_id = auth.uid();

-- =============================================================================

SELECT 'STEP 3: Verify Vehicle Sharing Setup' as debug_step;

-- Show vehicles shared with groups (replace with specific vehicle ID if needed)
-- SELECT
--   vgs.vehicle_id,
--   v.make,
--   v.model,
--   v.year,
--   v.license_plate,
--   vgs.group_id,
--   g.name as group_name
-- FROM vehicle_group_shares vgs
-- JOIN vehicles v ON vgs.vehicle_id = v.id
-- JOIN groups g ON vgs.group_id = g.id;

-- =============================================================================

SELECT 'STEP 4: Test Shared Vehicle Access Query' as debug_step;

-- This is the core query that should work for shared vehicle access
-- Uncomment and replace with actual IDs to test:
/*
SELECT DISTINCT vgs.vehicle_id
FROM vehicle_group_shares vgs
JOIN group_members gm ON vgs.group_id = gm.group_id
WHERE gm.user_id = 'YOUR_USER_ID_HERE'
  AND vgs.vehicle_id = 'YOUR_VEHICLE_ID_HERE';
*/

-- =============================================================================

SELECT 'STEP 5: Compare Policy Definitions' as debug_step;

-- Get the actual policy definitions to see what might be wrong
SELECT
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('mileage_logs', 'fuel_logs', 'service_logs')
  AND policyname LIKE '%_update_policy'
ORDER BY tablename;

-- =============================================================================

SELECT 'STEP 6: Check RLS Status' as debug_step;

-- Verify RLS is enabled on the tables
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('mileage_logs', 'fuel_logs', 'service_logs');

-- =============================================================================

SELECT 'Run this script and share the results to diagnose the issue!' as message;