import { logger } from "@/lib/utils/logger";
/**
 * Local Notification Service
 *
 * Schedules local notifications using expo-notifications.
 * Platform guard: no-op on web.
 */

import { Platform } from "react-native";

// Dynamic imports for expo-notifications (not available on web)
let Notifications: typeof import("expo-notifications") | null = null;

async function ensureNotificationsModule(): Promise<
  typeof import("expo-notifications") | null
> {
  if (Platform.OS === "web") return null;
  if (Notifications) return Notifications;

  try {
    Notifications = await import("expo-notifications");
    return Notifications;
  } catch {
    if (__DEV__) {
      logger.log("expo-notifications not available");
    }
    return null;
  }
}

/**
 * Request local notification permissions (call on app init)
 */
export async function requestLocalNotificationPermissions(): Promise<boolean> {
  const mod = await ensureNotificationsModule();
  if (!mod) return false;

  try {
    const { status: existingStatus } = await mod.getPermissionsAsync();
    if (existingStatus === "granted") return true;

    const { status } = await mod.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

/**
 * Schedule a service reminder as a local notification.
 */
export async function scheduleServiceReminder(params: {
  vehicleId: string;
  serviceName: string;
  dueDate: Date;
  reminderDays: number[];
}): Promise<string[]> {
  const mod = await ensureNotificationsModule();
  if (!mod) return [];

  const scheduledIds: string[] = [];

  for (const days of params.reminderDays) {
    const triggerDate = new Date(params.dueDate);
    triggerDate.setDate(triggerDate.getDate() - days);
    triggerDate.setHours(9, 0, 0, 0); // 9 AM local time

    // Don't schedule in the past
    if (triggerDate <= new Date()) continue;

    try {
      const id = await mod.scheduleNotificationAsync({
        content: {
          title: "Service Reminder",
          body:
            days === 0
              ? `${params.serviceName} is due today`
              : `${params.serviceName} is due in ${days} day${days !== 1 ? "s" : ""}`,
          data: {
            type: "service_reminder",
            vehicleId: params.vehicleId,
          },
        },
        trigger: { type: "date", date: triggerDate } as any,
      });
      scheduledIds.push(id);
    } catch (error) {
      if (__DEV__) {
        logger.error("Error scheduling local notification:", error);
      }
    }
  }

  return scheduledIds;
}

/**
 * Cancel all scheduled notifications for a vehicle.
 */
export async function cancelVehicleReminders(vehicleId: string): Promise<void> {
  const mod = await ensureNotificationsModule();
  if (!mod) return;

  try {
    const scheduled = await mod.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      if (
        notification.content.data &&
        (notification.content.data as any).vehicleId === vehicleId
      ) {
        await mod.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    if (__DEV__) {
      logger.error("Error canceling vehicle reminders:", error);
    }
  }
}

/**
 * Cancel all scheduled local notifications.
 */
export async function cancelAllLocalNotifications(): Promise<void> {
  const mod = await ensureNotificationsModule();
  if (!mod) return;

  try {
    await mod.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    if (__DEV__) {
      logger.error("Error canceling all notifications:", error);
    }
  }
}

/**
 * Schedule a snooze — fires a local notification at the snooze-until time.
 */
export async function scheduleSnooze(params: {
  notificationId: string;
  title: string;
  body: string;
  snoozeUntil: Date;
  data?: Record<string, any>;
}): Promise<string | null> {
  const mod = await ensureNotificationsModule();
  if (!mod) return null;

  if (params.snoozeUntil <= new Date()) return null;

  try {
    const id = await mod.scheduleNotificationAsync({
      content: {
        title: params.title,
        body: params.body,
        data: {
          ...params.data,
          snoozedNotificationId: params.notificationId,
        },
      },
      trigger: { type: "date", date: params.snoozeUntil } as any,
    });
    return id;
  } catch (error) {
    if (__DEV__) {
      logger.error("Error scheduling snooze notification:", error);
    }
    return null;
  }
}
