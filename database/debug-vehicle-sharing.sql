-- Debug script for vehicle sharing issues
-- Run these queries one by one in Supabase SQL Editor to diagnose the problem

-- 1. Check if shared_with_groups column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'vehicles'
AND column_name = 'shared_with_groups';

-- If the above returns no rows, the column doesn't exist yet

-- 2. Check current vehicles table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;

-- 3. Check current RLS policies on vehicles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'vehicles';

-- 4. Check if you have any vehicles in the database
SELECT id, user_id, make, model, year, license_plate,
       CASE
         WHEN EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_name = 'vehicles' AND column_name = 'shared_with_groups'
         )
         THEN shared_with_groups::text
         ELSE 'column_not_exists'
       END as shared_status,
       created_at
FROM vehicles
ORDER BY created_at DESC;

-- 5. Check group memberships for current user
SELECT gm.*, g.name as group_name, p.email as member_email
FROM group_members gm
JOIN groups g ON gm.group_id = g.id
LEFT JOIN profiles p ON gm.user_id = p.id
WHERE gm.group_id IN (
  SELECT group_id
  FROM group_members
  WHERE user_id = auth.uid()
);

-- 6. Test the group membership query used in RLS policy
-- This shows which user_ids should be visible to the current user
SELECT DISTINCT gm2.user_id, p.email
FROM group_members gm1
JOIN group_members gm2 ON gm1.group_id = gm2.group_id
LEFT JOIN profiles p ON gm2.user_id = p.id
WHERE gm1.user_id = auth.uid()
AND gm2.user_id != auth.uid();

-- 7. If shared_with_groups exists, test which vehicles should be visible
-- (Only run this if column exists)
/*
SELECT v.*, p.email as owner_email,
       CASE WHEN v.user_id = auth.uid() THEN 'own_vehicle'
            WHEN v.shared_with_groups = true THEN 'shared_vehicle'
            ELSE 'private_vehicle'
       END as visibility_reason
FROM vehicles v
LEFT JOIN profiles p ON v.user_id = p.id
WHERE v.user_id = auth.uid()
   OR (v.shared_with_groups = true AND v.user_id IN (
     SELECT DISTINCT gm2.user_id
     FROM group_members gm1
     JOIN group_members gm2 ON gm1.group_id = gm2.group_id
     WHERE gm1.user_id = auth.uid()
     AND gm2.user_id != auth.uid()
   ));
*/

-- 8. Check current user ID
SELECT auth.uid() as current_user_id,
       (SELECT email FROM profiles WHERE id = auth.uid()) as current_user_email;