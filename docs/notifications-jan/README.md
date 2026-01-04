# Notification System Documentation

> Last Updated: January 2026

This document provides a comprehensive analysis of the notification system in the Vehicles Management app.

## Table of Contents

1. [Service Overview](#service-overview)
2. [Architecture](#architecture)
3. [Notification Flow](#notification-flow)
4. [Push Notification Service (OneSignal)](#push-notification-service-onesignal)
5. [Real-time Notification Service (Supabase)](#real-time-notification-service-supabase)
6. [Backend Webhook Handler](#backend-webhook-handler)
7. [Database Schema](#database-schema)
8. [UI Components](#ui-components)
9. [Notification Types](#notification-types)
10. [File Reference](#file-reference)

---

## Service Overview

The notification system uses a **dual-layer architecture**:

| Layer                  | Service           | Purpose                                          |
| ---------------------- | ----------------- | ------------------------------------------------ |
| **Push Notifications** | OneSignal         | Device push notifications (iOS, Android, Web)    |
| **Real-time In-App**   | Supabase Realtime | Live in-app updates and notification persistence |

### Dependencies

```json
{
  "onesignal-expo-plugin": "^1.1.2",
  "react-native-onesignal": "^5.2.16",
  "react-onesignal": "^3.4.0"
}
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ mileage_logs │  │  fuel_logs   │  │ service_logs │               │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘               │
│         │                 │                 │                        │
│  ┌──────┴─────────────────┴─────────────────┴──────┐                │
│  │              group_members                       │                │
│  │              group_invitations                   │                │
│  └──────────────────────┬──────────────────────────┘                │
└─────────────────────────┼───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SUPABASE WEBHOOKS                               │
│                  (Triggers on INSERT/UPDATE/DELETE)                  │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   NETLIFY FUNCTION                                   │
│              send-push-notification.ts                               │
│  ┌────────────────────┬────────────────────┐                        │
│  │ createNotification │ sendOneSignalPush  │                        │
│  │    Record()        │    Notification()  │                        │
│  └─────────┬──────────┴─────────┬──────────┘                        │
└────────────┼────────────────────┼───────────────────────────────────┘
             │                    │
             ▼                    ▼
┌────────────────────┐   ┌────────────────────┐
│  notifications     │   │   OneSignal API    │
│  table (Supabase)  │   │   (Push Delivery)  │
└─────────┬──────────┘   └─────────┬──────────┘
          │                        │
          ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT APP                                    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                  NotificationContext                         │    │
│  │  (Real-time subscription + React Query cache)               │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                             │                                        │
│  ┌──────────────────────────┼──────────────────────────────────┐    │
│  │                          ▼                                   │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │    │
│  │  │ Toast       │  │ Bell Badge  │  │ Popup       │          │    │
│  │  │ Notification│  │ + Counter   │  │ Modal       │          │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │    │
│  │                                                              │    │
│  │  ┌─────────────────────────────────────────────────────┐    │    │
│  │  │              Notification List Screen                │    │    │
│  │  └─────────────────────────────────────────────────────┘    │    │
│  └──────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Notification Flow

### Flow 1: Log Entry Changes (Mileage/Fuel/Service)

```
1. User creates/updates/deletes a log entry
2. Supabase triggers webhook on table change
3. Netlify function receives webhook payload
4. Function identifies affected vehicle and group members
5. For each group member:
   a. Creates notification record in database
   b. Sends OneSignal push notification
6. Real-time subscription notifies connected clients
7. UI updates immediately via React Query
```

### Flow 2: Group Invitations

```
1. User sends group invitation
2. Supabase triggers webhook on group_invitations INSERT
3. Netlify function:
   a. Looks up recipient by email
   b. Creates notification record
   c. Sends OneSignal push with accept/decline data
4. Recipient receives push + in-app notification
5. User can accept/decline directly from notification
```

### Flow 3: Group Member Changes

```
1. User joins or leaves a group
2. Webhook triggers on group_members INSERT/DELETE
3. Netlify function notifies all other group members
4. Members see real-time notification about the change
```

---

## Push Notification Service (OneSignal)

### Configuration

**Environment Variables:**

- `EXPO_PUBLIC_ONESIGNAL_APP_ID` - OneSignal App ID
- `ONESIGNAL_REST_API_KEY` - REST API Key (server-side only)

**Expo Configuration** (`app.config.js`):

```javascript
plugins: [
  [
    "onesignal-expo-plugin",
    {
      mode: IS_DEVELOPMENT ? "development" : "production",
    },
  ],
];
```

### Service Implementation

**File:** `lib/services/oneSignalService.ts`

```typescript
class OneSignalServiceClass {
  // Initialize OneSignal SDK
  initialize(): void;

  // Map user to OneSignal subscription
  setExternalUserId(userId: string): Promise<void>;

  // Clear user on logout
  clearExternalUserId(): Promise<void>;

  // Add user segmentation tags
  addTag(key: string, value: string): Promise<void>;
  addTags(tags: Record<string, string>): Promise<void>;

  // Get device subscription ID
  getSubscriptionId(): Promise<string | undefined>;

  // Permission management
  hasPermission(): Promise<boolean>;
  requestPermission(): Promise<boolean>;

  // Sync user data (email, tags)
  syncUser(user: User): Promise<void>;

  // Cleanup on logout
  onLogout(): Promise<void>;
}
```

### Web Service Workers

- `public/OneSignalSDKWorker.js` - Main service worker
- `public/OneSignalSDK.sw.js` - SDK service worker

---

## Real-time Notification Service (Supabase)

### Service Implementation

**File:** `lib/services/notificationService.ts`

The service subscribes to real-time changes on 5 tables:

| Table               | Events                 | Handler                     |
| ------------------- | ---------------------- | --------------------------- |
| `mileage_logs`      | INSERT, UPDATE, DELETE | `handleLogChange()`         |
| `fuel_logs`         | INSERT, UPDATE, DELETE | `handleLogChange()`         |
| `service_logs`      | INSERT, UPDATE, DELETE | `handleLogChange()`         |
| `group_members`     | INSERT, DELETE         | `handleGroupMemberChange()` |
| `group_invitations` | INSERT                 | `handleInvitationChange()`  |

### User Data Caching

```typescript
interface CachedUserData {
  groups: GroupInfo[];
  vehicles: VehicleInfo[];
  timestamp: number; // 5-minute TTL
}
```

---

## Backend Webhook Handler

**File:** `netlify/functions/send-push-notification.ts`

### Endpoint

```
POST /.netlify/functions/send-push-notification
```

### Webhook Payload Structure

```typescript
interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: Record<string, any>;
  old_record?: Record<string, any>;
}
```

### Handler Functions

```typescript
// Create notification record in database
async function createNotificationRecord(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data: Record<string, any>,
): Promise<void>;

// Send push via OneSignal REST API
async function sendOneSignalNotification(
  userIds: string[],
  title: string,
  body: string,
  data: Record<string, any>,
): Promise<void>;

// Route handlers
async function handleGroupInvitation(payload: WebhookPayload): Promise<void>;
async function handleLogChange(payload: WebhookPayload): Promise<void>;
async function handleGroupMemberChange(payload: WebhookPayload): Promise<void>;
```

---

## Database Schema

### Notifications Table

**Migration:** `supabase/migrations/20251221171048_create_notifications_table.sql`

```sql
CREATE TYPE notification_type AS ENUM (
  'mileage_log',
  'fuel_log',
  'service_log',
  'group_member',
  'group_invite'
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  related_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  related_group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
```

### Row Level Security (RLS)

```sql
-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can insert notifications
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (TRUE);
```

### Push Tokens Table

**Migration:** `database/migrations/push_tokens.sql`

```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL,
  device_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);
```

---

## UI Components

### Component Hierarchy

```
NotificationProvider (Context)
├── NotificationManager (Toast Controller)
│   └── NotificationToast (Popup Toast)
├── NotificationBell (Header Icon)
│   └── NotificationPopup (Dropdown Modal)
└── NotificationList (Full Screen List)
    └── NotificationItem (Individual Item)
```

### Component Details

| Component             | File                                    | Purpose                    |
| --------------------- | --------------------------------------- | -------------------------- |
| `NotificationContext` | `lib/contexts/NotificationContext.tsx`  | Global state management    |
| `NotificationManager` | `components/ui/NotificationManager.tsx` | Toast display controller   |
| `NotificationToast`   | `components/ui/NotificationToast.tsx`   | Auto-dismissing toast      |
| `NotificationBell`    | `components/ui/NotificationBell.tsx`    | Bell icon with badge       |
| `NotificationPopup`   | `components/ui/NotificationPopup.tsx`   | Dropdown notification list |
| `NotificationList`    | `components/ui/NotificationList.tsx`    | Full notification list     |

### React Query Hooks

**File:** `hooks/useNotificationQueries.ts`

```typescript
// Query hooks
useNotifications(); // Fetch all notifications
useUserGroups(); // Fetch user's groups
useUserVehicles(); // Fetch user's vehicles

// Mutation hooks (with optimistic updates)
useMarkNotificationAsRead();
useMarkAllNotificationsAsRead();
useDeleteNotification();
useDeleteAllNotifications();
```

---

## Notification Types

| Type           | Trigger    | Icon        | Color   | Recipients    |
| -------------- | ---------- | ----------- | ------- | ------------- |
| `mileage_log`  | Log CRUD   | Speedometer | Primary | Group members |
| `fuel_log`     | Log CRUD   | Fuel pump   | Warning | Group members |
| `service_log`  | Log CRUD   | Wrench      | Error   | Group members |
| `group_member` | Join/Leave | People      | Success | Group members |
| `group_invite` | Invitation | Envelope    | Info    | Invited user  |

### Notification Actions

| Type              | Click Action                |
| ----------------- | --------------------------- |
| Log notifications | Navigate to vehicle details |
| Group member      | Navigate to group           |
| Group invite      | Show accept/decline dialog  |

---

## File Reference

### Core Services

| File                                   | Description                         |
| -------------------------------------- | ----------------------------------- |
| `lib/services/notificationService.ts`  | Real-time subscription service      |
| `lib/services/oneSignalService.ts`     | OneSignal push notification service |
| `lib/services/oneSignalLazy.ts`        | Lazy initialization wrapper         |
| `lib/contexts/NotificationContext.tsx` | React Context for state             |
| `hooks/useNotificationQueries.ts`      | React Query hooks                   |

### Backend

| File                                          | Description              |
| --------------------------------------------- | ------------------------ |
| `netlify/functions/send-push-notification.ts` | Webhook handler function |

### UI Components

| File                                    | Description          |
| --------------------------------------- | -------------------- |
| `app/notifications.tsx`                 | Notifications screen |
| `components/ui/NotificationBell.tsx`    | Bell icon component  |
| `components/ui/NotificationPopup.tsx`   | Dropdown popup       |
| `components/ui/NotificationList.tsx`    | List component       |
| `components/ui/NotificationToast.tsx`   | Toast display        |
| `components/ui/NotificationManager.tsx` | Toast controller     |

### Database

| File                                                                      | Description        |
| ------------------------------------------------------------------------- | ------------------ |
| `supabase/migrations/20251221171048_create_notifications_table.sql`       | Main schema        |
| `supabase/migrations/20251224063900_allow_users_insert_notifications.sql` | RLS policy         |
| `database/migrations/push_tokens.sql`                                     | Push token storage |

### Configuration

| File                           | Description                    |
| ------------------------------ | ------------------------------ |
| `app.config.js`                | Expo + OneSignal plugin config |
| `public/OneSignalSDKWorker.js` | Web service worker             |
| `public/OneSignalSDK.sw.js`    | SDK service worker             |

### Utilities

| File                                   | Description                        |
| -------------------------------------- | ---------------------------------- |
| `lib/utils/notificationMigration.ts`   | AsyncStorage to Supabase migration |
| `components/dev/TestNotifications.tsx` | Development testing utility        |

---

## Configuration Requirements

### Environment Variables

```env
# Client-side
EXPO_PUBLIC_ONESIGNAL_APP_ID=your-onesignal-app-id

# Server-side (Netlify)
ONESIGNAL_REST_API_KEY=your-rest-api-key
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Supabase Webhook Configuration

Configure in Supabase Dashboard → Database → Webhooks:

| Table               | Events                 | URL                                                                       |
| ------------------- | ---------------------- | ------------------------------------------------------------------------- |
| `group_invitations` | INSERT                 | `https://your-site.netlify.app/.netlify/functions/send-push-notification` |
| `fuel_logs`         | INSERT, UPDATE, DELETE | Same URL                                                                  |
| `mileage_logs`      | INSERT, UPDATE, DELETE | Same URL                                                                  |
| `service_logs`      | INSERT, UPDATE, DELETE | Same URL                                                                  |
| `group_members`     | INSERT, DELETE         | Same URL                                                                  |
