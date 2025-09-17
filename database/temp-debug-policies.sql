-- Temporary debug policies to fix invitation issues
-- Run this in Supabase SQL Editor

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view invitations sent to them" ON group_invitations;
DROP POLICY IF EXISTS "Debug: Users can see all invitations" ON group_invitations;

-- Create a simple, working policy for viewing invitations
-- This temporarily allows users to see invitations sent to their email
CREATE POLICY "Simple invitation view policy" ON group_invitations FOR SELECT
  USING (
    -- Allow users to see invitations sent to their email
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR
    -- Allow group owners to see invitations for their groups
    EXISTS (
      SELECT 1 FROM groups
      WHERE id = group_invitations.group_id
      AND owner_id = auth.uid()
    )
  );

-- Also ensure we can read groups and profiles for the invitation data
-- These should already exist but let's make sure

-- Allow users to read group basic info
DROP POLICY IF EXISTS "Anyone can read group basic info" ON groups;
CREATE POLICY "Anyone can read group basic info" ON groups FOR SELECT
  USING (true);

-- Allow users to read profile basic info
DROP POLICY IF EXISTS "Anyone can read profile basic info" ON profiles;
CREATE POLICY "Anyone can read profile basic info" ON profiles FOR SELECT
  USING (true);

-- Show current policies for debugging
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('group_invitations', 'groups', 'profiles')
ORDER BY tablename, policyname;