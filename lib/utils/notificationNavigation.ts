import type { NotificationData } from "../services/notificationService";

type NotificationRouteInput = Pick<
  NotificationData,
  | "notification_type"
  | "related_vehicle_id"
  | "related_group_id"
  | "action_url"
  | "data"
>;

export function getNotificationRoute(
  notification: NotificationRouteInput,
): string | null {
  switch (notification.notification_type) {
    case "mileage_log":
    case "fuel_log":
    case "service_log":
    case "mileage_reminder":
      return notification.related_vehicle_id
        ? `/vehicles/${notification.related_vehicle_id}`
        : null;
    case "service_reminder":
      return notification.data?.serviceLogId
        ? `/logs/service/${notification.data.serviceLogId}`
        : notification.related_vehicle_id
          ? `/vehicles/${notification.related_vehicle_id}`
          : null;
    case "group_member":
      return notification.related_group_id
        ? `/groups/${notification.related_group_id}`
        : null;
    case "group_invite":
      return "/notifications";
    case "cost_alert":
      return "/analytics/costs";
    case "analytics_insight":
      return "/analytics/fuel";
    default:
      return notification.action_url?.startsWith("/") &&
        !notification.action_url.startsWith("//")
        ? notification.action_url
        : null;
  }
}

export function getPushNotificationRoute(
  data: Record<string, unknown> | undefined,
): string | null {
  if (!data?.type) return null;

  switch (data.type) {
    case "log_update":
      return typeof data.vehicleId === "string"
        ? `/vehicles/${data.vehicleId}`
        : null;
    case "group_member":
      return typeof data.groupId === "string"
        ? `/groups/${data.groupId}`
        : null;
    case "group_invite":
      return "/notifications";
    case "service_reminder":
      return typeof data.serviceLogId === "string"
        ? `/logs/service/${data.serviceLogId}`
        : typeof data.vehicleId === "string"
          ? `/vehicles/${data.vehicleId}`
          : null;
    case "mileage_reminder":
      return typeof data.vehicleId === "string"
        ? `/vehicles/${data.vehicleId}`
        : null;
    case "cost_alert":
      return "/analytics/costs";
    case "analytics_insight":
      return "/analytics/fuel";
    default:
      return null;
  }
}
