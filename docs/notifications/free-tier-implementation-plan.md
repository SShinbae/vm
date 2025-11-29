# Free-Tier Notification System Implementation Plan

**Last Updated:** November 2024
**Status:** Ready for Implementation
**Estimated Timeline:** 2-3 days
**Total Monthly Cost:** $0 (Free Tiers Only)

---

## 1. Overview

This document outlines a complete free-tier notification system for the Vehicle Management app using:

- **Expo Notifications** - Free push notification delivery
- **Supabase Edge Functions** - Serverless backend logic (500K invocations/month free)
- **pg_cron** - Scheduled job execution within Supabase
- **Supabase Realtime** - Real-time in-app notifications (already implemented)

### Key Features to Implement

1. **Scheduled Service Reminders** - Time-based and mileage-based vehicle service alerts
2. **Batched Group Notifications** - Aggregate multiple group activities into single notifications

---

## 2. Service Comparison Summary

### Services Analyzed

| Service                     | Best For          | Free Tier   | Expo Support   | Notes                        |
| --------------------------- | ----------------- | ----------- | -------------- | ---------------------------- |
| **Expo Notifications**      | Current MVP       | Unlimited   | Perfect        | Already integrated, free     |
| **Supabase Edge Functions** | Scheduling        | 500K/month  | Perfect        | Already using Supabase       |
| **OneSignal**               | Growth stage      | 10K/month   | Excellent      | Upgrade option later         |
| **Novu**                    | Complex workflows | Open-source | Medium         | Self-hosting option          |
| **Courier**                 | Multi-channel     | 10K/month   | Good           | Email + SMS future expansion |
| **Knock**                   | Scale/batching    | Unknown     | Good           | Batching focused             |
| **Firebase FCM**            | Budget            | Unlimited   | Medium         | More complex Expo setup      |
| **Service Workers**         | Web PWA           | N/A         | Not applicable | Web-only technology          |

### Why NOT Service Workers?

Service Workers are **browser-only technology** used for Progressive Web Apps (PWAs). They do NOT work with React Native mobile applications. Only use Service Workers if building a separate PWA version of your app.

### Recommended Path

**Current (Free):** Expo + Supabase Edge Functions
**Future (3-6 months):** Add OneSignal for campaigns
**Later (6+ months):** Add email/SMS via Courier if needed

---

## 3. Recommended Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native App                          │
│              (Expo + Notification Context)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                ┌──────┴──────┐
                │             │
        ┌───────▼──────┐    ┌─▼────────────┐
        │ Expo Push    │    │  Supabase    │
        │ Notification │    │  Realtime    │
        │ Service      │    │  (In-app)    │
        └───────▲──────┘    └──────────────┘
                │
        ┌───────┴────────────────────┐
        │  Supabase Backend           │
        │  ├─ Edge Functions          │
        │  │  ├─ check-service-reminders
        │  │  └─ batch-group-notifications
        │  └─ pg_cron Jobs           │
        │     ├─ Daily (8 AM UTC)    │
        │     └─ Every 15 min        │
        └─────────────────────────────┘
```

### Data Flow

**Service Reminders:**

1. pg_cron triggers `check-service-reminders` Edge Function daily at 8 AM
2. Function queries vehicles with upcoming service dates
3. Function checks mileage-based reminder conditions
4. Function sends push notifications via Expo API
5. Notifications appear on user's device

**Group Activity Batching:**

1. User actions trigger real-time notifications in Supabase
2. pg_cron triggers `batch-group-notifications` every 15 minutes
3. Function queries recent group activity (15-60 min window)
4. Function aggregates notifications for each user
5. Single batched notification sent via Expo API

---

## 4. Phase 1: Database Schema Updates

### 4.1 Create `notification_schedules` Table

```sql
-- Service reminder configuration
CREATE TABLE notification_schedules (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,

  -- Reminder type
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('service_due', 'service_overdue', 'mileage_based', 'custom')),

  -- Configuration
  days_before_due INT DEFAULT 7,      -- Notify X days before service due
  mileage_before_due INT DEFAULT 500, -- Notify X miles before service due
  custom_title TEXT,
  custom_message TEXT,

  -- Control
  enabled BOOLEAN DEFAULT true,
  last_notified_at TIMESTAMP WITH TIME ZONE,
  next_notification_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notification_schedules_user_id ON notification_schedules(user_id);
CREATE INDEX idx_notification_schedules_vehicle_id ON notification_schedules(vehicle_id);
CREATE INDEX idx_notification_schedules_next_notification ON notification_schedules(next_notification_at) WHERE enabled = true;

