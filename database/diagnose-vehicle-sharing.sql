-- DIAGNOSE VEHICLE SHARING ISSUES
-- Run this in Supabase SQL Editor to identify why shared vehicles aren't visible
-- This will check database structure, data, and policies

-- =============================================================================
-- STEP 1: CHECK DATABASE STRUCTURE
-- =============================================================================

SELECT 'STEP 1: Database Structure Check' as step;

-- Check if shared_with_groups column exists
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'vehicles' AND column_name = 'shared_with_groups'
    )
    THEN '✅ shared_with_groups column EXISTS'
    ELSE '❌ shared_with_groups column MISSING (CRITICAL ISSUE)'
  END as column_status;

-- Show all columns in vehicles table
SELECT
  'Vehicles Table Structure:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;

-- =============================================================================
-- STEP 2: CHECK CURRENT DATA
-- =============================================================================

SELECT 'STEP 2: Current Data Analysis' as step;

-- Count total users and vehicles
SELECT
  'Data Overview:' as info,
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM vehicles) as total_vehicles,
  (SELECT COUNT(*) FROM groups) as total_groups,
  (SELECT COUNT(*) FROM group_members) as total_group_memberships;

-- Check vehicle sharing status (if column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'vehicles' AND column_name = 'shared_with_groups'
    ) THEN
        RAISE NOTICE 'Vehicle Sharing Status:';
        PERFORM (
            SELECT
                COUNT(*) as total_vehicles,
                COUNT(*) FILTER (WHERE shared_with_groups = true) as shared_vehicles,
                COUNT(*) FILTER (WHERE shared_with_groups = false) as private_vehicles,
                COUNT(*) FILTER (WHERE shared_with_groups IS NULL) as null_sharing_status
            FROM vehicles
        );
    ELSE
        RAISE NOTICE '❌ Cannot check vehicle sharing status - column missing';
    END IF;
END $$;

-- Show sample vehicles with owner info
SELECT
  'Sample Vehicles:' as info,
  v.id,
  v.make,
  v.model,
  v.license_plate,
  p.email as owner_email,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'vehicles' AND column_name = 'shared_with_groups'
    ) THEN
      CASE
        WHEN v.shared_with_groups = true THEN 'SHARED'
        WHEN v.shared_with_groups = false THEN 'PRIVATE'
        ELSE 'NULL/UNKNOWN'
      END
    ELSE 'COLUMN_MISSING'
  END as sharing_status
FROM vehicles v
JOIN profiles p ON v.user_id = p.id
ORDER BY v.created_at DESC
LIMIT 5;

-- =============================================================================
-- STEP 3: CHECK GROUP MEMBERSHIPS
-- =============================================================================

SELECT 'STEP 3: Group Membership Analysis' as step;

