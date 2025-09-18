-- Vehicle Sharing Schema Verification and Fix Script
-- This script checks and fixes the database schema for vehicle sharing functionality
-- Run this in your Supabase SQL editor

-- =====================================================
-- Step 1: Check Current Schema
-- =====================================================

-- Check if shared_with_groups column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'vehicles'
AND column_name = 'shared_with_groups';

-- Check all columns in vehicles table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;

-- =====================================================
-- Step 2: Add Missing Columns (if needed)
-- =====================================================

-- Add shared_with_groups column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'vehicles'
        AND column_name = 'shared_with_groups'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN shared_with_groups BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added shared_with_groups column to vehicles table';
    ELSE
        RAISE NOTICE 'shared_with_groups column already exists';
    END IF;
END $$;

-- =====================================================
-- Step 3: Set Default Values for Existing Records
-- =====================================================

-- Update existing vehicles to have sharing disabled by default
UPDATE vehicles
SET shared_with_groups = false
WHERE shared_with_groups IS NULL;

-- Add NOT NULL constraint if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'vehicles'
        AND column_name = 'shared_with_groups'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE vehicles ALTER COLUMN shared_with_groups SET NOT NULL;
        RAISE NOTICE 'Set shared_with_groups column to NOT NULL';
    ELSE
        RAISE NOTICE 'shared_with_groups column already NOT NULL';
    END IF;
END $$;

-- =====================================================
-- Step 4: Create Indexes for Performance
-- =====================================================

-- Create index for shared vehicles (only index TRUE values for performance)
CREATE INDEX IF NOT EXISTS idx_vehicles_shared_groups
ON vehicles(shared_with_groups)
WHERE shared_with_groups = true;

-- Create composite index for user_id and sharing status
CREATE INDEX IF NOT EXISTS idx_vehicles_user_shared
ON vehicles(user_id, shared_with_groups);

-- =====================================================
-- Step 5: Verify RLS Policies Exist
-- =====================================================

-- Check existing RLS policies on vehicles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'vehicles'
ORDER BY policyname;

-- =====================================================
-- Step 6: Create/Update RLS Policies for Vehicle Sharing
-- =====================================================

-- Enable RLS on vehicles table (if not already enabled)
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own vehicles
DROP POLICY IF EXISTS "Users can view own vehicles" ON vehicles;
CREATE POLICY "Users can view own vehicles" ON vehicles
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own vehicles
DROP POLICY IF EXISTS "Users can insert own vehicles" ON vehicles;
CREATE POLICY "Users can insert own vehicles" ON vehicles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own vehicles
DROP POLICY IF EXISTS "Users can update own vehicles" ON vehicles;
CREATE POLICY "Users can update own vehicles" ON vehicles
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own vehicles
DROP POLICY IF EXISTS "Users can delete own vehicles" ON vehicles;
CREATE POLICY "Users can delete own vehicles" ON vehicles
    FOR DELETE USING (auth.uid() = user_id);

-- Policy: Group members can view shared vehicles from other group members
DROP POLICY IF EXISTS "Group members can view shared vehicles" ON vehicles;
CREATE POLICY "Group members can view shared vehicles" ON vehicles
    FOR SELECT USING (
        shared_with_groups = true AND
        user_id IN (
            -- Get all users who are in the same groups as the current user
            SELECT DISTINCT gm1.user_id
            FROM group_members gm1
            JOIN group_members gm2 ON gm1.group_id = gm2.group_id
            WHERE gm2.user_id = auth.uid()
            AND gm1.user_id != auth.uid()  -- Exclude current user (they have their own policy)
        )
    );

-- =====================================================
-- Step 7: Create Test Data (Optional - for development)
-- =====================================================

-- Uncomment the following section if you want to create test data

