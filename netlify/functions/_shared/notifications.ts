import { supabaseAdmin } from "./supabaseAdmin";

export interface NotificationPreferences {
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
  service_reminder_days: number[];
  mileage_reminder_thresholds: number[];
  monthly_spending_threshold: number | null;
  fuel_price_alert_percentage: number;
  analytics_frequency: "weekly" | "monthly" | "never";
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  quiet_days: number[];
  timezone: string;
  max_per_type_per_day: number;
  snoozed_types: Record<string, string>;
}

export type NotificationType =
  | "mileage_log"
  | "fuel_log"
  | "service_log"
  | "group_member"
  | "group_invite"
  | "service_reminder"
  | "mileage_reminder"
  | "cost_alert"
  | "analytics_insight";

export function applicableThresholds(
  remaining: number,
  thresholds: number[],
): number[] {
  if (remaining <= 0) return [0];
  return [...thresholds]
    .sort((a, b) => b - a)
    .filter((value) => remaining <= value);
}

const typeToggleMap: Record<NotificationType, keyof NotificationPreferences> = {
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

export async function getUserPreferences(
  userId: string,
): Promise<NotificationPreferences | null> {
  const { data, error } = await supabaseAdmin
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching notification preferences:", error);
    return null;
  }
  return data as NotificationPreferences | null;
}

function getSuppressionReason(
  prefs: NotificationPreferences | null,
  type: NotificationType,
  now: Date,
): string | undefined {
  if (!prefs) return;
  if (prefs[typeToggleMap[type]] === false) return `${type} disabled`;

  const snoozedUntil = prefs.snoozed_types?.[type];
  if (snoozedUntil && now < new Date(snoozedUntil)) return "snoozed";
}

export function shouldDeliverNotification(
  prefs: NotificationPreferences | null,
  type: NotificationType,
  currentTime = new Date(),
): { deliver: boolean; reason?: string } {
  const suppressed = getSuppressionReason(prefs, type, currentTime);
  if (suppressed) return { deliver: false, reason: suppressed };
  if (!prefs) return { deliver: true };
  if (!prefs.push_notifications_enabled) {
    return { deliver: false, reason: "push notifications disabled" };
  }
  if (!prefs.quiet_hours_enabled) return { deliver: true };

  let localNow: Date;
  try {
    localNow = new Date(
      currentTime.toLocaleString("en-US", {
        timeZone: prefs.timezone || "UTC",
      }),
    );
  } catch {
    localNow = currentTime;
  }

  const minutes = localNow.getHours() * 60 + localNow.getMinutes();
  const [startHour, startMinute] = (prefs.quiet_hours_start || "22:00")
    .split(":")
    .map(Number);
  const [endHour, endMinute] = (prefs.quiet_hours_end || "07:00")
    .split(":")
    .map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  const quiet =
    (start <= end
      ? minutes >= start && minutes < end
      : minutes >= start || minutes < end) ||
    (prefs.quiet_days || []).includes(localNow.getDay());

  return quiet ? { deliver: false, reason: "quiet hours" } : { deliver: true };
}

function timezoneMidnight(now: Date, timezone: string): string {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
  } catch {
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    ).toISOString();
  }

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const approximate = new Date(
    Date.UTC(value("year"), value("month") - 1, value("day")),
  );
  const displayed = new Date(
    approximate.toLocaleString("en-US", { timeZone: timezone }),
  );
  return new Date(
    approximate.getTime() - (displayed.getTime() - approximate.getTime()),
  ).toISOString();
}

async function reachedDailyLimit(
  userId: string,
  type: NotificationType,
  prefs: NotificationPreferences | null,
  now: Date,
): Promise<boolean> {
  const { count, error } = await supabaseAdmin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("notification_type", type)
    .gte("created_at", timezoneMidnight(now, prefs?.timezone || "UTC"));

  if (error) throw error;
  return (count || 0) >= (prefs?.max_per_type_per_day ?? 3);
}

async function claimNotification(
  userId: string,
  key: string,
): Promise<boolean> {
  const { error } = await supabaseAdmin.from("notification_dedup").insert({
    user_id: userId,
    notification_key: key,
  });

  if (!error) return true;
  if (error.code === "23505") return false;
  throw error;
}

async function releaseClaim(userId: string, key: string): Promise<void> {
  await supabaseAdmin
    .from("notification_dedup")
    .delete()
    .eq("user_id", userId)
    .eq("notification_key", key);
}

export async function sendOneSignalPush(params: {
  recipientIds: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  webUrl?: string;
}): Promise<boolean> {
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;
  const appId =
    process.env.ONESIGNAL_APP_ID || process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;
  if (!apiKey || !appId) {
    console.error("OneSignal is not configured");
    return false;
  }

  try {
    const response = await fetch(
      "https://api.onesignal.com/notifications?c=push",
      {
        method: "POST",
        headers: {
          Authorization: `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app_id: appId,
          include_aliases: { external_id: params.recipientIds },
          target_channel: "push",
          headings: { en: params.title },
          contents: { en: params.body },
          data: params.data || {},
          web_url: params.webUrl,
        }),
      },
    );

    if (!response.ok) {
      console.error(
        "OneSignal API error:",
        response.status,
        await response.text(),
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error("OneSignal send error:", error);
    return false;
  }
}

export async function deliverNotification(params: {
  userId: string;
  notificationKey: string;
  notificationType: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  relatedVehicleId?: string | null;
  relatedGroupId?: string | null;
  actionUrl?: string | null;
  webUrl?: string;
  preferences?: NotificationPreferences | null;
  now?: Date;
}): Promise<"skipped" | "in_app" | "pushed" | "failed"> {
  const now = params.now || new Date();
  const prefs =
    params.preferences === undefined
      ? await getUserPreferences(params.userId)
      : params.preferences;
  if (getSuppressionReason(prefs, params.notificationType, now))
    return "skipped";
  if (
    await reachedDailyLimit(params.userId, params.notificationType, prefs, now)
  ) {
    return "skipped";
  }
  if (!(await claimNotification(params.userId, params.notificationKey))) {
    return "skipped";
  }

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
    await releaseClaim(params.userId, params.notificationKey);
    return "failed";
  }

  const { deliver } = shouldDeliverNotification(
    prefs,
    params.notificationType,
    now,
  );
  if (!deliver) return "in_app";

  return (await sendOneSignalPush({
    recipientIds: [params.userId],
    title: params.title,
    body: params.body,
    data: params.data,
    webUrl: params.webUrl,
  }))
    ? "pushed"
    : "in_app";
}

export async function cleanupDedupRecords(): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  await supabaseAdmin
    .from("notification_dedup")
    .delete()
    .lt("sent_at", cutoff.toISOString());
}
