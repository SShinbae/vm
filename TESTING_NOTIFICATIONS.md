# Testing Notifications Locally

This guide shows you how to test the notification system during local development.

## Prerequisites

1. Run the migration first:

   ```bash
   supabase db push
   ```

2. Make sure your app is running and you're logged in

## Method 1: Using the Test Component (Easiest)

Add the test component to your profile screen temporarily:

```tsx
// In app/(tabs)/profile.tsx (or any screen)
import { TestNotifications } from "../../components/dev/TestNotifications";

// Add to your component:
{
  __DEV__ && <TestNotifications />;
}
```

This gives you buttons to create different types of notifications. They will appear in real-time!

**Remember to remove this before production!**

## Method 2: Using SQL in Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Get your user ID:
   ```sql
   SELECT id, email FROM profiles WHERE email = 'YOUR_EMAIL@example.com';
   ```
3. Copy the user ID
4. Open `scripts/create-test-notification.sql`
5. Replace `YOUR_USER_ID` with your actual user ID
6. Run the INSERT statements

## Method 3: Using the Test Script

```bash
# Install dependencies if needed
npm install --save-dev @supabase/supabase-js ts-node

# Set environment variables
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_KEY="your-service-key"

# Create a test notification
npx ts-node scripts/test-notifications.ts create

# Create and auto-cleanup
npx ts-node scripts/test-notifications.ts create --cleanup

# Test realtime subscription (keeps running)
npx ts-node scripts/test-notifications.ts realtime
```

## Method 4: Testing the Webhook Locally

To test the actual webhook function:

```bash
# Install Netlify CLI if you haven't
npm install -g netlify-cli

# Start Netlify dev server
netlify dev

# In another terminal, send a test webhook
curl -X POST http://localhost:8888/.netlify/functions/send-push-notification \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "table": "group_invitations",
    "record": {
      "id": "test-123",
      "group_id": "group-456",
      "email": "test@example.com",
      "invited_by": "user-789",
      "status": "pending",
      "created_at": "2024-01-01T00:00:00Z",
      "expires_at": "2024-01-08T00:00:00Z"
    },
    "schema": "public"
  }'
```

## What to Expect

When you create a test notification:

1. ✅ Notification appears in database (check Supabase dashboard)
2. ✅ Notification appears in your app in real-time (no refresh needed!)
3. ✅ Unread count updates
4. ✅ Toast notification shows (if enabled in preferences)
5. ✅ Clicking notification navigates to the correct page

## Verifying Realtime Updates

1. Open your app on two devices (or web + mobile)
2. Create a test notification using any method
3. Both devices should show the notification instantly!

## Troubleshooting

### Notifications not appearing?

1. Check if migration ran:

   ```sql
   SELECT * FROM notifications LIMIT 1;
   ```

2. Check RLS policies:

   ```sql
   SELECT * FROM notifications WHERE user_id = 'YOUR_USER_ID';
   ```

3. Check realtime subscription in browser console (for web):
   - Should see: "Subscription status: SUBSCRIBED"

4. Check NotificationContext initialization:
   - Add console.log in `initializeNotifications()`

### Realtime not working?

1. Make sure Realtime is enabled in Supabase:
   - Go to Database → Replication
   - Enable realtime for `notifications` table

2. Check browser console for errors

3. Try refreshing the app

## Production Testing

For production, notifications are created by webhooks when:

- Someone invites you to a group
- Someone adds a log to a shared vehicle
- Someone joins/leaves your group

To set up webhooks for production:

1. Deploy your webhook function to Netlify
2. Configure webhooks in Supabase Dashboard (see main README)
3. Test by performing actual actions (create invitation, add log, etc.)

## Cleanup

Remove test notifications:

```sql
DELETE FROM notifications WHERE title LIKE 'Test%';
```

Or use the "Clear Test Notifications" button in the TestNotifications component.

## Environment Variables

Make sure these are set:

```bash
# .env.local
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-service-role-key  # For scripts only!
EXPO_PUBLIC_ONESIGNAL_APP_ID=your-onesignal-app-id
ONESIGNAL_REST_API_KEY=your-onesignal-rest-api-key  # For webhook only
```

**Never commit service keys to git!**