/*
-- Create test users and groups (only for development/testing)
DO $$
DECLARE
    test_user1_id UUID;
    test_user2_id UUID;
    test_group_id UUID;
    test_vehicle_id UUID;
BEGIN
    -- Only run this in development/testing environments
    IF current_setting('app.environment', true) = 'development' THEN

        -- Create test group
        INSERT INTO groups (name, description, owner_id)
        VALUES ('Test Family Group', 'Test group for vehicle sharing', auth.uid())
        RETURNING id INTO test_group_id;

        -- Add current user to the group
        INSERT INTO group_members (group_id, user_id)
        VALUES (test_group_id, auth.uid());

        -- Create a shared test vehicle
        INSERT INTO vehicles (
            make, model, year, license_plate,
            user_id, shared_with_groups
        )
        VALUES (
            'Toyota', 'Test Camry', 2022, 'TEST123',
            auth.uid(), true
        );

        RAISE NOTICE 'Created test data for vehicle sharing';
    ELSE
        RAISE NOTICE 'Skipped test data creation (not in development mode)';
    END IF;
END $$;
*/

-- =====================================================
-- Step 8: Verification Queries
-- =====================================================

-- Count vehicles by sharing status
SELECT
    shared_with_groups,
    COUNT(*) as vehicle_count
FROM vehicles
GROUP BY shared_with_groups
ORDER BY shared_with_groups;

-- Show shared vehicles with owner information
SELECT
    v.id,
    v.make,
    v.model,
    v.year,
    v.license_plate,
    v.shared_with_groups,
    p.email as owner_email,
    p.full_name as owner_name
FROM vehicles v
JOIN profiles p ON v.user_id = p.id
WHERE v.shared_with_groups = true
ORDER BY v.created_at DESC;

-- Check group memberships
SELECT
    g.name as group_name,
    p.email as member_email,
    p.full_name as member_name,
    gm.joined_at
FROM group_members gm
JOIN groups g ON gm.group_id = g.id
JOIN profiles p ON gm.user_id = p.id
ORDER BY g.name, gm.joined_at;

-- =====================================================
-- Step 9: Test Vehicle Sharing Functionality
-- =====================================================

-- Test query: Get vehicles for current user (includes own + shared)
/*
-- This query simulates what the app does to get vehicles
WITH user_groups AS (
    SELECT group_id
    FROM group_members
    WHERE user_id = auth.uid()
),
group_member_users AS (
    SELECT DISTINCT gm.user_id
    FROM group_members gm
    JOIN user_groups ug ON gm.group_id = ug.group_id
    WHERE gm.user_id != auth.uid()
)
SELECT
    v.*,
    CASE
        WHEN v.user_id = auth.uid() THEN 'own'
        ELSE 'shared'
    END as vehicle_type,
    p.email as owner_email,
    p.full_name as owner_name
FROM vehicles v
JOIN profiles p ON v.user_id = p.id
WHERE
    v.user_id = auth.uid()  -- Own vehicles
    OR (
        v.shared_with_groups = true
        AND v.user_id IN (SELECT user_id FROM group_member_users)
    )
ORDER BY vehicle_type, v.created_at DESC;
*/

-- =====================================================
-- Final Status Check
-- =====================================================

SELECT
    'Schema verification completed' as status,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'vehicles'
            AND column_name = 'shared_with_groups'
        ) THEN 'shared_with_groups column exists'
        ELSE 'ERROR: shared_with_groups column missing'
    END as column_status,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM pg_policies
            WHERE tablename = 'vehicles'
            AND policyname = 'Group members can view shared vehicles'
        ) THEN 'Sharing RLS policy exists'
        ELSE 'ERROR: Sharing RLS policy missing'
    END as policy_status,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE tablename = 'vehicles'
            AND indexname = 'idx_vehicles_shared_groups'
        ) THEN 'Performance index exists'
        ELSE 'WARNING: Performance index missing'
    END as index_status;

-- =====================================================
-- Troubleshooting Information
-- =====================================================

-- If you encounter issues, run these diagnostic queries:

-- 1. Check table structure
-- \d vehicles;

-- 2. Check RLS status
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'vehicles';

-- 3. Test sharing query manually (replace UUIDs with actual values)
-- SELECT * FROM vehicles WHERE shared_with_groups = true;

-- 4. Check group memberships
-- SELECT gm.*, g.name, p.email FROM group_members gm JOIN groups g ON gm.group_id = g.id JOIN profiles p ON gm.user_id = p.id;

DO $$
BEGIN
    RAISE NOTICE 'Vehicle sharing schema verification completed successfully!';
    RAISE NOTICE 'Check the final status above for any issues.';
    RAISE NOTICE 'If sharing still does not work, check the VEHICLE_SHARING_GUIDE.md file for troubleshooting steps.';
END $$;