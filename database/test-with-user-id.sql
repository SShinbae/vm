-- Test vehicle sharing with a specific user ID
-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with the actual user ID from the auth.users table

-- Step 1: First get your user ID by running the auth debug script
-- Step 2: Replace 'YOUR_USER_ID_HERE' in the queries below with your actual user ID
-- Step 3: Run these queries to test vehicle sharing logic

-- Set your user ID here (replace with actual UUID)
-- Example: SET local my_user_id = '550e8400-e29b-41d4-a716-446655440000';

-- Test 1: Check if shared_with_groups column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'vehicles'
AND column_name = 'shared_with_groups';

-- Test 2: Check your vehicles (replace YOUR_USER_ID_HERE)
/*
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
WHERE user_id = 'a8ccbe02-2ae2-442f-9f71-85a94b161f33'::uuid
ORDER BY created_at DESC;
*/

-- Test 3: Check groups you're a member of (replace YOUR_USER_ID_HERE)
/*
SELECT gm.group_id, g.name as group_name, gm.joined_at
FROM group_members gm
JOIN groups g ON gm.group_id = g.id
WHERE gm.user_id = 'YOUR_USER_ID_HERE'::uuid;
*/

-- Test 4: Check other members in your groups (replace YOUR_USER_ID_HERE)
/*
SELECT DISTINCT gm2.user_id, p.email as member_email, g.name as group_name
FROM group_members gm1
JOIN group_members gm2 ON gm1.group_id = gm2.group_id
JOIN groups g ON gm1.group_id = g.id
LEFT JOIN profiles p ON gm2.user_id = p.id
WHERE gm1.user_id = 'YOUR_USER_ID_HERE'::uuid
AND gm2.user_id != 'YOUR_USER_ID_HERE'::uuid;
*/

-- Test 5: Check vehicles from group members that should be visible (replace YOUR_USER_ID_HERE)
/*
SELECT v.id, v.user_id, v.make, v.model, v.year, v.license_plate,
       v.shared_with_groups,
       p.email as owner_email
FROM vehicles v
LEFT JOIN profiles p ON v.user_id = p.id
WHERE v.shared_with_groups = true
AND v.user_id IN (
  SELECT DISTINCT gm2.user_id
  FROM group_members gm1
  JOIN group_members gm2 ON gm1.group_id = gm2.group_id
  WHERE gm1.user_id = 'YOUR_USER_ID_HERE'::uuid
  AND gm2.user_id != 'YOUR_USER_ID_HERE'::uuid
);
*/

-- Test 6: Check what the RLS policy should return (replace YOUR_USER_ID_HERE)
/*
SELECT v.*, p.email as owner_email,
       CASE WHEN v.user_id = 'YOUR_USER_ID_HERE'::uuid THEN 'own_vehicle'
            WHEN v.shared_with_groups = true THEN 'shared_vehicle'
            ELSE 'private_vehicle'
       END as visibility_reason
FROM vehicles v
LEFT JOIN profiles p ON v.user_id = p.id
WHERE v.user_id = 'YOUR_USER_ID_HERE'::uuid
   OR (v.shared_with_groups = true AND v.user_id IN (
     SELECT DISTINCT gm2.user_id
     FROM group_members gm1
     JOIN group_members gm2 ON gm1.group_id = gm2.group_id
     WHERE gm1.user_id = 'YOUR_USER_ID_HERE'::uuid
     AND gm2.user_id != 'YOUR_USER_ID_HERE'::uuid
   ));
*/