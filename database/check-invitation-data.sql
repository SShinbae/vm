-- Debug script to check invitation data and policies
-- Run this in Supabase SQL Editor

-- 1. Check if group_invitations table has RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'group_invitations';

-- 2. Check all policies for group_invitations
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'group_invitations';

-- 3. Check all invitations in the database (as superuser)
SELECT
  id,
  group_id,
  email,
  invited_by,
  status,
  created_at,
  expires_at
FROM group_invitations
ORDER BY created_at DESC;

-- 4. Check groups and their owners
SELECT
  id,
  name,
  owner_id,
  created_at
FROM groups
ORDER BY created_at DESC;

-- 5. Check user profiles and emails
SELECT
  id,
  email,
  full_name,
  created_at
FROM profiles
ORDER BY created_at DESC;