import { logger } from "@/lib/utils/logger";
/**
 * Notification Preferences Service
 *
 * Handles reading/writing preferences from Supabase,
 * one-time migration from AsyncStorage, and server-side utility functions.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../services/supabaseClient";
import { Database } from "@/types/database";
import type { ApiResponse } from "@/types/database-v2";

type Row = Database["public"]["Tables"]["notification_preferences"]["Row"];
type Update =
  Database["public"]["Tables"]["notification_preferences"]["Update"];

const ASYNC_STORAGE_PREFS_KEY = "notification_preferences";
const PREFS_MIGRATION_FLAG = "notification_preferences_migrated";

/**
 * Fetch notification preferences for a user (single row, may be null).
 */
export async function getPreferences(
  userId: string,
): Promise<ApiResponse<Row | null>> {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return { data: null, error: error.message, loading: false };
  return { data: (data as Row | null) ?? null, error: null, loading: false };
}

/**
 * Upsert notification preferences — creates with defaults if none exists.
 */
export async function upsertPreferences(
  userId: string,
  data: Partial<Update>,
): Promise<ApiResponse<Row>> {
  const { data: row, error } = await supabase
    .from("notification_preferences")
    .upsert({ user_id: userId, ...data } as never, { onConflict: "user_id" })
    .select()
    .single();
  if (error) return { data: null, error: error.message, loading: false };
  return { data: row as Row, error: null, loading: false };
}

/**
 * Migrate notification preferences from AsyncStorage to Supabase (one-time)
 */
export async function migratePreferencesFromAsyncStorage(
  userId: string,
): Promise<void> {
  try {
    const migrated = await AsyncStorage.getItem(PREFS_MIGRATION_FLAG);
    if (migrated === "true") return;

    const stored = await AsyncStorage.getItem(ASYNC_STORAGE_PREFS_KEY);
    if (!stored) {
      await AsyncStorage.setItem(PREFS_MIGRATION_FLAG, "true");
      return;
    }

    const legacy = JSON.parse(stored) as {
      logUpdates?: boolean;
      groupMembers?: boolean;
      invitations?: boolean;
      inAppToasts?: boolean;
      pushNotifications?: boolean;
    };

    // Upsert into Supabase with mapped fields
    await supabase.from("notification_preferences").upsert(
      {
        user_id: userId,
        log_updates_enabled: legacy.logUpdates ?? true,
        group_members_enabled: legacy.groupMembers ?? true,
        invitations_enabled: legacy.invitations ?? true,
        in_app_toasts_enabled: legacy.inAppToasts ?? true,
        push_notifications_enabled: legacy.pushNotifications ?? true,
      } as never,
      { onConflict: "user_id" },
    );

    // Mark as migrated and clean up
    await AsyncStorage.setItem(PREFS_MIGRATION_FLAG, "true");
    await AsyncStorage.removeItem(ASYNC_STORAGE_PREFS_KEY);

    if (__DEV__) {
      logger.log("Notification preferences migrated from AsyncStorage");
    }
  } catch (error) {
    if (__DEV__) {
      logger.error("Error migrating notification preferences:", error);
    }
  }
}

/**
 * Check if a notification should be sent based on user preferences.
 * Used by server-side functions (webhook, scheduled).
 */
export function shouldSendNotification(
  prefs: Row,
  notificationType: string,
  currentTime?: Date,
): { shouldSend: boolean; reason?: string } {
  const now = currentTime || new Date();

  // Check type-specific toggle
  const typeToggleMap: Record<string, keyof Row> = {
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
    return { shouldSend: false, reason: `${notificationType} disabled` };
  }

  // Check push notifications enabled
  if (!prefs.push_notifications_enabled) {
    return { shouldSend: false, reason: "push notifications disabled" };
  }

  // Check snooze
  const snoozedTypes = prefs.snoozed_types as Record<string, string>;
  if (snoozedTypes && snoozedTypes[notificationType]) {
    const snoozedUntil = new Date(snoozedTypes[notificationType]);
    if (now < snoozedUntil) {
      return {
        shouldSend: false,
        reason: `snoozed until ${snoozedUntil.toISOString()}`,
      };
    }
  }

  // Check quiet hours
  if (prefs.quiet_hours_enabled) {
    const tz = prefs.timezone || "UTC";
    const nowInTz = new Date(now.toLocaleString("en-US", { timeZone: tz }));
    const hours = nowInTz.getHours();
    const minutes = nowInTz.getMinutes();
    const currentMinutes = hours * 60 + minutes;

    const [startH, startM] = (prefs.quiet_hours_start || "22:00")
      .split(":")
      .map(Number);
    const [endH, endM] = (prefs.quiet_hours_end || "07:00")
      .split(":")
      .map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    let inQuietHours = false;
    if (startMinutes <= endMinutes) {
      // Same day range (e.g., 09:00 - 17:00)
      inQuietHours =
        currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Overnight range (e.g., 22:00 - 07:00)
      inQuietHours =
        currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }

    // Check quiet days (0=Sunday, 6=Saturday)
    const quietDays = (prefs.quiet_days as number[]) || [];
    const dayOfWeek = nowInTz.getDay();
    if (quietDays.includes(dayOfWeek)) {
      inQuietHours = true;
    }

    if (inQuietHours) {
      return { shouldSend: false, reason: "quiet hours active" };
    }
  }

  return { shouldSend: true };
}