-- RLS
ALTER TABLE notification_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification schedules"
  ON notification_schedules
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 4.2 Create `notification_preferences` Table

```sql
CREATE TABLE notification_preferences (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Reminder preferences
  service_reminders_enabled BOOLEAN DEFAULT true,
  mileage_reminders_enabled BOOLEAN DEFAULT true,
  group_notifications_enabled BOOLEAN DEFAULT true,
  in_app_toasts_enabled BOOLEAN DEFAULT true,

  -- Batching preferences
  batch_group_notifications BOOLEAN DEFAULT true,
  batch_window_minutes INT DEFAULT 15 CHECK (batch_window_minutes IN (5, 15, 30, 60)),

  -- Timezone for scheduled notifications
  timezone TEXT DEFAULT 'UTC',

  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,

  -- Do not disturb
  do_not_disturb_until TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences"
  ON notification_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 4.3 Update `notifications` Table

If your existing notifications table needs enhancements:

```sql
-- Add batch tracking to existing notifications table
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS batch_id UUID,
ADD COLUMN IF NOT EXISTS batch_count INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_batched BOOLEAN DEFAULT false;

-- Index for batch queries
CREATE INDEX IF NOT EXISTS idx_notifications_batch_id ON notifications(batch_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_batched ON notifications(is_batched) WHERE is_batched = true;
```

---

## 5. Phase 2: Supabase Edge Functions Setup

### 5.1 Edge Function: `check-service-reminders`

**Purpose:** Check for upcoming service reminders and send push notifications

**File:** `supabase/functions/check-service-reminders/index.ts`

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN")!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface ServiceReminder {
  id: string;
  user_id: string;
  vehicle_id: string;
  vehicle_name: string;
  reminder_type: string;
  custom_title?: string;
  custom_message?: string;
  push_tokens: string[];
}

async function sendExpoNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
) {
  const messages = tokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data: data || {},
    badge: 1,
  }));

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      Authorization: `Bearer ${expoAccessToken}`,
    },
    body: JSON.stringify(messages),
  });

  return response.json();
}

async function checkServiceReminders() {
  // Get all enabled notification schedules with upcoming dates
  const { data: schedules, error: scheduleError } = await supabase
    .from("notification_schedules")
    .select(
      `
      id,
      user_id,
      vehicle_id,
      reminder_type,
      custom_title,
      custom_message,
      vehicles!inner(name),
      push_tokens!inner(token)
    `,
    )
    .eq("enabled", true)
    .lte("next_notification_at", new Date().toISOString())
    .limit(100);

  if (scheduleError) {
    throw new Error(`Failed to fetch schedules: ${scheduleError.message}`);
  }

  if (!schedules || schedules.length === 0) {
    return { success: true, processed: 0 };
  }

  let processed = 0;

  for (const schedule of schedules) {
    try {
      const tokens = schedule.push_tokens.map((pt: any) => pt.token);

      if (tokens.length === 0) {
        console.log(`No push tokens for user ${schedule.user_id}`);
        continue;
      }

      const title = schedule.custom_title || "Service Reminder";
      const body =
        schedule.custom_message ||
        `Service reminder for ${schedule.vehicles.name}`;

      await sendExpoNotification(tokens, title, body, {
        type: "service_reminder",
        vehicle_id: String(schedule.vehicle_id),
        schedule_id: schedule.id,
      });

      // Update last_notified_at
      await supabase
        .from("notification_schedules")
        .update({
          last_notified_at: new Date().toISOString(),
          next_notification_at: null,
        })
        .eq("id", schedule.id);

      processed++;
    } catch (error) {
      console.error(
        `Failed to send notification for schedule ${schedule.id}:`,
        error,
      );
    }
  }

  return { success: true, processed };
}

Deno.serve(async (req) => {
  try {
    const result = await checkServiceReminders();
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in check-service-reminders:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
```

### 5.2 Edge Function: `batch-group-notifications`

**Purpose:** Aggregate recent group activities and send batched notifications

**File:** `supabase/functions/batch-group-notifications/index.ts`

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN")!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface GroupNotificationBatch {
  user_id: string;
  notifications: any[];
  push_tokens: string[];
}

async function sendExpoNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
) {
  const messages = tokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data: data || {},
    badge: 1,
  }));

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      Authorization: `Bearer ${expoAccessToken}`,
    },
    body: JSON.stringify(messages),
  });

  return response.json();
}

