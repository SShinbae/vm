import { logger } from "@/lib/utils/logger";
import { Platform } from "react-native";

export async function scheduleSnooze(params: {
  notificationId: string;
  title: string;
  body: string;
  snoozeUntil: Date;
  data?: Record<string, any>;
}): Promise<string | null> {
  if (Platform.OS === "web" || params.snoozeUntil <= new Date()) return null;

  try {
    const Notifications = await import("expo-notifications");
    const permission = await Notifications.getPermissionsAsync();
    if (permission.status !== "granted") return null;

    return await Notifications.scheduleNotificationAsync({
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
  } catch (error) {
    if (__DEV__) logger.error("Error scheduling snooze notification:", error);
    return null;
  }
}
