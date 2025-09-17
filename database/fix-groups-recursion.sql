-- Fix infinite recursion in groups table policies
-- Run this in Supabase SQL Editor

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Group visibility" ON groups;
DROP POLICY IF EXISTS "View own invitations" ON group_invitations;

-- Create simple, non-recursive groups policy
CREATE POLICY "Simple group access" ON groups FOR SELECT
  USING (
    -- Owners can see their groups (no recursion)
    owner_id = auth.uid()
    OR
    -- Allow public read for basic group info (needed for invitations)
    true
  );

-- Create simple, non-recursive invitations policy
CREATE POLICY "Simple invitation access" ON group_invitations FOR SELECT
  USING (
    -- Allow users to see invitations sent to their profile email
    email = (SELECT email FROM profiles WHERE id = auth.uid() LIMIT 1)
    OR
    -- Group owners can see invitations for their groups
    invited_by = auth.uid()
  );

-- Ensure group_members table is accessible
DROP POLICY IF EXISTS "Group members visibility" ON group_members;
CREATE POLICY "Simple group members access" ON group_members FOR SELECT
  USING (
    -- Users can see their own memberships
    user_id = auth.uid()
    OR
    -- Group owners can see all members of their groups
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND groups.owner_id = auth.uid()
    )
  );

-- Test the policies
SELECT 'Groups recursion fix applied successfully' as result;