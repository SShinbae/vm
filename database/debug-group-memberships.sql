-- DEBUG GROUP MEMBERSHIPS
-- This script will show exactly what's happening with group memberships
-- Run this to understand why "Other group members found: 0"

-- =============================================================================
-- STEP 1: IDENTIFY THE CURRENT USER
-- =============================================================================

SELECT 'STEP 1: Current User Analysis' as step;

-- Show the user ID from the console log
SELECT 'User ID from console: 24cf4275-9449-4182-8ce9-98b01e0ba66b' as user_info;

-- Verify this user exists
SELECT
  'User Verification:' as check_type,
  u.id,
  u.email,
  u.created_at,
  CASE
    WHEN u.id = '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid THEN 'MATCHES CONSOLE ✅'
    ELSE 'DIFFERENT USER ⚠️'
  END as verification
FROM auth.users u
WHERE u.id = '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid;

-- =============================================================================
-- STEP 2: CHECK USER'S GROUP MEMBERSHIPS
-- =============================================================================

SELECT 'STEP 2: User Group Memberships' as step;

-- Show which groups this user is in
SELECT
  'User Groups:' as info,
  g.id as group_id,
  g.name as group_name,
  g.description,
  g.created_at as group_created_at,
  CASE WHEN g.owner_id = gm.user_id THEN 'OWNER' ELSE 'MEMBER' END as role
FROM group_members gm
JOIN groups g ON gm.group_id = g.id
WHERE gm.user_id = '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid
ORDER BY g.created_at;

-- =============================================================================
-- STEP 3: CHECK ALL MEMBERS IN THOSE GROUPS
-- =============================================================================

SELECT 'STEP 3: All Members in User Groups' as step;

-- Show ALL members in groups where our user is a member
SELECT
  'Group Members Analysis:' as info,
  g.name as group_name,
  gm.user_id,
  p.email as member_email,
  CASE
    WHEN gm.user_id = '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid THEN 'CURRENT_USER 👤'
    ELSE 'OTHER_MEMBER 👥'
  END as member_type,
  CASE WHEN g.owner_id = gm.user_id THEN 'OWNER' ELSE 'MEMBER' END as role
FROM group_members gm
JOIN groups g ON gm.group_id = g.id
JOIN profiles p ON gm.user_id = p.id
WHERE gm.group_id IN (
  SELECT group_id
  FROM group_members
  WHERE user_id = '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid
)
ORDER BY g.name, member_type, p.email;

-- =============================================================================
-- STEP 4: SIMULATE THE APP'S QUERY
-- =============================================================================

SELECT 'STEP 4: Simulating App Query Logic' as step;

-- Step 4a: Get user's group memberships (what the app does first)
SELECT
  'Step 4a - User Group Memberships:' as query_step,
  group_id
FROM group_members
WHERE user_id = '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid;

-- Step 4b: Get all other members of these groups (what the app does second)
WITH user_groups AS (
  SELECT group_id
  FROM group_members
  WHERE user_id = '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid
)
SELECT
  'Step 4b - Other Group Members:' as query_step,
  gm.user_id,
  p.email,
  gm.group_id,
  g.name as group_name
FROM group_members gm
JOIN profiles p ON gm.user_id = p.id
JOIN groups g ON gm.group_id = g.id
WHERE gm.group_id IN (SELECT group_id FROM user_groups)
AND gm.user_id != '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid;

-- =============================================================================
-- STEP 5: CHECK FOR POTENTIAL ISSUES
-- =============================================================================

SELECT 'STEP 5: Potential Issues Check' as step;

-- Check if profiles table has all users
SELECT
  'Profile Completeness Check:' as check_type,
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  CASE
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM profiles)
    THEN 'ALL USERS HAVE PROFILES ✅'
    ELSE 'MISSING PROFILES ❌'
  END as profile_status;

-- Check for users without profiles
SELECT
  'Users Without Profiles:' as issue_check,
  u.id,
  u.email
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Check for duplicate group memberships
SELECT
  'Duplicate Memberships Check:' as issue_check,
  group_id,
  user_id,
  COUNT(*) as membership_count
FROM group_members
GROUP BY group_id, user_id
HAVING COUNT(*) > 1;

-- =============================================================================
-- STEP 6: MANUAL COUNT VERIFICATION
-- =============================================================================

SELECT 'STEP 6: Manual Count Verification' as step;

-- Count members in each group manually
SELECT
  'Group Member Counts:' as count_type,
  g.id as group_id,
  g.name as group_name,
  COUNT(gm.user_id) as total_members,
  COUNT(gm.user_id) FILTER (WHERE gm.user_id = '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid) as current_user_count,
  COUNT(gm.user_id) FILTER (WHERE gm.user_id != '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid) as other_members_count
FROM groups g
LEFT JOIN group_members gm ON g.id = gm.group_id
GROUP BY g.id, g.name
ORDER BY total_members DESC;

-- =============================================================================
-- FINAL DIAGNOSIS
-- =============================================================================

SELECT 'STEP 7: Diagnosis Summary' as step;

DO $$
DECLARE
    user_groups_count int;
    other_members_count int;
    total_members_count int;
BEGIN
    -- Count user's groups
    SELECT COUNT(*) INTO user_groups_count
    FROM group_members
    WHERE user_id = '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid;

    -- Count other members in those groups
    SELECT COUNT(DISTINCT gm.user_id) INTO other_members_count
    FROM group_members gm
    WHERE gm.group_id IN (
        SELECT group_id
        FROM group_members
        WHERE user_id = '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid
    )
    AND gm.user_id != '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid;

    -- Count total members in those groups
    SELECT COUNT(DISTINCT gm.user_id) INTO total_members_count
    FROM group_members gm
    WHERE gm.group_id IN (
        SELECT group_id
        FROM group_members
        WHERE user_id = '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid
    );

    RAISE NOTICE '';
    RAISE NOTICE '=== DIAGNOSIS RESULTS ===';
    RAISE NOTICE 'User is in % groups', user_groups_count;
    RAISE NOTICE 'Other members in those groups: %', other_members_count;
    RAISE NOTICE 'Total members in those groups: %', total_members_count;
    RAISE NOTICE '';

    IF other_members_count = 0 THEN
        RAISE NOTICE '❌ ISSUE FOUND: No other members in user groups';
        RAISE NOTICE 'POSSIBLE CAUSES:';
        RAISE NOTICE '1. User is the only member in their groups';
        RAISE NOTICE '2. Missing profiles for other users';
        RAISE NOTICE '3. Group membership data is incomplete';
    ELSE
        RAISE NOTICE '✅ Other members found: %', other_members_count;
        RAISE NOTICE '⚠️  But app shows 0 - check JOIN conditions';
    END IF;
END $$;

SELECT '🔍 Group membership diagnosis complete!' as result;