-- Test script: Create a test notification directly in Supabase
-- Run this in Supabase SQL Editor

-- Step 1: Get a test user ID (replace with your actual user email)
-- SELECT id, email FROM profiles WHERE email = 'YOUR_EMAIL@example.com';

-- Step 2: Create a test group invitation notification
-- Replace 'YOUR_USER_ID' with the ID from Step 1
INSERT INTO notifications (
  user_id,
  notification_type,
  title,
  body,
  data,
  read,
  related_vehicle_id,
  related_group_id,
  action_url
) VALUES (
  'YOUR_USER_ID', -- Replace with actual user ID
  'group_invite',
  'Test Group Invitation',
  'You have been invited to join Test Group',
  '{"inviterName": "Test User", "inviterId": "test-123", "invitationId": "test-456"}',
  false,
  null,
  null,
  null
);

-- Step 3: Verify the notification was created
SELECT * FROM notifications
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 5;

-- Step 4: Test different notification types
-- Fuel log notification
INSERT INTO notifications (
  user_id,
  notification_type,
  title,
  body,
  data,
  read,
  related_vehicle_id,
  related_group_id
) VALUES (
  'YOUR_USER_ID',
  'fuel_log',
  'New Fuel Log',
  'John added fuel log for 2023 Tesla Model 3',
  '{"action": "INSERT", "userName": "John", "performedBy": "user-123"}',
  false,
  null, -- Replace with actual vehicle_id if you want to test navigation
  null
);

-- Cleanup test notifications (optional)
-- DELETE FROM notifications WHERE user_id = 'YOUR_USER_ID' AND title LIKE 'Test%';
