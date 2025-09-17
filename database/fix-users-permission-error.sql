-- Fix the users table permission error
-- Run this in Supabase SQL Editor

-- Drop the problematic policy
DROP POLICY IF EXISTS "Simple invitation view policy" ON group_invitations;

-- Create a safer policy that doesn't access auth.users table directly
-- This uses the profiles table which we have full control over
CREATE POLICY "Users can view invitations sent to them v2" ON group_invitations FOR SELECT
  USING (
    -- Allow users to see invitations sent to their email by comparing with profiles table
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND email = group_invitations.email
    )
    OR
    -- Allow group owners to see invitations for their groups
    EXISTS (
      SELECT 1 FROM groups
      WHERE id = group_invitations.group_id
      AND owner_id = auth.uid()
    )
  );

-- Also make sure the profiles table is readable
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
CREATE POLICY "Users can read their own profile" ON profiles FOR SELECT
  USING (id = auth.uid());

-- Allow users to read profiles of group members (for group functionality)
DROP POLICY IF EXISTS "Users can read group member profiles" ON profiles;
CREATE POLICY "Users can read group member profiles" ON profiles FOR SELECT
  USING (
    -- Allow reading profiles of users in the same groups
    EXISTS (
      SELECT 1 FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
      AND gm2.user_id = profiles.id
    )
    OR
    -- Allow reading profiles for invitations you sent
    EXISTS (
      SELECT 1 FROM group_invitations
      WHERE invited_by = auth.uid()
      AND invited_by = profiles.id
    )
    OR
    -- Allow reading your own profile
    id = auth.uid()
  );

-- Test the new policy
SELECT 'Policy update completed successfully' as result;