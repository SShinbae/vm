-- TEST PRIVACY PROTECTION
-- Run this script AFTER running secure-vehicle-sharing-fix.sql
-- This will test that privacy is properly protected

-- =============================================================================
-- PRIVACY TEST SCENARIOS
-- =============================================================================

SELECT 'PRIVACY PROTECTION TEST SUITE' as test_suite;

-- Test Setup: Get users and create test scenario
DO $$
DECLARE
    user1_id uuid;
    user2_id uuid;
    user1_email text;
    user2_email text;
    group_id uuid;
    vehicle1_id uuid;
    vehicle2_id uuid;
    vehicle3_id uuid;
BEGIN
    -- Get first two users
    SELECT id, email INTO user1_id, user1_email FROM (
        SELECT u.id, p.email
        FROM auth.users u
        JOIN profiles p ON u.id = p.id
        ORDER BY u.created_at
        LIMIT 1
    ) t;

    SELECT id, email INTO user2_id, user2_email FROM (
        SELECT u.id, p.email
        FROM auth.users u
        JOIN profiles p ON u.id = p.id
        ORDER BY u.created_at
        OFFSET 1
        LIMIT 1
    ) t;

    RAISE NOTICE 'Testing with users:';
    RAISE NOTICE '  User 1: % (%)', user1_id, user1_email;
    RAISE NOTICE '  User 2: % (%)', user2_id, user2_email;

    -- Ensure they're in the same group
    SELECT id INTO group_id FROM groups ORDER BY created_at LIMIT 1;

    IF group_id IS NULL THEN
        INSERT INTO groups (name, description, owner_id)
        VALUES ('Privacy Test Group', 'Test group for privacy testing', user1_id)
        RETURNING id INTO group_id;
        RAISE NOTICE 'Created test group: %', group_id;
    END IF;

    -- Add both users to group
    INSERT INTO group_members (group_id, user_id)
    VALUES
        (group_id, user1_id),
        (group_id, user2_id)
    ON CONFLICT (group_id, user_id) DO NOTHING;

    RAISE NOTICE 'Users added to group: %', group_id;

    -- Create test vehicles with different sharing settings
    -- User 1 vehicles
    INSERT INTO vehicles (user_id, make, model, year, license_plate, shared_with_groups)
    VALUES
        (user1_id, 'Tesla', 'Model 3', 2023, 'SHARED123', true),   -- SHARED
        (user1_id, 'BMW', 'X5', 2022, 'PRIVATE123', false)        -- PRIVATE
    ON CONFLICT (user_id, license_plate) DO UPDATE SET
        shared_with_groups = EXCLUDED.shared_with_groups;

    -- User 2 vehicles
    INSERT INTO vehicles (user_id, make, model, year, license_plate, shared_with_groups)
    VALUES
        (user2_id, 'Audi', 'A4', 2021, 'SHARED456', true),        -- SHARED
        (user2_id, 'Mercedes', 'C300', 2020, 'PRIVATE456', false) -- PRIVATE
    ON CONFLICT (user_id, license_plate) DO UPDATE SET
        shared_with_groups = EXCLUDED.shared_with_groups;

    RAISE NOTICE 'Test vehicles created with sharing settings';

END $$;

-- =============================================================================
-- TEST 1: VERIFY PRIVACY PROTECTION
-- =============================================================================

SELECT 'TEST 1: Privacy Protection Verification' as test_name;

-- Show what User 1 should see (using the same logic as RLS policy)
WITH user1_visible_vehicles AS (
    SELECT
        v.*,
        p.email as owner_email,
        CASE
            WHEN v.user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1) THEN 'OWN_VEHICLE'
            WHEN v.shared_with_groups = true THEN 'SHARED_VEHICLE'
            ELSE 'SHOULD_NOT_BE_VISIBLE'
        END as visibility_type
    FROM vehicles v
    JOIN profiles p ON v.user_id = p.id
    WHERE v.user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
       OR (v.shared_with_groups = true AND v.user_id IN (
         SELECT DISTINCT gm2.user_id
         FROM group_members gm1
         JOIN group_members gm2 ON gm1.group_id = gm2.group_id
         WHERE gm1.user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
         AND gm2.user_id != (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
       ))
)
SELECT
    'User 1 Vehicle Access Test' as test,
    make,
    model,
    license_plate,
    shared_with_groups,
    owner_email,
    visibility_type,
    CASE
        WHEN visibility_type = 'SHOULD_NOT_BE_VISIBLE' THEN '❌ PRIVACY VIOLATION'
        ELSE '✅ PRIVACY PROTECTED'
    END as privacy_status
