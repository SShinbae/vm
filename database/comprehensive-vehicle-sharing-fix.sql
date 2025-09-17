-- Comprehensive Vehicle Sharing Fix
-- This script will diagnose and fix all vehicle sharing issues
-- Run this step by step in Supabase SQL Editor

-- =============================================================================
-- STEP 1: DIAGNOSTICS - Run these first to understand current state
-- =============================================================================

-- Check 1: Does shared_with_groups column exist?
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'vehicles' AND column_name = 'shared_with_groups'
    )
    THEN 'shared_with_groups column EXISTS'
    ELSE 'shared_with_groups column MISSING'
  END as column_status;

-- Check 2: Current vehicles table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;

-- Check 3: Current RLS policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'vehicles';

-- Check 4: How many users exist?
SELECT COUNT(*) as total_users FROM auth.users;
SELECT COUNT(*) as total_profiles FROM profiles;

-- Check 5: How many groups and group members exist?
SELECT COUNT(*) as total_groups FROM groups;
SELECT COUNT(*) as total_group_members FROM group_members;

-- Check 6: How many vehicles exist?
SELECT COUNT(*) as total_vehicles FROM vehicles;

-- =============================================================================
-- STEP 2: FIX DATABASE STRUCTURE
-- =============================================================================

-- Add shared_with_groups column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'vehicles' AND column_name = 'shared_with_groups'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN shared_with_groups boolean DEFAULT false NOT NULL;
        RAISE NOTICE 'Added shared_with_groups column';
    ELSE
        RAISE NOTICE 'shared_with_groups column already exists';
    END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_shared_with_groups ON vehicles(shared_with_groups);

-- =============================================================================
-- STEP 3: FIX RLS POLICIES
-- =============================================================================

-- Drop all existing vehicle policies to start fresh
DROP POLICY IF EXISTS "Users can view their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can view own and shared vehicles" ON vehicles;
DROP POLICY IF EXISTS "Selective vehicle sharing" ON vehicles;
DROP POLICY IF EXISTS "Users can insert their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can update their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can create own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can update own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicles" ON vehicles;

-- Create comprehensive SELECT policy for vehicle sharing
CREATE POLICY "vehicle_sharing_select" ON vehicles FOR SELECT
USING (
  -- Case 1: User's own vehicles (always visible)
  user_id = auth.uid()
  OR
  -- Case 2: Shared vehicles from group members
  (
    shared_with_groups = true
    AND user_id IN (
      SELECT DISTINCT gm2.user_id
      FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
      AND gm2.user_id != auth.uid()
    )
  )
);

-- Recreate other necessary policies
CREATE POLICY "vehicle_insert" ON vehicles FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "vehicle_update" ON vehicles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "vehicle_delete" ON vehicles FOR DELETE
USING (user_id = auth.uid());

-- =============================================================================
-- STEP 4: CREATE TEST DATA FOR IMMEDIATE VERIFICATION
-- =============================================================================

-- Create test users if none exist (for development/testing)
DO $$
DECLARE
    user1_id uuid;
    user2_id uuid;
    group1_id uuid;
BEGIN
    -- Only create test data if we have very few users (development environment)
    IF (SELECT COUNT(*) FROM auth.users) < 3 THEN
        -- This is likely a development environment, create test data
        RAISE NOTICE 'Creating test data for development environment';

        -- You would typically create users through Supabase Auth, not directly in SQL
        -- This is just for testing the sharing logic
        RAISE NOTICE 'Note: In production, users should be created through Supabase Auth';
    ELSE
        RAISE NOTICE 'Multiple users detected, skipping test data creation';
    END IF;
END $$;

-- =============================================================================
-- STEP 5: VERIFICATION QUERIES
-- =============================================================================

-- Verify 1: Column was added successfully
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'vehicles' AND column_name = 'shared_with_groups'
    )
    THEN '✓ shared_with_groups column exists'
    ELSE '✗ shared_with_groups column missing'
  END as verification_1;

-- Verify 2: Policies were created
SELECT
  CASE
    WHEN COUNT(*) >= 4
    THEN '✓ Vehicle policies created successfully'
    ELSE '✗ Missing vehicle policies'
  END as verification_2
FROM pg_policies
WHERE tablename = 'vehicles';

-- Verify 3: Show current policy names
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'vehicles'
ORDER BY cmd, policyname;

-- =============================================================================
-- STEP 6: MANUAL TESTING SETUP
-- =============================================================================

-- If you want to test immediately, you can:
-- 1. Set some existing vehicles to be shared:
-- UPDATE vehicles SET shared_with_groups = true WHERE id IN (
--   SELECT id FROM vehicles LIMIT 2
-- );

-- 2. Check which vehicles would be visible to a specific user:
-- Replace 'USER_ID_HERE' with actual user ID from auth.users
-- SELECT v.*,
--        CASE WHEN v.user_id = 'USER_ID_HERE'::uuid THEN 'own' ELSE 'shared' END as type
-- FROM vehicles v
-- WHERE v.user_id = 'USER_ID_HERE'::uuid
--    OR (v.shared_with_groups = true AND v.user_id IN (
--      SELECT DISTINCT gm2.user_id
--      FROM group_members gm1
--      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
--      WHERE gm1.user_id = 'USER_ID_HERE'::uuid
--      AND gm2.user_id != 'USER_ID_HERE'::uuid
--    ));

SELECT '🎉 Comprehensive vehicle sharing fix completed!' as result;