-- DEBUG AZLAN FAMILY GROUP SPECIFICALLY
-- This will show exactly what's happening with the "Azlan Family" group

-- =============================================================================
-- STEP 1: CHECK THE AZLAN FAMILY GROUP
-- =============================================================================

SELECT 'STEP 1: Azlan Family Group Details' as step;

-- Get the group details
SELECT
  'Azlan Family Group:' as info,
  g.id,
  g.name,
  g.description,
  g.owner_id,
  p.email as owner_email,
  g.created_at
FROM groups g
JOIN profiles p ON g.owner_id = p.id
WHERE g.id = '89ad467d-2419-4f8d-b7f3-bab3598c8bdc'::uuid;

-- =============================================================================
-- STEP 2: CHECK ALL MEMBERS IN AZLAN FAMILY GROUP
-- =============================================================================

SELECT 'STEP 2: All Members in Azlan Family Group' as step;

-- Raw group_members table for this group
SELECT
  'Raw Group Members:' as info,
  gm.group_id,
  gm.user_id,
  CASE
    WHEN gm.user_id = '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid THEN 'CURRENT_USER'
    ELSE 'OTHER_MEMBER'
  END as member_type
FROM group_members gm
WHERE gm.group_id = '89ad467d-2419-4f8d-b7f3-bab3598c8bdc'::uuid
ORDER BY member_type;

-- Members with profiles (what the app tries to fetch)
SELECT
  'Members with Profiles:' as info,
  gm.user_id,
  p.email,
  p.full_name,
  CASE
    WHEN gm.user_id = '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid THEN 'CURRENT_USER'
    ELSE 'OTHER_MEMBER'
  END as member_type
FROM group_members gm
JOIN profiles p ON gm.user_id = p.id  -- This JOIN might be failing!
WHERE gm.group_id = '89ad467d-2419-4f8d-b7f3-bab3598c8bdc'::uuid
ORDER BY member_type;

-- =============================================================================
-- STEP 3: CHECK FOR MISSING PROFILES
-- =============================================================================

SELECT 'STEP 3: Missing Profiles Check' as step;

-- Check if any group members don't have profiles
SELECT
  'Members Without Profiles:' as issue,
  gm.user_id,
  u.email as auth_email,
  CASE
    WHEN p.id IS NULL THEN '❌ MISSING PROFILE'
    ELSE '✅ HAS PROFILE'
  END as profile_status
FROM group_members gm
JOIN auth.users u ON gm.user_id = u.id
LEFT JOIN profiles p ON gm.user_id = p.id
WHERE gm.group_id = '89ad467d-2419-4f8d-b7f3-bab3598c8bdc'::uuid
ORDER BY profile_status;

-- =============================================================================
-- STEP 4: SIMULATE THE EXACT APP QUERY
-- =============================================================================

SELECT 'STEP 4: Exact App Query Simulation' as step;

-- This is EXACTLY what the app does to find other group members
SELECT
  'App Query Result:' as query_type,
  gm.user_id
FROM group_members gm
WHERE gm.group_id IN (
  SELECT group_id
  FROM group_members
  WHERE user_id = '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid  -- Current user
)
AND gm.user_id != '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid; -- Exclude current user

-- =============================================================================
-- STEP 5: CHECK AUTH USERS FOR ALL GROUP MEMBERS
-- =============================================================================

SELECT 'STEP 5: Auth Users Check' as step;

-- Check auth.users for all group members
SELECT
  'Auth Users for Group Members:' as info,
  gm.user_id,
  u.email,
  u.created_at,
  CASE
    WHEN gm.user_id = '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid THEN 'CURRENT_USER'
    ELSE 'OTHER_MEMBER'
  END as member_type
FROM group_members gm
LEFT JOIN auth.users u ON gm.user_id = u.id
WHERE gm.group_id = '89ad467d-2419-4f8d-b7f3-bab3598c8bdc'::uuid
ORDER BY member_type;

-- =============================================================================
-- STEP 6: MANUAL COUNT
-- =============================================================================

SELECT 'STEP 6: Manual Member Count' as step;

-- Simple count of group members
SELECT
  'Member Count:' as count_type,
  COUNT(*) as total_members,
  COUNT(*) FILTER (WHERE user_id = '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid) as current_user_count,
  COUNT(*) FILTER (WHERE user_id != '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid) as other_members_count
FROM group_members
WHERE group_id = '89ad467d-2419-4f8d-b7f3-bab3598c8bdc'::uuid;

-- =============================================================================
-- STEP 7: FIX MISSING PROFILES IF NEEDED
-- =============================================================================

SELECT 'STEP 7: Profile Fix (if needed)' as step;

-- Create profiles for any users that don't have them
INSERT INTO profiles (id, email, full_name)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) as full_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Show how many profiles were created
SELECT
  'Profile Creation Result:' as result,
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  CASE
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM profiles)
    THEN '✅ ALL USERS NOW HAVE PROFILES'
    ELSE '⚠️ STILL MISSING SOME PROFILES'
  END as profile_status;

-- =============================================================================
-- FINAL VERIFICATION
-- =============================================================================

SELECT 'FINAL VERIFICATION' as step;

-- Re-run the app query after profile fix
SELECT
  'Fixed App Query Result:' as query_type,
  COUNT(*) as other_member_count
FROM group_members gm
WHERE gm.group_id IN (
  SELECT group_id
  FROM group_members
  WHERE user_id = '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid
)
AND gm.user_id != '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid;

-- Show all members with profiles now
SELECT
  'All Members After Fix:' as info,
  gm.user_id,
  p.email,
  CASE
    WHEN gm.user_id = '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid THEN 'CURRENT_USER'
    ELSE 'OTHER_MEMBER'
  END as member_type
FROM group_members gm
JOIN profiles p ON gm.user_id = p.id
WHERE gm.group_id = '89ad467d-2419-4f8d-b7f3-bab3598c8bdc'::uuid
ORDER BY member_type;

SELECT '🔍 Azlan Family group diagnosis complete!' as result;