-- Complete debugging script for invitation and group issues
-- Run this in Supabase SQL Editor to understand what's happening

-- 1. Check current user and their email
SELECT
  auth.uid() as current_user_id,
  auth.jwt()->>'email' as jwt_email,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as auth_users_email;

-- 2. Check user's profile
SELECT id, email, full_name, created_at
FROM profiles
WHERE id = auth.uid();

-- 3. Check all group invitations (as superuser - disable RLS temporarily if needed)
SELECT
  gi.id,
  gi.group_id,
  gi.email as invitation_email,
  gi.invited_by,
  gi.status,
  gi.created_at,
  gi.expires_at,
  g.name as group_name,
  p.full_name as invited_by_name,
  p.email as invited_by_email
FROM group_invitations gi
LEFT JOIN groups g ON gi.group_id = g.id
LEFT JOIN profiles p ON gi.invited_by = p.id
ORDER BY gi.created_at DESC;

-- 4. Check group memberships
SELECT
  gm.id as membership_id,
  gm.group_id,
  gm.user_id,
  gm.joined_at,
  g.name as group_name,
  g.owner_id,
  p.full_name as member_name,
  p.email as member_email
FROM group_members gm
LEFT JOIN groups g ON gm.group_id = g.id
LEFT JOIN profiles p ON gm.user_id = p.id
ORDER BY gm.joined_at DESC;

-- 5. Check what the current user can see with RLS (invitations)
SELECT
  id,
  group_id,
  email,
  status,
  created_at
FROM group_invitations
WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND status = 'pending'
  AND expires_at > NOW();

-- 6. Check what the current user can see with RLS (groups they own)
SELECT
  id,
  name,
  description,
  owner_id,
  created_at
FROM groups
WHERE owner_id = auth.uid();

-- 7. Check what the current user can see with RLS (groups they're members of)
SELECT DISTINCT
  g.id,
  g.name,
  g.description,
  g.owner_id,
  g.created_at
FROM groups g
JOIN group_members gm ON g.id = gm.group_id
WHERE gm.user_id = auth.uid();

-- 8. Test invitation policy specifically
SELECT COUNT(*) as invitations_visible_to_current_user
FROM group_invitations
WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid());

-- 9. Check RLS policies
SELECT schemaname, tablename, policyname, cmd, permissive, qual, with_check
FROM pg_policies
WHERE tablename IN ('group_invitations', 'groups', 'profiles', 'group_members')
ORDER BY tablename, policyname;