async function batchGroupNotifications() {
  // Get user preferences
  const { data: preferences, error: prefError } = await supabase
    .from("notification_preferences")
    .select("user_id, batch_window_minutes")
    .eq("batch_group_notifications", true);

  if (prefError) {
    throw new Error(`Failed to fetch preferences: ${prefError.message}`);
  }

  if (!preferences || preferences.length === 0) {
    return { success: true, batched: 0 };
  }

  let batched = 0;

  for (const pref of preferences) {
    const batchWindowMinutes = pref.batch_window_minutes || 15;
    const cutoffTime = new Date(
      Date.now() - batchWindowMinutes * 60 * 1000,
    ).toISOString();

    // Get recent group notifications
    const { data: recentNotifications } = await supabase
      .from("notifications")
      .select("*, push_tokens!inner(token)")
      .eq("user_id", pref.user_id)
      .eq("type", "group_member")
      .gte("created_at", cutoffTime)
      .eq("read", false)
      .eq("is_batched", false)
      .order("created_at", { ascending: false });

    if (!recentNotifications || recentNotifications.length === 0) {
      continue;
    }

    try {
      const tokens = [
        ...new Set(
          recentNotifications.flatMap((n: any) =>
            n.push_tokens.map((pt: any) => pt.token),
          ),
        ),
      ];

      if (tokens.length === 0) continue;

      const count = recentNotifications.length;
      const title = "Group Activity";
      const body = `${count} new group notifications`;

      // Create batch ID
      const batchId = crypto.randomUUID();

      // Send notification
      await sendExpoNotification(tokens, title, body, {
        type: "group_activity_batch",
        batch_id: batchId,
        count: String(count),
      });

      // Mark notifications as batched
      const notificationIds = recentNotifications.map((n: any) => n.id);
      await supabase
        .from("notifications")
        .update({ is_batched: true, batch_id: batchId, batch_count: count })
        .in("id", notificationIds);

      batched++;
    } catch (error) {
      console.error(
        `Failed to batch notifications for user ${pref.user_id}:`,
        error,
      );
    }
  }

  return { success: true, batched };
}

Deno.serve(async (req) => {
  try {
    const result = await batchGroupNotifications();
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in batch-group-notifications:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
```

### 5.3 Setup pg_cron Jobs

Execute these SQL queries in Supabase SQL Editor:

```sql
-- Daily service reminder check at 8 AM UTC
-- Adjust the time to match your timezone if needed
SELECT
  cron.schedule('check-service-reminders-daily', '0 8 * * *',
  $$
    select
      net.http_post(
        url:='https://' || current_setting('app.settings.supabase_url') || '/functions/v1/check-service-reminders',
        headers:='{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
        body:='{}'::jsonb
      ) as request_id;
  $$
);

-- Batch group notifications every 15 minutes
SELECT
  cron.schedule('batch-group-notifications-15min', '*/15 * * * *',
  $$
    select
      net.http_post(
        url:='https://' || current_setting('app.settings.supabase_url') || '/functions/v1/batch-group-notifications',
        headers:='{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
        body:='{}'::jsonb
      ) as request_id;
  $$
);

-- View scheduled jobs
SELECT * FROM cron.job;

-- Optional: Check cron job execution logs
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

---

## 6. Phase 3: Enhanced Notification Service

### 6.1 Update `notificationService.ts`

Enhance the existing notification service to support batching and scheduling:

**Key additions:**

1. Add batch aggregation logic
2. Support for scheduled reminders
3. Timezone-aware notifications
4. Preference filtering

```typescript
// Add to existing notificationService.ts

export interface NotificationBatch {
  batchId: string;
  count: number;
  notifications: Notification[];
}

export async function aggregateGroupNotifications(
  userId: string,
  windowMinutes: number = 15,
): Promise<NotificationBatch | null> {
  const cutoffTime = new Date(Date.now() - windowMinutes * 60 * 1000);

  // Query recent group notifications
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("type", "group_member")
    .gte("created_at", cutoffTime.toISOString())
    .eq("read", false);

  if (error || !data || data.length === 0) {
    return null;
  }

  const batchId = crypto.randomUUID();
  return {
    batchId,
    count: data.length,
    notifications: data as Notification[],
  };
}

export async function createServiceReminder(
  userId: string,
  vehicleId: string,
  reminderType: "service_due" | "mileage_based",
  config: {
    daysBeforeDue?: number;
    mileageBeforeDue?: number;
    customTitle?: string;
    customMessage?: string;
  },
) {
  const { data, error } = await supabase
    .from("notification_schedules")
    .insert({
      user_id: userId,
      vehicle_id: vehicleId,
      reminder_type: reminderType,
      days_before_due: config.daysBeforeDue,
      mileage_before_due: config.mileageBeforeDue,
      custom_title: config.customTitle,
      custom_message: config.customMessage,
    })
    .select();

  if (error) {
    throw new Error(`Failed to create reminder: ${error.message}`);
  }

  return data[0];
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>,
) {
  const { error } = await supabase.from("notification_preferences").upsert({
    user_id: userId,
    ...preferences,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to update preferences: ${error.message}`);
  }
}
```

---

## 7. Phase 4: User Preferences UI

### 7.1 Notification Settings Screen

Create a new settings screen for notification preferences:

```typescript
// app/settings/notifications.tsx

