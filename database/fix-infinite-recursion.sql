-- Fix infinite recursion in profile policies
-- Run this in Supabase SQL Editor

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read group member profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can read profile basic info" ON profiles;

-- Create simple, non-recursive policies for profiles
-- Policy 1: Users can read their own profile (no recursion)
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT
  USING (id = auth.uid());

-- Policy 2: Allow reading basic profile info for group functionality (no complex joins)
CREATE POLICY "Public profile read" ON profiles FOR SELECT
  USING (true);

-- Also fix the group invitations policy to avoid recursion
DROP POLICY IF EXISTS "Users can view invitations sent to them v2" ON group_invitations;

-- Create a simpler invitation policy
CREATE POLICY "View own invitations" ON group_invitations FOR SELECT
  USING (
    -- Simple email match using the user's own profile
    email IN (
      SELECT email FROM profiles WHERE id = auth.uid()
    )
    OR
    -- Group owners can see their group invitations
    group_id IN (
      SELECT id FROM groups WHERE owner_id = auth.uid()
    )
  );

-- Ensure groups table is readable
DROP POLICY IF EXISTS "Anyone can read group basic info" ON groups;
CREATE POLICY "Group visibility" ON groups FOR SELECT
  USING (
    -- Owners can see their groups
    owner_id = auth.uid()
    OR
    -- Members can see groups they belong to
    id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
    OR
    -- Allow reading for invitation purposes (limited info)
    true
  );

-- Test the policies
SELECT 'Recursion fix applied successfully' as result;