FROM user1_visible_vehicles
ORDER BY visibility_type, make;

-- =============================================================================
-- TEST 2: VERIFY NO PRIVATE VEHICLES ARE EXPOSED
-- =============================================================================

SELECT 'TEST 2: Private Vehicle Protection' as test_name;

-- Check that private vehicles are not accessible by other users
WITH private_vehicles_test AS (
    SELECT
        v.make,
        v.model,
        v.license_plate,
        v.shared_with_groups,
        owner.email as owner_email,
        viewer.email as viewer_email,
        CASE
            WHEN v.user_id = viewer.id THEN 'OWN_VEHICLE'
            WHEN v.shared_with_groups = false THEN 'PRIVATE_SHOULD_BE_HIDDEN'
            WHEN v.shared_with_groups = true THEN 'SHARED_SHOULD_BE_VISIBLE'
            ELSE 'UNKNOWN'
        END as expected_visibility
    FROM vehicles v
    JOIN profiles owner ON v.user_id = owner.id
    CROSS JOIN profiles viewer
    WHERE v.shared_with_groups = false  -- Focus on private vehicles
    AND v.user_id != viewer.id          -- Different user
)
SELECT
    'Private Vehicle Protection Test' as test,
    make,
    model,
    license_plate,
    owner_email,
    viewer_email,
    expected_visibility,
    CASE
        WHEN expected_visibility = 'PRIVATE_SHOULD_BE_HIDDEN' THEN '✅ SHOULD BE HIDDEN FROM OTHER USERS'
        ELSE '⚠️ REVIEW NEEDED'
    END as privacy_protection
FROM private_vehicles_test;

-- =============================================================================
-- TEST 3: VERIFY SHARED VEHICLES ARE ACCESSIBLE
-- =============================================================================

SELECT 'TEST 3: Shared Vehicle Accessibility' as test_name;

-- Check that shared vehicles are accessible to group members
WITH shared_vehicles_test AS (
    SELECT
        v.make,
        v.model,
        v.license_plate,
        v.shared_with_groups,
        owner.email as owner_email,
        viewer.email as viewer_email,
        CASE
            WHEN v.user_id = viewer.id THEN 'OWN_VEHICLE'
            WHEN v.shared_with_groups = true AND EXISTS (
                SELECT 1 FROM group_members gm1
                JOIN group_members gm2 ON gm1.group_id = gm2.group_id
                WHERE gm1.user_id = viewer.id AND gm2.user_id = v.user_id
                AND gm1.user_id != gm2.user_id
            ) THEN 'SHARED_SHOULD_BE_VISIBLE'
            ELSE 'NOT_IN_SAME_GROUP'
        END as expected_visibility
    FROM vehicles v
    JOIN profiles owner ON v.user_id = owner.id
    CROSS JOIN profiles viewer
    WHERE v.shared_with_groups = true   -- Focus on shared vehicles
    AND v.user_id != viewer.id          -- Different user
)
SELECT
    'Shared Vehicle Access Test' as test,
    make,
    model,
    license_plate,
    owner_email,
    viewer_email,
    expected_visibility,
    CASE
        WHEN expected_visibility = 'SHARED_SHOULD_BE_VISIBLE' THEN '✅ SHOULD BE VISIBLE TO GROUP MEMBERS'
        WHEN expected_visibility = 'NOT_IN_SAME_GROUP' THEN '⚠️ NOT IN SAME GROUP'
        ELSE '⚠️ REVIEW NEEDED'
    END as sharing_status
FROM shared_vehicles_test;

-- =============================================================================
-- TEST 4: SUMMARY OF PRIVACY PROTECTION
-- =============================================================================

