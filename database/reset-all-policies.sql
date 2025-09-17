-- Reset all policies to minimal, safe versions
-- Run this in Supabase SQL Editor

-- Temporarily disable RLS to clean up
ALTER TABLE group_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Simple group access" ON groups;
DROP POLICY IF EXISTS "Simple invitation access" ON group_invitations;
DROP POLICY IF EXISTS "Simple group members access" ON group_members;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Public profile read" ON profiles;

-- Re-enable RLS
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create minimal, safe policies

-- 1. Profiles: Allow all reads (simplest approach)
CREATE POLICY "Allow profile reads" ON profiles FOR SELECT
  USING (true);

-- 2. Groups: Allow all reads (simplest approach)
CREATE POLICY "Allow group reads" ON groups FOR SELECT
  USING (true);

-- 3. Group members: Allow all reads (simplest approach)
CREATE POLICY "Allow group member reads" ON group_members FOR SELECT
  USING (true);

-- 4. Group invitations: Basic read access
CREATE POLICY "Allow invitation reads" ON group_invitations FOR SELECT
  USING (true);

-- 5. Insert/Update/Delete policies (more restrictive)

-- Groups: Only owners can modify
CREATE POLICY "Group owners can modify" ON groups FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Group members: Owners can manage members
CREATE POLICY "Manage group members" ON group_members FOR ALL
  USING (
    user_id = auth.uid() -- Users can manage their own membership
    OR
    EXISTS (SELECT 1 FROM groups WHERE id = group_members.group_id AND owner_id = auth.uid())
  );

-- Group invitations: Owners and recipients can manage
CREATE POLICY "Manage invitations" ON group_invitations FOR ALL
  USING (
    invited_by = auth.uid() -- Senders can manage
    OR
    email IN (SELECT email FROM profiles WHERE id = auth.uid()) -- Recipients can manage
  );

-- Profiles: Users can manage their own profile
CREATE POLICY "Manage own profile" ON profiles FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

SELECT 'All policies reset successfully' as result;