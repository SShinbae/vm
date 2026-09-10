/**
 * Shared notification utilities for Netlify Functions.
 * Used by webhook + scheduled functions.
 */

import { supabaseAdmin } from "./supabaseAdmin";

const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY!;
const ONESIGNAL_APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID!;

// Types matching the database schema
interface NotificationPreferences {
  user_id: string;
  service_reminders_enabled: boolean;
  mileage_reminders_enabled: boolean;
  cost_alerts_enabled: boolean;
  analytics_insights_enabled: boolean;
  log_updates_enabled: boolean;
  group_members_enabled: boolean;
  invitations_enabled: boolean;
  push_notifications_enabled: boolean;
  in_app_toasts_enabled: boolean;
  analytics_frequency: "weekly" | "monthly" | "never";
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  quiet_days: number[];
  timezone: string;
  max_per_type_per_day: number;
  snoozed_types: Record<string, string>;
}

type NotificationType =
  | "mileage_log"
  | "fuel_log"
  | "service_log"
  | "group_member"
  | "group_invite"
  | "service_reminder"
  | "mileage_reminder"
  | "cost_alert"
  | "analytics_insight";

/**
 * Fetch user notification preferences. Returns null if no row exists (use defaults).
 */
export async function getUserPreferences(
  userId: string,
): Promise<NotificationPreferences | null> {
  const { data, error } = await supabaseAdmin
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching preferences for", userId, error);
    return null;
  }

  return data as NotificationPreferences | null;
}

/**
 * Check if a notification should be delivered to a user.
 */
export function shouldDeliverNotification(
  prefs: NotificationPreferences | null,
  notificationType: NotificationType,
  currentTime?: Date,
): { deliver: boolean; reason?: string } {
  // No preferences row → deliver everything (defaults are all enabled)
  if (!prefs) return { deliver: true };

  const now = currentTime || new Date();

  // Type toggle
  const typeToggleMap: Record<string, keyof NotificationPreferences> = {
    mileage_log: "log_updates_enabled",
    fuel_log: "log_updates_enabled",
    service_log: "log_updates_enabled",
    group_member: "group_members_enabled",
    group_invite: "invitations_enabled",
    service_reminder: "service_reminders_enabled",
    mileage_reminder: "mileage_reminders_enabled",
    cost_alert: "cost_alerts_enabled",
    analytics_insight: "analytics_insights_enabled",
  };

  const toggleKey = typeToggleMap[notificationType];
  if (toggleKey && prefs[toggleKey] === false) {
    return { deliver: false, reason: `${notificationType} disabled` };
  }

  // Push enabled
  if (!prefs.push_notifications_enabled) {
    return { deliver: false, reason: "push notifications disabled" };
  }

  // Snooze check
  if (prefs.snoozed_types && prefs.snoozed_types[notificationType]) {
    const snoozedUntil = new Date(prefs.snoozed_types[notificationType]);
    if (now < snoozedUntil) {
      return { deliver: false, reason: "snoozed" };
    }
  }

  // Quiet hours
  if (prefs.quiet_hours_enabled) {
    const tz = prefs.timezone || "UTC";
    const nowInTz = new Date(now.toLocaleString("en-US", { timeZone: tz }));
    const currentMinutes = nowInTz.getHours() * 60 + nowInTz.getMinutes();

    const [startH, startM] = (prefs.quiet_hours_start || "22:00")
      .split(":")
      .map(Number);
    const [endH, endM] = (prefs.quiet_hours_end || "07:00")
      .split(":")
      .map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    let inQuiet = false;
    if (startMinutes <= endMinutes) {
      inQuiet = currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      inQuiet = currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }

    const quietDays = prefs.quiet_days || [];
    if (quietDays.includes(nowInTz.getDay())) {
      inQuiet = true;
    }

    if (inQuiet) {
      return { deliver: false, reason: "quiet hours" };
    }
  }

  return { deliver: true };
}

/**
 * Send push notification via OneSignal REST API.
 */
export async function sendOneSignalPush(params: {
  recipientIds: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  webUrl?: string;
  appUrl?: string;
}): Promise<boolean> {
  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: params.recipientIds,
        headings: { en: params.title },
        contents: { en: params.body },
        data: params.data || {},
        web_url: params.webUrl,
        app_url: params.appUrl,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OneSignal API error:", response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("OneSignal send error:", error);
    return false;
  }
}

/**
 * Create notification record in database.
 */
export async function createNotificationRecord(params: {
  userId: string;
  notificationType: NotificationType;
  title: string;
  body: string;
  data?: any;
  relatedVehicleId?: string | null;
  relatedGroupId?: string | null;
  actionUrl?: string | null;
}): Promise<boolean> {
  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: params.userId,
    notification_type: params.notificationType,
    title: params.title,
    body: params.body,
    data: params.data || null,
    read: false,
    related_vehicle_id: params.relatedVehicleId || null,
    related_group_id: params.relatedGroupId || null,
    action_url: params.actionUrl || null,
  });

  if (error) {
    console.error("Error creating notification record:", error);
    return false;
  }
  return true;
}

/**
 * Check dedup table to avoid sending duplicate reminders.
 */
export async function isDeduplicated(
  userId: string,
  notificationKey: string,
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("notification_dedup")
    .select("id")
    .eq("user_id", userId)
    .eq("notification_key", notificationKey)
    .maybeSingle();

  return !!data;
}

/**
 * Record a sent notification in the dedup table.
 */
export async function recordDedup(
  userId: string,
  notificationKey: string,
): Promise<void> {
  await supabaseAdmin.from("notification_dedup").upsert(
    {
      user_id: userId,
      notification_key: notificationKey,
    },
    { onConflict: "user_id,notification_key" },
  );
}

/**
 * Clean up old dedup records (older than 30 days).
 */
export async function cleanupDedupRecords(): Promise<void> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  await supabaseAdmin
    .from("notification_dedup")
    .delete()
    .lt("sent_at", thirtyDaysAgo.toISOString());
}