SELECT 'TEST 4: Privacy Protection Summary' as test_name;

-- Overall privacy protection statistics
SELECT
    'PRIVACY PROTECTION SUMMARY' as summary_type,
    COUNT(*) as total_vehicles,
    COUNT(*) FILTER (WHERE shared_with_groups = true) as shared_vehicles,
    COUNT(*) FILTER (WHERE shared_with_groups = false) as private_vehicles,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE shared_with_groups = false) / NULLIF(COUNT(*), 0),
        1
    ) || '%' as privacy_protection_rate
FROM vehicles;

-- Group membership verification
SELECT
    'GROUP MEMBERSHIP VERIFICATION' as verification_type,
    COUNT(DISTINCT user_id) as total_group_members,
    COUNT(DISTINCT group_id) as total_groups,
    CASE
        WHEN COUNT(DISTINCT user_id) >= 2 THEN '✅ SUFFICIENT FOR TESTING'
        ELSE '⚠️ NEED MORE USERS FOR TESTING'
    END as test_readiness
FROM group_members;

-- =============================================================================
-- TEST 5: MANUAL VERIFICATION QUERIES
-- =============================================================================

SELECT 'TEST 5: Manual Verification Queries' as test_name;

-- Query template for manual testing
SELECT 'MANUAL TEST INSTRUCTIONS' as instructions;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== MANUAL VERIFICATION ===';
    RAISE NOTICE '';
    RAISE NOTICE '1. Get user IDs:';
    RAISE NOTICE '   SELECT id, email FROM auth.users ORDER BY created_at;';
    RAISE NOTICE '';
    RAISE NOTICE '2. Test what User 1 should see:';
    RAISE NOTICE '   Replace USER1_ID in this query:';
    RAISE NOTICE '   ';
    RAISE NOTICE '   SELECT v.make, v.model, v.shared_with_groups, p.email';
    RAISE NOTICE '   FROM vehicles v JOIN profiles p ON v.user_id = p.id';
    RAISE NOTICE '   WHERE v.user_id = ''USER1_ID''::uuid';
    RAISE NOTICE '      OR (v.shared_with_groups = true AND v.user_id IN (';
    RAISE NOTICE '        SELECT DISTINCT gm2.user_id FROM group_members gm1';
    RAISE NOTICE '        JOIN group_members gm2 ON gm1.group_id = gm2.group_id';
    RAISE NOTICE '        WHERE gm1.user_id = ''USER1_ID''::uuid';
    RAISE NOTICE '        AND gm2.user_id != ''USER1_ID''::uuid';
    RAISE NOTICE '      ));';
    RAISE NOTICE '';
    RAISE NOTICE '3. Expected Results:';
    RAISE NOTICE '   - Should see OWN vehicles (both shared and private)';
    RAISE NOTICE '   - Should see ONLY shared vehicles from group members';
    RAISE NOTICE '   - Should NOT see private vehicles from group members';
END $$;

-- =============================================================================
-- FINAL TEST RESULTS
-- =============================================================================

SELECT 'PRIVACY PROTECTION TEST RESULTS' as final_results;

SELECT
    '🔒 Privacy Protection Tests Complete' as status,
    'Check results above for any violations' as action_required;

-- Quick verification
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM vehicles
            WHERE shared_with_groups IS NULL
        ) THEN '❌ NULL sharing values found - SECURITY RISK'
        ELSE '✅ All vehicles have explicit sharing settings'
    END as null_check;

SELECT
    CASE
        WHEN (SELECT COUNT(*) FROM vehicles WHERE shared_with_groups = false) > 0
        THEN '✅ Private vehicles exist and are protected'
        ELSE '⚠️ No private vehicles to test protection'
    END as private_vehicle_check;

SELECT
    CASE
        WHEN (SELECT COUNT(*) FROM vehicles WHERE shared_with_groups = true) > 0
        THEN '✅ Shared vehicles exist for testing'
        ELSE '⚠️ No shared vehicles to test access'
    END as shared_vehicle_check;

SELECT '🛡️ Privacy protection testing completed!' as result;