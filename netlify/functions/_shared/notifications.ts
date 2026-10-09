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

// Start of "today" in `timezone`, as a UTC ISO string. Uses only Intl parts —
// never parses a locale string, which would read it in the server's own zone
// (that made the daily limit miss rows on non-UTC hosts).
// ponytail: offset taken at `now`; on a DST-change day midnight can be 1h off,
// fine for a per-day notification cap.
export function timezoneMidnight(now: Date, timezone: string): string {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
  } catch {
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    ).toISOString();
  }

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const year = value("year");
  const month = value("month") - 1;
  const day = value("day");
  const localAsUtc = Date.UTC(
    year,
    month,
    day,
    value("hour"),
    value("minute"),
    value("second"),
  );
  const offsetMs = Math.round((localAsUtc - now.getTime()) / 60_000) * 60_000;
  return new Date(Date.UTC(year, month, day) - offsetMs).toISOString();
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

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_BATCH_SIZE = 100;

interface ExpoPushTicket {
  status: "ok" | "error";
  message?: string;
  details?: { error?: string };
}

// ponytail: tickets only; add a receipts check (getReceipts) if silent APNs/FCM failures show up.
export async function sendExpoPush(params: {
  recipientIds: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<boolean> {
  const { data: rows, error } = await supabaseAdmin
    .from("push_tokens")
    .select("token")
    .in("user_id", params.recipientIds);
  if (error) {
    console.error("Error loading push tokens:", error);
    return false;
  }

  const tokens = (rows ?? []).map((row) => row.token as string);
  if (tokens.length === 0) return false;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (process.env.EXPO_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
  }

  let delivered = false;
  const deadTokens: string[] = [];

  for (let i = 0; i < tokens.length; i += EXPO_BATCH_SIZE) {
    const batch = tokens.slice(i, i + EXPO_BATCH_SIZE);
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(
          batch.map((to) => ({
            to,
            title: params.title,
            body: params.body,
            data: params.data || {},
            sound: "default",
            // Default (FCM normal) priority is held back while Android has the
            // app frozen in the background; high priority wakes it to show the push.
            priority: "high",
            channelId: "default",
          })),
        ),
      });
      if (!response.ok) {
        console.error(
          "Expo push API error:",
          response.status,
          await response.text(),
        );
        continue;
      }
      const { data: tickets } = (await response.json()) as {
        data: ExpoPushTicket[];
      };
      tickets.forEach((ticket, index) => {
        if (ticket.status === "ok") {
          delivered = true;
        } else if (ticket.details?.error === "DeviceNotRegistered") {
          deadTokens.push(batch[index]);
        } else {
          console.error("Expo push ticket error:", ticket.message);
        }
      });
    } catch (sendError) {
      console.error("Expo push send error:", sendError);
    }
  }

  if (deadTokens.length > 0) {
    await supabaseAdmin.from("push_tokens").delete().in("token", deadTokens);
  }
  return delivered;
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

  return (await sendExpoPush({
    recipientIds: [params.userId],
    title: params.title,
    body: params.body,
    data: params.data,
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
