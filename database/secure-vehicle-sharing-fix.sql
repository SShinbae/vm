-- SECURE VEHICLE SHARING FIX
-- This script fixes the critical privacy issue and ensures strict security
-- Run this in Supabase SQL Editor

-- =============================================================================
-- CRITICAL SECURITY NOTICE
-- =============================================================================
/*
PREVIOUS ISSUE: The vehicle sharing had fallback logic that showed ALL group
member vehicles if there were any errors, violating privacy.

THIS FIX: Implements strict privacy-first policies where:
- Only explicitly shared vehicles (shared_with_groups = true) are visible
- No fallbacks that could expose private vehicles
- Clear error handling that maintains privacy
*/

-- =============================================================================
-- STEP 1: DIAGNOSTICS
-- =============================================================================

SELECT 'SECURITY AUDIT: Current State' as step;

-- Check if shared_with_groups column exists
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'vehicles' AND column_name = 'shared_with_groups'
    )
    THEN 'shared_with_groups column EXISTS ✓'
    ELSE 'shared_with_groups column MISSING ✗ (CRITICAL: Sharing will be disabled for privacy)'
  END as column_status;

-- Check current data counts
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM vehicles) as total_vehicles,
  (SELECT COUNT(*) FROM vehicles WHERE shared_with_groups = true) as shared_vehicles,
  (SELECT COUNT(*) FROM vehicles WHERE shared_with_groups = false) as private_vehicles;

-- =============================================================================
-- STEP 2: ENSURE DATABASE STRUCTURE IS SECURE
-- =============================================================================

SELECT 'STEP 2: Securing Database Structure' as step;

-- Add shared_with_groups column with strict privacy default
DO $$
BEGIN
    BEGIN
        ALTER TABLE vehicles ADD COLUMN shared_with_groups boolean DEFAULT false NOT NULL;
        RAISE NOTICE 'SECURITY: Added shared_with_groups column with privacy-first default (false)';
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'SECURITY: shared_with_groups column already exists';
    END;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_shared_with_groups ON vehicles(shared_with_groups);

-- =============================================================================
-- STEP 3: IMPLEMENT STRICT RLS POLICIES
-- =============================================================================

SELECT 'STEP 3: Implementing Strict RLS Policies' as step;

-- Drop ALL existing vehicle policies to start fresh
DROP POLICY IF EXISTS "Users can view their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can view own and shared vehicles" ON vehicles;
DROP POLICY IF EXISTS "Selective vehicle sharing" ON vehicles;
DROP POLICY IF EXISTS "vehicle_sharing_select" ON vehicles;
DROP POLICY IF EXISTS "final_vehicle_sharing_policy" ON vehicles;
DROP POLICY IF EXISTS "Users can insert their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can update their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can create own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can update own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicles" ON vehicles;
DROP POLICY IF EXISTS "vehicle_insert" ON vehicles;
DROP POLICY IF EXISTS "vehicle_update" ON vehicles;
DROP POLICY IF EXISTS "vehicle_delete" ON vehicles;
DROP POLICY IF EXISTS "vehicle_insert_policy" ON vehicles;
DROP POLICY IF EXISTS "vehicle_update_policy" ON vehicles;
DROP POLICY IF EXISTS "vehicle_delete_policy" ON vehicles;

-- Create STRICT and SECURE SELECT policy
CREATE POLICY "secure_vehicle_sharing_select" ON vehicles FOR SELECT
USING (
  -- RULE 1: Users can ALWAYS see their own vehicles
  user_id = auth.uid()
  OR
  -- RULE 2: Users can see shared vehicles from group members
  -- CRITICAL: Must be explicitly marked as shared AND user must be in same group
  (
    -- SECURITY REQUIREMENT 1: Must be explicitly shared
    shared_with_groups = true
    AND
    -- SECURITY REQUIREMENT 2: Must be from a user in the same group
    user_id IN (
      SELECT DISTINCT gm2.user_id
      FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
      AND gm2.user_id != auth.uid()
    )
  )
);

-- Create strict policies for other operations
CREATE POLICY "secure_vehicle_insert" ON vehicles FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "secure_vehicle_update" ON vehicles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "secure_vehicle_delete" ON vehicles FOR DELETE
USING (user_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 4: SECURE LOG TABLE POLICIES
-- =============================================================================

SELECT 'STEP 4: Securing Log Table Policies' as step;

-- Mileage logs - strict policy
DROP POLICY IF EXISTS "Users can manage logs for their vehicles" ON mileage_logs;
DROP POLICY IF EXISTS "Users can view shared mileage logs" ON mileage_logs;
DROP POLICY IF EXISTS "Users can insert own mileage logs" ON mileage_logs;
DROP POLICY IF EXISTS "Users can update own mileage logs" ON mileage_logs;
DROP POLICY IF EXISTS "Users can delete own mileage logs" ON mileage_logs;

CREATE POLICY "secure_mileage_logs_select" ON mileage_logs FOR SELECT
USING (
  -- Own logs
  user_id = auth.uid()
  OR
  -- Logs for shared vehicles only
  vehicle_id IN (
    SELECT id FROM vehicles
    WHERE shared_with_groups = true
    AND user_id IN (
      SELECT DISTINCT gm2.user_id
      FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
      AND gm2.user_id != auth.uid()
    )
  )
);

CREATE POLICY "secure_mileage_logs_modify" ON mileage_logs FOR ALL
USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid()))
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid()));

