-- Setup Test Data for Vehicle Sharing
-- Run this AFTER running the final-vehicle-sharing-fix.sql script
-- This will create a complete test scenario for vehicle sharing

-- =============================================================================
-- STEP 1: SHOW CURRENT DATA STATE
-- =============================================================================

SELECT 'CURRENT DATA STATE' as step;

-- Show existing users
SELECT 'Existing Users:' as info;
SELECT id, email, created_at FROM auth.users ORDER BY created_at LIMIT 5;

-- Show existing profiles
SELECT 'Existing Profiles:' as info;
SELECT id, email, full_name, created_at FROM profiles ORDER BY created_at LIMIT 5;

-- Show existing groups
SELECT 'Existing Groups:' as info;
SELECT id, name, owner_id, created_at FROM groups ORDER BY created_at;

-- Show existing vehicles
SELECT 'Existing Vehicles:' as info;
SELECT id, user_id, make, model, year, shared_with_groups, created_at
FROM vehicles ORDER BY created_at DESC;

-- =============================================================================
-- STEP 2: CREATE TEST GROUP IF NEEDED
-- =============================================================================

SELECT 'CREATING TEST GROUP' as step;

-- Get user IDs for testing
DO $$
DECLARE
    user_count integer;
    vehicle_count integer;
    group_count integer;
    first_user_id uuid;
    second_user_id uuid;
    test_group_id uuid;
BEGIN
    -- Check current data
    SELECT COUNT(*) INTO user_count FROM auth.users;
    SELECT COUNT(*) INTO vehicle_count FROM vehicles;
    SELECT COUNT(*) INTO group_count FROM groups;

    RAISE NOTICE 'Current state: % users, % vehicles, % groups', user_count, vehicle_count, group_count;

    IF user_count >= 2 THEN
        -- Get first two users
        SELECT id INTO first_user_id FROM auth.users ORDER BY created_at LIMIT 1;
        SELECT id INTO second_user_id FROM auth.users ORDER BY created_at OFFSET 1 LIMIT 1;

        RAISE NOTICE 'Using users: % and %', first_user_id, second_user_id;

        -- Create a test group if none exist
        IF group_count = 0 THEN
            INSERT INTO groups (name, description, owner_id)
            VALUES ('Vehicle Sharing Test Group', 'Test group for vehicle sharing functionality', first_user_id)
            RETURNING id INTO test_group_id;

            RAISE NOTICE 'Created test group: %', test_group_id;
        ELSE
            SELECT id INTO test_group_id FROM groups ORDER BY created_at LIMIT 1;
            RAISE NOTICE 'Using existing group: %', test_group_id;
        END IF;

        -- Add both users to the group (if not already members)
        INSERT INTO group_members (group_id, user_id)
        VALUES
            (test_group_id, first_user_id),
            (test_group_id, second_user_id)
        ON CONFLICT (group_id, user_id) DO NOTHING;

        RAISE NOTICE 'Added users to group';

        -- Show group membership
        RAISE NOTICE 'Group members:';
        FOR first_user_id, second_user_id IN
            SELECT gm.user_id, p.email
            FROM group_members gm
            JOIN profiles p ON gm.user_id = p.id
            WHERE gm.group_id = test_group_id
        LOOP
            RAISE NOTICE '- User: %, Email: %', first_user_id, second_user_id;
        END LOOP;

    ELSE
        RAISE NOTICE 'Need at least 2 users to test vehicle sharing. Please create user accounts through your app.';
    END IF;

END $$;

-- =============================================================================
-- STEP 3: MAKE SOME VEHICLES SHARED FOR TESTING
-- =============================================================================

SELECT 'SETTING UP SHARED VEHICLES' as step;

-- Make half of existing vehicles shared (or at least 1-2 vehicles)
UPDATE vehicles
SET shared_with_groups = true
WHERE id IN (
    SELECT id
    FROM vehicles
    ORDER BY created_at DESC
    LIMIT GREATEST(1, (SELECT COUNT(*) FROM vehicles) / 2)
);

-- Show updated vehicles
SELECT
    COUNT(*) as total_vehicles,
    COUNT(*) FILTER (WHERE shared_with_groups = true) as shared_vehicles,
    COUNT(*) FILTER (WHERE shared_with_groups = false) as private_vehicles
