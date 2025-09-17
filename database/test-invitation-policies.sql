-- Test invitation policies in Supabase SQL Editor
-- Run this as the authenticated user to test policy behavior

-- Test 1: Try to insert an invitation directly (should work for group owners)
-- Replace with actual values when testing
INSERT INTO group_invitations (group_id, email, invited_by, expires_at)
VALUES (
  '00000000-0000-0000-0000-000000000000', -- Replace with actual group ID
  'test@example.com',
  auth.uid(),
  NOW() + INTERVAL '7 days'
);

-- Test 2: Select invitations sent to current user's email
SELECT
  id,
  group_id,
  email,
  status,
  created_at,
  expires_at
FROM group_invitations
WHERE email = auth.jwt()->>'email'
  AND status = 'pending'
  AND expires_at > NOW();

-- Test 3: Check what email the current JWT contains
SELECT auth.jwt()->>'email' as current_user_email;

-- Test 4: Check auth.uid()
SELECT auth.uid() as current_user_id;

-- Test 5: Test with a simpler policy - check if we can see all pending invitations
-- (This is just for debugging - remove after testing)
-- DROP POLICY IF EXISTS "Debug: view all pending invitations" ON group_invitations;
-- CREATE POLICY "Debug: view all pending invitations" ON group_invitations FOR SELECT
--   USING (status = 'pending');