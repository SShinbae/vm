-- MANUAL VEHICLE SHARING TEST
-- Run this to manually test vehicle sharing after fixing the database
-- This helps verify that shared vehicles appear correctly for group members

-- =============================================================================
-- QUICK TEST: Enable Sharing for Testing
-- =============================================================================

SELECT 'MANUAL TEST: Vehicle Sharing' as test_name;

-- Step 1: Get user IDs for testing
SELECT
  'Step 1 - Available Users:' as step,
  u.id as user_id,
  p.email,
  (SELECT COUNT(*) FROM vehicles WHERE user_id = u.id) as vehicle_count
FROM auth.users u
JOIN profiles p ON u.id = p.id
ORDER BY u.created_at
LIMIT 5;

-- Step 2: Show group memberships
SELECT
  'Step 2 - Group Memberships:' as step,
  g.name as group_name,
  p.email as member_email,
  CASE WHEN g.owner_id = gm.user_id THEN 'OWNER' ELSE 'MEMBER' END as role
FROM group_members gm
JOIN groups g ON gm.group_id = g.id
JOIN profiles p ON gm.user_id = p.id
ORDER BY g.name, role DESC;

-- Step 3: Show current vehicle sharing status
SELECT
  'Step 3 - Current Vehicle Status:' as step,
  v.make,
  v.model,
  v.license_plate,
  p.email as owner_email,
  v.shared_with_groups,
  CASE
    WHEN v.shared_with_groups = true THEN 'SHARED ✅'
    ELSE 'PRIVATE 🔒'
  END as status
FROM vehicles v
JOIN profiles p ON v.user_id = p.id
ORDER BY v.shared_with_groups DESC, p.email;

-- =============================================================================
-- ENABLE SHARING FOR FIRST VEHICLE (TESTING)
-- =============================================================================

-- This enables sharing for the first vehicle to test the functionality
DO $$
DECLARE
    test_vehicle_id uuid;
    owner_email text;
BEGIN
    -- Get the first vehicle
    SELECT v.id, p.email INTO test_vehicle_id, owner_email
    FROM vehicles v
    JOIN profiles p ON v.user_id = p.id
    WHERE v.shared_with_groups = false
    ORDER BY v.created_at
    LIMIT 1;

    IF test_vehicle_id IS NOT NULL THEN
        -- Enable sharing for this vehicle
        UPDATE vehicles
        SET shared_with_groups = true
        WHERE id = test_vehicle_id;

        RAISE NOTICE 'ENABLED SHARING for vehicle % (owner: %)', test_vehicle_id, owner_email;
        RAISE NOTICE 'This vehicle should now be visible to group members';
    ELSE
        RAISE NOTICE 'No private vehicles found to enable sharing for';
    END IF;
END $$;

-- =============================================================================
-- TEST QUERIES - What Each User Should See
-- =============================================================================

-- Test for User 1 (replace USER1_ID with actual ID from Step 1)
SELECT 'TEST QUERY for User 1 - Copy user ID from Step 1 above' as instruction;

SELECT 'TEMPLATE: Replace USER1_ID with actual user ID:' as template;
/*
SELECT
  v.make,
  v.model,
  v.license_plate,
  p.email as owner_email,
  v.shared_with_groups,
  CASE
    WHEN v.user_id = 'USER1_ID'::uuid THEN 'MY_VEHICLE'
    WHEN v.shared_with_groups = true THEN 'SHARED_VEHICLE'
    ELSE 'SHOULD_NOT_SEE'
  END as visibility_type
FROM vehicles v
JOIN profiles p ON v.user_id = p.id
WHERE v.user_id = 'USER1_ID'::uuid
   OR (v.shared_with_groups = true AND v.user_id IN (
     SELECT DISTINCT gm2.user_id
     FROM group_members gm1
     JOIN group_members gm2 ON gm1.group_id = gm2.group_id
     WHERE gm1.user_id = 'USER1_ID'::uuid
     AND gm2.user_id != 'USER1_ID'::uuid
   ))
ORDER BY visibility_type, owner_email;
*/

-- =============================================================================
-- EXPECTED RESULTS
-- =============================================================================

SELECT 'EXPECTED RESULTS:' as expectations;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== EXPECTED BEHAVIOR ===';
    RAISE NOTICE '';
    RAISE NOTICE 'VEHICLE OWNERS should see:';
    RAISE NOTICE '- All their own vehicles (both shared and private)';
    RAISE NOTICE '- Shared vehicles from other group members';
    RAISE NOTICE '';
    RAISE NOTICE 'GROUP MEMBERS should see:';
    RAISE NOTICE '- All their own vehicles';
    RAISE NOTICE '- Only vehicles marked shared_with_groups = true from owners';
    RAISE NOTICE '';
    RAISE NOTICE 'APP CONSOLE should show:';
    RAISE NOTICE '- "✅ Found shared vehicles from group members: X"';
    RAISE NOTICE '- "Own vehicles found: Y"';
    RAISE NOTICE '';
    RAISE NOTICE 'IF NO SHARED VEHICLES VISIBLE:';
    RAISE NOTICE '1. Check that vehicles have shared_with_groups = true';
    RAISE NOTICE '2. Check that users are in the same group';
    RAISE NOTICE '3. Check app console for error messages';
END $$;

-- =============================================================================
-- QUICK FIX - ENABLE SHARING FOR ALL VEHICLES (OPTIONAL)
-- =============================================================================

-- Uncomment and run this if you want to enable sharing for ALL vehicles for testing
-- WARNING: This makes all vehicles visible to group members

/*
-- Enable sharing for all vehicles (FOR TESTING ONLY)
UPDATE vehicles SET shared_with_groups = true;
SELECT 'ENABLED SHARING FOR ALL VEHICLES - FOR TESTING ONLY' as warning;
*/

-- =============================================================================
-- VERIFICATION SUMMARY
-- =============================================================================

SELECT 'VERIFICATION SUMMARY:' as summary;

SELECT
  'Final Status:' as status,
  COUNT(*) as total_vehicles,
  COUNT(*) FILTER (WHERE shared_with_groups = true) as shared_vehicles,
  COUNT(*) FILTER (WHERE shared_with_groups = false) as private_vehicles,
  (SELECT COUNT(DISTINCT user_id) FROM group_members) as users_in_groups,
  (SELECT COUNT(*) FROM groups) as total_groups
FROM vehicles;

SELECT '🧪 Manual testing setup complete!' as result;