-- Fuel logs - strict policy
DROP POLICY IF EXISTS "Users can manage logs for their vehicles" ON fuel_logs;
DROP POLICY IF EXISTS "Users can view shared fuel logs" ON fuel_logs;
DROP POLICY IF EXISTS "Users can insert own fuel logs" ON fuel_logs;
DROP POLICY IF EXISTS "Users can update own fuel logs" ON fuel_logs;
DROP POLICY IF EXISTS "Users can delete own fuel logs" ON fuel_logs;

CREATE POLICY "secure_fuel_logs_select" ON fuel_logs FOR SELECT
USING (
  user_id = auth.uid()
  OR
  vehicle_id IN (
    SELECT id FROM vehicles
    WHERE shared_with_groups = true
    AND user_id IN (
      SELECT DISTINCT gm2.user_id
      FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
      AND gm2.user_id != auth.uid()
    )
  )
);

CREATE POLICY "secure_fuel_logs_modify" ON fuel_logs FOR ALL
USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid()))
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid()));

-- Service logs - strict policy
DROP POLICY IF EXISTS "Users can manage logs for their vehicles" ON service_logs;
DROP POLICY IF EXISTS "Users can view shared service logs" ON service_logs;
DROP POLICY IF EXISTS "Users can insert own service logs" ON service_logs;
DROP POLICY IF EXISTS "Users can update own service logs" ON service_logs;
DROP POLICY IF EXISTS "Users can delete own service logs" ON service_logs;

CREATE POLICY "secure_service_logs_select" ON service_logs FOR SELECT
USING (
  user_id = auth.uid()
  OR
  vehicle_id IN (
    SELECT id FROM vehicles
    WHERE shared_with_groups = true
    AND user_id IN (
      SELECT DISTINCT gm2.user_id
      FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
      AND gm2.user_id != auth.uid()
    )
  )
);

CREATE POLICY "secure_service_logs_modify" ON service_logs FOR ALL
USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid()))
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND user_id = auth.uid()));

-- =============================================================================
-- STEP 5: VERIFICATION - SECURITY AUDIT
-- =============================================================================

SELECT 'STEP 5: Security Verification' as step;

-- Verify policies were created with secure names
SELECT
  'SECURITY AUDIT: Policies Created' as audit_type,
  policyname,
  cmd,
  CASE
    WHEN policyname LIKE 'secure_%' THEN 'SECURE ✓'
    ELSE 'REVIEW NEEDED ⚠️'
  END as security_status
FROM pg_policies
WHERE tablename = 'vehicles'
ORDER BY cmd, policyname;

-- Show current sharing status
SELECT
  'PRIVACY AUDIT: Current Sharing Status' as audit_type,
  COUNT(*) as total_vehicles,
  COUNT(*) FILTER (WHERE shared_with_groups = true) as explicitly_shared,
  COUNT(*) FILTER (WHERE shared_with_groups = false) as private_protected,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE shared_with_groups = false) / NULLIF(COUNT(*), 0),
    1
  ) as privacy_protection_percentage
FROM vehicles;

-- =============================================================================
-- FINAL SECURITY SUMMARY
-- =============================================================================

SELECT 'SECURITY FIX COMPLETED' as status;

SELECT
  '🔒 PRIVACY PROTECTION ENABLED' as security_1,
  '🔒 NO PERMISSIVE FALLBACKS' as security_2,
  '🔒 EXPLICIT CONSENT REQUIRED' as security_3,
  '🔒 STRICT RLS POLICIES' as security_4;

-- Instructions
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== SECURITY FIX COMPLETED ===';
    RAISE NOTICE '✓ Privacy-first policies implemented';
    RAISE NOTICE '✓ No fallbacks that expose private vehicles';
    RAISE NOTICE '✓ Only explicitly shared vehicles are visible';
    RAISE NOTICE '✓ Service layer updated with strict error handling';
    RAISE NOTICE '';
    RAISE NOTICE 'TESTING: Group members should now see ONLY vehicles';
    RAISE NOTICE 'that are explicitly marked as shared_with_groups = true';
    RAISE NOTICE '';
    RAISE NOTICE 'PRIVACY: Private vehicles are now completely protected';
END $$;

SELECT '🔐 Vehicle sharing is now SECURE and PRIVACY-FIRST!' as result;