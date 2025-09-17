-- Fix group invitation policies for status updates
-- Run this in Supabase SQL Editor

-- Add missing policies for group_invitations table
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view invitations sent to them" ON group_invitations;
DROP POLICY IF EXISTS "Group members can send invitations" ON group_invitations;
DROP POLICY IF EXISTS "Users can accept their own invitations" ON group_invitations;
DROP POLICY IF EXISTS "Group owners can manage invitations" ON group_invitations;

-- Create comprehensive policies for group_invitations

-- 1. Users can view invitations sent to their email
CREATE POLICY "Users can view invitations sent to them" ON group_invitations FOR SELECT
  USING (email = auth.jwt()->>'email');

-- 2. Group owners and members can view invitations for their groups
CREATE POLICY "Group owners can view group invitations" ON group_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE id = group_invitations.group_id
      AND owner_id = auth.uid()
    )
  );

-- 3. Group owners can send invitations
CREATE POLICY "Group owners can send invitations" ON group_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups
      WHERE id = group_invitations.group_id
      AND owner_id = auth.uid()
    )
  );

-- 4. Users can update invitations sent to their email (accept/decline)
CREATE POLICY "Users can update their own invitations" ON group_invitations FOR UPDATE
  USING (email = auth.jwt()->>'email')
  WITH CHECK (email = auth.jwt()->>'email');

-- 5. Group owners can cancel invitations
CREATE POLICY "Group owners can cancel invitations" ON group_invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE id = group_invitations.group_id
      AND owner_id = auth.uid()
    )
  );

-- 6. Group owners can delete invitations
CREATE POLICY "Group owners can delete invitations" ON group_invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE id = group_invitations.group_id
      AND owner_id = auth.uid()
    )
  );