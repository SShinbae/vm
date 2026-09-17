export interface NotificationData {
  id: string;
  user_id: string;
  notification_type:
    | "mileage_log"
    | "fuel_log"
    | "service_log"
    | "group_member"
    | "group_invite"
    | "service_reminder"
    | "mileage_reminder"
    | "cost_alert"
    | "analytics_insight";
  title: string;
  body: string;
  data: any | null;
  read: boolean;
  related_vehicle_id?: string | null;
  related_group_id?: string | null;
  action_url?: string | null;
  snoozed_until?: string | null;
  created_at: string;
}

export function formatNotificationText(value: string): string {
  const text = value.replaceAll("_", " ").trim();
  return text ? text[0].toUpperCase() + text.slice(1) : text;
}

export function formatNotificationTitle(value: string): string {
  const text = formatNotificationText(value);
  return text ? text[0] + text.slice(1).toLowerCase() : text;
}
