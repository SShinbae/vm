-- QUICK FIX FOR VEHICLE SHARING ISSUE
-- Based on the console logs, this will fix the specific issues

-- =============================================================================
-- STEP 1: FIX MISSING PROFILES
-- =============================================================================

SELECT 'STEP 1: Fixing Missing Profiles' as step;

-- Create profile for User 1 if missing (a8ccbe02-2ae2-442f-9f71-85a94b161f33)
INSERT INTO profiles (id, email, full_name)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', 'User 1') as full_name
FROM auth.users u
WHERE u.id = 'a8ccbe02-2ae2-442f-9f71-85a94b161f33'::uuid
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);

-- Create profile for User 2 if missing (24cf4275-9449-4182-8ce9-98b01e0ba66b)
INSERT INTO profiles (id, email, full_name)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', 'User 2') as full_name
FROM auth.users u
WHERE u.id = '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);

-- Verify both profiles exist
SELECT
  'Profile Status:' as status,
  COUNT(*) as profiles_created
FROM profiles
WHERE id IN (
  'a8ccbe02-2ae2-442f-9f71-85a94b161f33'::uuid,
  '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid
);

-- =============================================================================
-- STEP 2: ENABLE SHARING FOR USER 2'S VEHICLE
-- =============================================================================

SELECT 'STEP 2: Enabling Vehicle Sharing' as step;

-- Enable sharing for User 2's vehicle (so User 1 can see it)
UPDATE vehicles
SET shared_with_groups = true
WHERE user_id = '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid;

-- Show the result
SELECT
  'Vehicle Sharing Update:' as info,
  v.id,
  v.make,
  v.model,
  v.license_plate,
  v.shared_with_groups,
  p.email as owner_email
FROM vehicles v
JOIN profiles p ON v.user_id = p.id
WHERE v.user_id = '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid;

-- =============================================================================
-- STEP 3: VERIFICATION
-- =============================================================================

SELECT 'STEP 3: Verification' as step;

-- Check group memberships
SELECT
  'Group Membership Check:' as info,
  gm.user_id,
  p.email,
  CASE
    WHEN gm.user_id = 'a8ccbe02-2ae2-442f-9f71-85a94b161f33'::uuid THEN 'USER_1'
    WHEN gm.user_id = '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid THEN 'USER_2'
    ELSE 'OTHER'
  END as user_label
FROM group_members gm
JOIN profiles p ON gm.user_id = p.id
WHERE gm.group_id = '89ad467d-2419-4f8d-b7f3-bab3598c8bdc'::uuid
ORDER BY user_label;

-- Test what User 1 should see (shared vehicles from User 2)
SELECT
  'What User 1 Should See:' as test,
  v.id,
  v.make,
  v.model,
  v.shared_with_groups,
  p.email as owner
FROM vehicles v
JOIN profiles p ON v.user_id = p.id
WHERE v.shared_with_groups = true
AND v.user_id IN (
  SELECT DISTINCT gm2.user_id
  FROM group_members gm1
  JOIN group_members gm2 ON gm1.group_id = gm2.group_id
  WHERE gm1.user_id = 'a8ccbe02-2ae2-442f-9f71-85a94b161f33'::uuid
  AND gm2.user_id != 'a8ccbe02-2ae2-442f-9f71-85a94b161f33'::uuid
);

-- Test what User 2 should see as other group members
SELECT
  'Other Members User 2 Should See:' as test,
  gm.user_id,
  p.email
FROM group_members gm
JOIN profiles p ON gm.user_id = p.id
WHERE gm.group_id IN (
  SELECT group_id
  FROM group_members
  WHERE user_id = '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid
)
AND gm.user_id != '24cf4275-9449-4182-8ce9-98b01e0ba66b'::uuid;

-- =============================================================================
-- FINAL SUMMARY
-- =============================================================================

SELECT 'SHARING FIX COMPLETED' as status;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== SHARING FIX APPLIED ===';
    RAISE NOTICE '✅ Profiles created/updated for both users';
    RAISE NOTICE '✅ User 2 vehicle sharing enabled';
    RAISE NOTICE '';
    RAISE NOTICE 'NOW TEST IN APP:';
    RAISE NOTICE '1. User 1 should see User 2 vehicle in "Shared Vehicles"';
    RAISE NOTICE '2. User 2 should see "Other group members found: 1"';
    RAISE NOTICE '3. Both users should have proper group membership';
    RAISE NOTICE '';
    RAISE NOTICE 'If still not working, check RLS policies or app cache';
END $$;

SELECT '🚀 Vehicle sharing should now work!' as result;