import { useNotifications } from '@/lib/contexts/NotificationContext';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';

interface NotificationPrefs {
  serviceRemindersEnabled: boolean;
  groupNotificationsEnabled: boolean;
  batchGroupNotifications: boolean;
  batchWindowMinutes: number;
  quietHoursEnabled: boolean;
}

export default function NotificationSettingsScreen() {
  const { notifications } = useNotifications();
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    serviceRemindersEnabled: true,
    groupNotificationsEnabled: true,
    batchGroupNotifications: true,
    batchWindowMinutes: 15,
    quietHoursEnabled: false,
  });

  const handleToggle = useCallback((key: keyof NotificationPrefs, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    // Save to Supabase
  }, []);

  const handleBatchWindowChange = useCallback((minutes: number) => {
    setPrefs((prev) => ({ ...prev, batchWindowMinutes: minutes }));
    // Save to Supabase
  }, []);

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-lg font-bold mb-4">Notification Preferences</Text>

      {/* Service Reminders */}
      <View className="border-b pb-4 mb-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-base">Service Reminders</Text>
          <Switch
            value={prefs.serviceRemindersEnabled}
            onValueChange={(val) => handleToggle('serviceRemindersEnabled', val)}
          />
        </View>
        <Text className="text-sm text-gray-600">
          Get notified about upcoming vehicle services
        </Text>
      </View>

      {/* Group Notifications */}
      <View className="border-b pb-4 mb-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-base">Group Activity</Text>
          <Switch
            value={prefs.groupNotificationsEnabled}
            onValueChange={(val) => handleToggle('groupNotificationsEnabled', val)}
          />
        </View>
        <Text className="text-sm text-gray-600">
          Get notified about group updates
        </Text>
      </View>

      {/* Batch Group Notifications */}
      {prefs.groupNotificationsEnabled && (
        <View className="border-b pb-4 mb-4 bg-gray-50 p-3 rounded">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-base">Batch Notifications</Text>
            <Switch
              value={prefs.batchGroupNotifications}
              onValueChange={(val) => handleToggle('batchGroupNotifications', val)}
            />
          </View>
          <Text className="text-sm text-gray-600 mb-3">
            Combine multiple notifications to reduce interruptions
          </Text>

          {prefs.batchGroupNotifications && (
            <View>
              <Text className="text-sm font-semibold mb-2">Batch Window</Text>
              {[5, 15, 30, 60].map((minutes) => (
                <View key={minutes} className="flex-row items-center py-2">
                  <TouchableOpacity
                    onPress={() => handleBatchWindowChange(minutes)}
                    className={`flex-row items-center p-2 rounded ${
                      prefs.batchWindowMinutes === minutes
                        ? 'bg-blue-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Text className="ml-2">
                      Every {minutes} minute{minutes > 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}
```

---

## 8. Phase 5: Testing & Optimization

### 8.1 Testing Checklist

- [ ] **Database:**
  - [ ] Run migration scripts and verify tables created
  - [ ] Test RLS policies
  - [ ] Verify indexes exist and perform well

- [ ] **Edge Functions:**
  - [ ] Deploy `check-service-reminders` function
  - [ ] Deploy `batch-group-notifications` function
  - [ ] Test manual invocations
  - [ ] Verify Expo API credentials are set

- [ ] **pg_cron Jobs:**
  - [ ] Create daily service reminder job
  - [ ] Create 15-min batch notification job
  - [ ] Monitor execution in `cron.job_run_details`
  - [ ] Verify notifications arrive on test devices

- [ ] **Notification Service:**
  - [ ] Test service reminder creation
  - [ ] Test batch aggregation logic
  - [ ] Test preference updates
  - [ ] Verify timezone handling

- [ ] **UI:**
  - [ ] Test notification settings screen
  - [ ] Verify preference persistence
  - [ ] Test toggling features on/off
  - [ ] Verify notification badge updates

### 8.2 Performance Optimization

```sql
-- Monitor Edge Function performance
SELECT
  id,
  status,
  created_at,
  completed_at,
  error_message
FROM net.http_request_queue
ORDER BY created_at DESC
LIMIT 20;

-- Monitor database query performance
EXPLAIN ANALYZE
SELECT * FROM notification_schedules
WHERE enabled = true
AND next_notification_at <= NOW()
LIMIT 100;
```

---

## 9. Cost Analysis

### Monthly Free Tier Usage

| Service                     | Free Tier              | Expected Usage          | Cost         |
| --------------------------- | ---------------------- | ----------------------- | ------------ |
| **Expo Notifications**      | Unlimited              | ~1K-10K/month           | $0           |
| **Supabase Edge Functions** | 500K invocations/month | ~1.4K invocations/month | $0           |
| **Supabase Database**       | 500MB storage          | ~50-100MB               | $0           |
| **Supabase Realtime**       | Unlimited              | ~100-1K events/day      | $0           |
| **Total**                   |                        |                         | **$0/month** |

### Edge Function Invocation Estimate

- **Daily service reminder check:** 1 invocation/day × 30 = 30/month
- **Batch group notifications:** 96 invocations/day × 30 = 2,880/month
- **Total:** ~2,910 invocations/month (well within 500K free limit)

### When to Upgrade

Consider upgrading when:

- Supabase usage exceeds 1GB database storage → $25/month Pro
- More than 1M Edge Function invocations → Usage-based pricing
- Need backup features → $10/month add-on
- Multiple environments (dev/staging/prod) → $25/month per additional

---

## 10. Implementation Timeline

### Day 1 (4-5 hours)

- [ ] Create database schema (Tables + migrations)
- [ ] Set up RLS policies
- [ ] Test database connectivity

### Day 2 (4-5 hours)

- [ ] Deploy Edge Functions
- [ ] Configure Expo API credentials
- [ ] Set up pg_cron jobs
- [ ] Test manual Edge Function invocations

### Day 3 (3-4 hours)

- [ ] Update notification service
- [ ] Create settings UI screen
- [ ] Integration testing
- [ ] Deploy to staging/production
- [ ] Monitor first scheduled runs

### Total: 2-3 days

---

## 11. Environment Variables Required

Add to Supabase Edge Functions secrets:

```bash
# Expo Push Notification API Token
# Get from: https://expo.dev/accounts/[username]/settings/access-tokens
EXPO_ACCESS_TOKEN=ExponentPushToken[...]

# Supabase will automatically inject:
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

## 12. Migration Path from Current System

### Current State

- Expo Notifications for push delivery ✓
- Supabase Realtime for in-app updates ✓
- AsyncStorage for local persistence ✓

### With This Implementation

- Add scheduled reminders (pg_cron + Edge Functions)
- Add batch aggregation for group notifications
- Add preference management
- Maintain backward compatibility

### Future Enhancements

1. **3-6 months:** Add OneSignal for campaigns
2. **6+ months:** Add email/SMS via Courier
3. **9+ months:** Analytics and user behavior insights
4. **12+ months:** Machine learning for optimal delivery timing

---

## 13. Common Issues & Solutions

### Issue: Edge Functions not being triggered

**Solution:**

- Verify pg_cron is enabled: `CREATE EXTENSION IF NOT EXISTS pg_cron;`
- Check `cron.job_run_details` for errors
- Verify Edge Function URL is correct
- Check service role key has correct permissions

### Issue: Notifications not appearing

**Solution:**

- Verify push tokens exist for user
- Check Expo API credentials are valid
- Review Edge Function logs for errors
- Test with `curl` to Expo API directly

### Issue: Batching not working

**Solution:**

- Verify batch window setting is saved
- Check notification timestamps are recent
- Ensure `is_batched` flag is updating correctly
- Monitor batch_group_notifications function execution

---

## 14. Support & Resources

- **Expo Docs:** https://docs.expo.dev/push-notifications/
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **pg_cron:** https://supabase.com/docs/guides/functions/schedule-functions
- **Supabase Realtime:** https://supabase.com/docs/guides/realtime

---

**Document Status:** Ready for Implementation
**Last Updated:** November 2024
**Next Review:** After Phase 3 completion