FROM vehicles;

-- =============================================================================
-- STEP 4: VERIFICATION - SHOW WHAT EACH USER SHOULD SEE
-- =============================================================================

SELECT 'VERIFICATION - TESTING VEHICLE VISIBILITY' as step;

-- Show what the first user should see
DO $$
DECLARE
    test_user_id uuid;
    user_email text;
    own_count integer;
    shared_count integer;
BEGIN
    -- Get first user
    SELECT id INTO test_user_id FROM auth.users ORDER BY created_at LIMIT 1;
    SELECT email INTO user_email FROM profiles WHERE id = test_user_id;

    RAISE NOTICE 'Testing visibility for user: % (%)', test_user_id, user_email;

    -- Count own vehicles
    SELECT COUNT(*) INTO own_count FROM vehicles WHERE user_id = test_user_id;

    -- Count shared vehicles (using the same logic as the app)
    SELECT COUNT(*) INTO shared_count
    FROM vehicles v
    WHERE v.shared_with_groups = true
    AND v.user_id IN (
        SELECT DISTINCT gm2.user_id
        FROM group_members gm1
        JOIN group_members gm2 ON gm1.group_id = gm2.group_id
        WHERE gm1.user_id = test_user_id
        AND gm2.user_id != test_user_id
    );

    RAISE NOTICE 'User should see: % own vehicles, % shared vehicles', own_count, shared_count;

END $$;

-- =============================================================================
-- STEP 5: MANUAL VERIFICATION QUERIES
-- =============================================================================

SELECT 'MANUAL VERIFICATION QUERIES' as step;

-- 5.1: Show all group memberships
SELECT 'Group Memberships:' as info;
SELECT
    g.name as group_name,
    p.email as member_email,
    gm.joined_at,
    CASE WHEN g.owner_id = gm.user_id THEN 'OWNER' ELSE 'MEMBER' END as role
FROM group_members gm
JOIN groups g ON gm.group_id = g.id
JOIN profiles p ON gm.user_id = p.id
ORDER BY g.name, role DESC, p.email;

-- 5.2: Show all vehicles with sharing status
SELECT 'All Vehicles:' as info;
SELECT
    v.make,
    v.model,
    v.year,
    v.shared_with_groups,
    p.email as owner_email,
    v.created_at
FROM vehicles v
JOIN profiles p ON v.user_id = p.id
ORDER BY v.shared_with_groups DESC, v.created_at DESC;

-- 5.3: Test query for first user (replace USER_ID_HERE with actual ID)
SELECT 'Test Query Template:' as info;
/*
-- To test manually, get a user ID first:
SELECT id, email FROM auth.users LIMIT 1;

-- Then replace USER_ID_HERE in this query:
SELECT
    v.id,
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

SELECT 'FINAL TEST DATA SUMMARY' as step;

SELECT
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM groups) as total_groups,
    (SELECT COUNT(*) FROM group_members) as total_group_memberships,
    (SELECT COUNT(*) FROM vehicles) as total_vehicles,
    (SELECT COUNT(*) FROM vehicles WHERE shared_with_groups = true) as shared_vehicles,
    (SELECT COUNT(*) FROM vehicles WHERE shared_with_groups = false) as private_vehicles;

-- Instructions for testing
SELECT 'INSTRUCTIONS' as step;
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TESTING INSTRUCTIONS ===';
    RAISE NOTICE '1. Run the app and check the vehicles tab';
    RAISE NOTICE '2. You should see two sections: "My Vehicles" and "Shared Vehicles"';
    RAISE NOTICE '3. Check the console logs for detailed debugging info';
    RAISE NOTICE '4. Test the sharing toggle in vehicle detail views';
    RAISE NOTICE '5. Verify group members can see vehicles marked as shared';
    RAISE NOTICE '';
    RAISE NOTICE 'If no shared vehicles appear:';
    RAISE NOTICE '- Check that users are in the same group';
    RAISE NOTICE '- Verify vehicles have shared_with_groups = true';
    RAISE NOTICE '- Look at console logs for detailed debugging';
END $$;

SELECT '🎉 Test data setup completed!' as result;