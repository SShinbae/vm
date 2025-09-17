-- Fix invitation viewing policy
-- Run this in Supabase SQL Editor

-- Drop the current problematic policy
DROP POLICY IF EXISTS "Users can view invitations sent to them" ON group_invitations;

-- Create a more reliable policy using profiles table join
CREATE POLICY "Users can view invitations sent to them" ON group_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND email = group_invitations.email
    )
  );

-- Also ensure we have a simple policy for debugging
-- Temporarily create a policy that allows users to see all invitations (for debugging only)
-- REMOVE THIS AFTER TESTING
CREATE POLICY "Debug: Users can see all invitations" ON group_invitations FOR SELECT
  USING (true);

-- To remove the debug policy later, run:
-- DROP POLICY IF EXISTS "Debug: Users can see all invitations" ON group_invitations;