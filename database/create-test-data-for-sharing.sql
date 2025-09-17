-- Create Test Data for Vehicle Sharing
-- Run this AFTER running the comprehensive-vehicle-sharing-fix.sql script
-- This will create test scenarios to verify vehicle sharing works

-- =============================================================================
-- STEP 1: Check current users and create test group if needed
-- =============================================================================

-- Check current users
SELECT id, email, created_at FROM auth.users ORDER BY created_at LIMIT 5;
SELECT id, email, full_name FROM profiles ORDER BY created_at LIMIT 5;

-- Check if there are any groups
SELECT id, name, owner_id, created_at FROM groups ORDER BY created_at;

-- =============================================================================
-- STEP 2: Create a test group (only if you don't have one)
-- =============================================================================

-- First, get some user IDs to work with
-- Replace USER1_ID and USER2_ID with actual user IDs from the queries above

-- Example: Create a test group if none exist
-- INSERT INTO groups (name, description, owner_id)
-- VALUES ('Test Sharing Group', 'Group for testing vehicle sharing', 'USER1_ID_HERE'::uuid);

-- Example: Add members to the group
-- First get the group ID:
-- SELECT id FROM groups WHERE name = 'Test Sharing Group';

-- Then add members (replace GROUP_ID with actual group ID):
-- INSERT INTO group_members (group_id, user_id)
-- VALUES
--   ('GROUP_ID_HERE'::uuid, 'USER1_ID_HERE'::uuid),
--   ('GROUP_ID_HERE'::uuid, 'USER2_ID_HERE'::uuid);

-- =============================================================================
-- STEP 3: Set some vehicles as shared for testing
-- =============================================================================

-- Check current vehicles
SELECT id, user_id, make, model, year, shared_with_groups, created_at
FROM vehicles
ORDER BY created_at DESC;

-- Make some vehicles shared (you can modify this based on your vehicles)
-- Option 1: Make all vehicles shared (for quick testing)
UPDATE vehicles SET shared_with_groups = true;

-- Option 2: Make only specific vehicles shared (replace vehicle IDs)
-- UPDATE vehicles
-- SET shared_with_groups = true
-- WHERE id IN ('VEHICLE_ID_1'::uuid, 'VEHICLE_ID_2'::uuid);

-- Option 3: Make vehicles from specific users shared
-- UPDATE vehicles
-- SET shared_with_groups = true
-- WHERE user_id = 'USER_ID_HERE'::uuid;

-- =============================================================================
-- STEP 4: Verification - Test the sharing logic manually
-- =============================================================================

-- Test 1: Check which vehicles should be visible to each user
-- Replace USER_ID_HERE with actual user IDs

-- For User 1:
/*
SELECT v.id, v.user_id, v.make, v.model, v.shared_with_groups,
       p.email as owner_email,
       CASE
         WHEN v.user_id = 'USER1_ID_HERE'::uuid THEN 'own_vehicle'
         WHEN v.shared_with_groups = true THEN 'shared_vehicle'
         ELSE 'private_vehicle'
       END as visibility_type
FROM vehicles v
LEFT JOIN profiles p ON v.user_id = p.id
WHERE v.user_id = 'USER1_ID_HERE'::uuid
   OR (v.shared_with_groups = true AND v.user_id IN (
     SELECT DISTINCT gm2.user_id
     FROM group_members gm1
     JOIN group_members gm2 ON gm1.group_id = gm2.group_id
     WHERE gm1.user_id = 'USER1_ID_HERE'::uuid
     AND gm2.user_id != 'USER1_ID_HERE'::uuid
   ))
ORDER BY visibility_type, v.created_at DESC;
*/

-- Test 2: Check group memberships
SELECT gm.user_id, p.email, g.name as group_name, gm.joined_at
FROM group_members gm
JOIN profiles p ON gm.user_id = p.id
JOIN groups g ON gm.group_id = g.id
ORDER BY g.name, p.email;

-- Test 3: Summary of test data
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM groups) as total_groups,
  (SELECT COUNT(*) FROM group_members) as total_group_members,
  (SELECT COUNT(*) FROM vehicles) as total_vehicles,
  (SELECT COUNT(*) FROM vehicles WHERE shared_with_groups = true) as shared_vehicles;

-- =============================================================================
-- STEP 5: Create minimal test scenario if no data exists
-- =============================================================================

-- If you have less than 2 users, this suggests you need to create test accounts
-- through your app's registration flow, not through SQL

DO $$
DECLARE
    user_count integer;
    group_count integer;
    vehicle_count integer;
BEGIN
    SELECT COUNT(*) INTO user_count FROM auth.users;
    SELECT COUNT(*) INTO group_count FROM groups;
    SELECT COUNT(*) INTO vehicle_count FROM vehicles;

    RAISE NOTICE 'Current data summary:';
    RAISE NOTICE '- Users: %', user_count;
    RAISE NOTICE '- Groups: %', group_count;
    RAISE NOTICE '- Vehicles: %', vehicle_count;

    IF user_count < 2 THEN
        RAISE NOTICE 'You need at least 2 users to test vehicle sharing.';
        RAISE NOTICE 'Please create user accounts through your app registration.';
    END IF;

    IF group_count = 0 THEN
        RAISE NOTICE 'You need at least 1 group to test vehicle sharing.';
        RAISE NOTICE 'Please create a group through your app.';
    END IF;

    IF vehicle_count = 0 THEN
        RAISE NOTICE 'You need at least 1 vehicle to test vehicle sharing.';
        RAISE NOTICE 'Please create vehicles through your app.';
    END IF;

    IF user_count >= 2 AND group_count > 0 AND vehicle_count > 0 THEN
        RAISE NOTICE '✅ You have sufficient data to test vehicle sharing!';
        RAISE NOTICE 'Next: Make sure users are in the same group and vehicles are marked as shared.';
    END IF;
END $$;

SELECT '🧪 Test data setup completed!' as result;