-- Debug authentication issues in Supabase SQL Editor
-- Run these queries one by one to diagnose auth problems

-- 1. Check if you're running queries in the SQL Editor as an authenticated user
-- The SQL Editor might not have access to auth.uid() context
SELECT 'SQL Editor may not have auth context' as note;

-- 2. Check if there are any users in the auth.users table
SELECT id, email, created_at, email_confirmed_at, last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check profiles table
SELECT id, email, full_name, created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

-- 4. Check if there's a mismatch between auth.users and profiles
SELECT u.id as auth_id, u.email as auth_email,
       p.id as profile_id, p.email as profile_email
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
LIMIT 5;

-- 5. Manual test: Replace 'YOUR_USER_ID_HERE' with an actual user ID from step 2
-- SELECT 'YOUR_USER_ID_HERE'::uuid as test_user_id;

-- 6. Test group membership query with a specific user ID
-- Replace 'YOUR_USER_ID_HERE' with actual user ID from step 2
/*
SELECT gm.*, g.name as group_name, p.email as member_email
FROM group_members gm
JOIN groups g ON gm.group_id = g.id
LEFT JOIN profiles p ON gm.user_id = p.id
WHERE gm.group_id IN (
  SELECT group_id
  FROM group_members
  WHERE user_id = 'YOUR_USER_ID_HERE'::uuid
);
*/

-- 7. Test vehicles query with specific user ID
-- Replace 'YOUR_USER_ID_HERE' with actual user ID from step 2
/*
SELECT id, user_id, make, model, year, license_plate, created_at
FROM vehicles
WHERE user_id = 'YOUR_USER_ID_HERE'::uuid
ORDER BY created_at DESC;
*/