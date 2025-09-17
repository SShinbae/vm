-- Fix infinite recursion in group policies
-- Run this in Supabase SQL Editor

-- Disable RLS temporarily to drop all policies
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies for groups and group_members
DROP POLICY IF EXISTS "Group members can view groups they belong to" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Group owners can update their groups" ON groups;
DROP POLICY IF EXISTS "Group owners can delete their groups" ON groups;

DROP POLICY IF EXISTS "Group members can view group membership" ON group_members;
DROP POLICY IF EXISTS "Users can join groups (through invitations)" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups or owners can remove members" ON group_members;

-- Re-enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Create NEW simplified policies without circular references

-- Groups policies - NO references to group_members table
CREATE POLICY "Users can view groups they own" ON groups FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create groups" ON groups FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Group owners can update their groups" ON groups FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Group owners can delete their groups" ON groups FOR DELETE
  USING (auth.uid() = owner_id);

-- Group members policies - NO references to groups table
CREATE POLICY "Users can view their own memberships" ON group_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can join groups" ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" ON group_members FOR DELETE
  USING (auth.uid() = user_id);

-- Add separate policy for group owners to manage members
CREATE POLICY "Group owners can view members" ON group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE id = group_members.group_id
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Group owners can remove members" ON group_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE id = group_members.group_id
      AND owner_id = auth.uid()
    )
  );