-- Show group structure
SELECT
  'Group Overview:' as info,
  g.id as group_id,
  g.name as group_name,
  g.description,
  owner.email as owner_email,
  (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
FROM groups g
JOIN profiles owner ON g.owner_id = owner.id
ORDER BY g.created_at;

-- Show detailed group memberships
SELECT
  'Detailed Group Memberships:' as info,
  g.name as group_name,
  p.email as member_email,
  gm.created_at as joined_at,
  CASE WHEN g.owner_id = gm.user_id THEN 'OWNER' ELSE 'MEMBER' END as role
FROM group_members gm
JOIN groups g ON gm.group_id = g.id
JOIN profiles p ON gm.user_id = p.id
ORDER BY g.name, role DESC, p.email;

-- =============================================================================
-- STEP 4: CHECK RLS POLICIES
-- =============================================================================

SELECT 'STEP 4: RLS Policy Check' as step;

-- Check if RLS is enabled
SELECT
  'RLS Status:' as info,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('vehicles', 'mileage_logs', 'fuel_logs', 'service_logs')
ORDER BY tablename;

-- Show current policies
SELECT
  'Current Policies:' as info,
  tablename,
  policyname,
  cmd as operation,
  CASE WHEN policyname LIKE 'secure_%' THEN 'SECURE ✅' ELSE 'REVIEW ⚠️' END as security_status
FROM pg_policies
WHERE tablename IN ('vehicles', 'mileage_logs', 'fuel_logs', 'service_logs')
ORDER BY tablename, cmd, policyname;

-- =============================================================================
-- STEP 5: SIMULATE VEHICLE SHARING QUERY
-- =============================================================================

SELECT 'STEP 5: Vehicle Sharing Query Simulation' as step;

-- Test the exact query that the app uses
-- This simulates what should happen when a group member requests shared vehicles

DO $$
DECLARE
    test_user_id uuid;
    other_user_id uuid;
    group_id uuid;
    member_count int;
    shared_vehicle_count int;
BEGIN
    -- Get first user
    SELECT id INTO test_user_id FROM auth.users ORDER BY created_at LIMIT 1;

    -- Get second user
    SELECT id INTO other_user_id FROM auth.users ORDER BY created_at OFFSET 1 LIMIT 1;

    RAISE NOTICE 'Testing with User 1: %', test_user_id;
    RAISE NOTICE 'Testing with User 2: %', other_user_id;

    -- Check if they're in the same group
    SELECT gm1.group_id INTO group_id
    FROM group_members gm1
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = test_user_id AND gm2.user_id = other_user_id
    LIMIT 1;

    IF group_id IS NOT NULL THEN
        RAISE NOTICE '✅ Users are in the same group: %', group_id;

        -- Count group members (excluding test user)
        SELECT COUNT(DISTINCT user_id) INTO member_count
        FROM group_members
        WHERE group_id IN (
            SELECT group_id FROM group_members WHERE user_id = test_user_id
        )
        AND user_id != test_user_id;

        RAISE NOTICE 'Other group members found: %', member_count;

        -- Check if shared_with_groups column exists and count shared vehicles
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'vehicles' AND column_name = 'shared_with_groups'
        ) THEN
            SELECT COUNT(*) INTO shared_vehicle_count
            FROM vehicles v
            WHERE v.shared_with_groups = true
            AND v.user_id IN (
                SELECT DISTINCT gm2.user_id
                FROM group_members gm1
                JOIN group_members gm2 ON gm1.group_id = gm2.group_id
                WHERE gm1.user_id = test_user_id
                AND gm2.user_id != test_user_id
            );

            RAISE NOTICE 'Shared vehicles that should be visible: %', shared_vehicle_count;

            IF shared_vehicle_count = 0 THEN
                RAISE NOTICE '⚠️ ISSUE: No vehicles are marked as shared_with_groups = true';
                RAISE NOTICE 'SOLUTION: Vehicle owners need to enable sharing for their vehicles';
            END IF;
        ELSE
            RAISE NOTICE '❌ CRITICAL: shared_with_groups column missing';
            RAISE NOTICE 'SOLUTION: Run secure-vehicle-sharing-fix.sql';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ ISSUE: Test users are not in the same group';
        RAISE NOTICE 'SOLUTION: Add users to the same group to test sharing';
    END IF;
END $$;

-- =============================================================================
-- STEP 6: MANUAL TEST QUERIES
-- =============================================================================

SELECT 'STEP 6: Manual Test Queries' as step;

-- Query 1: What should User 1 see?
SELECT 'MANUAL TEST: What User 1 Should See' as test_name;

DO $$
DECLARE
    user1_id uuid;
BEGIN
    SELECT id INTO user1_id FROM auth.users ORDER BY created_at LIMIT 1;

    RAISE NOTICE '';
    RAISE NOTICE '=== MANUAL TEST QUERY ===';
    RAISE NOTICE 'Replace USER1_ID with: %', user1_id;
    RAISE NOTICE '';
    RAISE NOTICE 'SELECT v.make, v.model, v.license_plate, v.shared_with_groups, p.email as owner';
    RAISE NOTICE 'FROM vehicles v JOIN profiles p ON v.user_id = p.id';
    RAISE NOTICE 'WHERE v.user_id = ''%''::uuid', user1_id;
    RAISE NOTICE '   OR (v.shared_with_groups = true AND v.user_id IN (';
    RAISE NOTICE '     SELECT DISTINCT gm2.user_id FROM group_members gm1';
    RAISE NOTICE '     JOIN group_members gm2 ON gm1.group_id = gm2.group_id';
    RAISE NOTICE '     WHERE gm1.user_id = ''%''::uuid', user1_id;
    RAISE NOTICE '     AND gm2.user_id != ''%''::uuid', user1_id;
    RAISE NOTICE '   ));';
    RAISE NOTICE '';
END $$;

-- =============================================================================
-- STEP 7: RECOMMENDATIONS
-- =============================================================================

SELECT 'STEP 7: Diagnostic Summary & Recommendations' as step;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== DIAGNOSTIC COMPLETE ===';
    RAISE NOTICE '';
    RAISE NOTICE 'CHECK THE RESULTS ABOVE FOR:';
    RAISE NOTICE '1. ❌ shared_with_groups column missing';
    RAISE NOTICE '2. ⚠️ No vehicles marked as shared';
    RAISE NOTICE '3. ⚠️ Users not in same groups';
    RAISE NOTICE '4. ❌ RLS policies missing or incorrect';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. If column missing: Run secure-vehicle-sharing-fix.sql';
    RAISE NOTICE '2. If no shared vehicles: Owners need to enable sharing';
    RAISE NOTICE '3. If users not grouped: Add users to same groups';
    RAISE NOTICE '4. Test the manual query with real user IDs';
END $$;

SELECT '🔍 Vehicle sharing diagnosis complete!' as result;