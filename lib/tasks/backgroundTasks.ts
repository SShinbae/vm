/**
 * Background Tasks
 *
 * Registers a background fetch task that runs ~daily (OS-determined).
 * Acts as a backup: queries Supabase for due reminders and schedules
 * local notifications if server push hasn't arrived.
 *
 * Platform guard: no-op on web.
 */

import { Platform } from "react-native";

const BACKGROUND_NOTIFICATION_CHECK = "BACKGROUND_NOTIFICATION_CHECK";

/**
 * Register the background notification check task.
 * Call once after auth init on mobile platforms.
 */
export async function registerBackgroundTask(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const TaskManager = await import("expo-task-manager");
    const BackgroundFetch = await import("expo-background-fetch");

    // Define the task
    TaskManager.defineTask(BACKGROUND_NOTIFICATION_CHECK, async () => {
      try {
        // Dynamically import to avoid circular deps
        const { supabase } = await import("../../services/supabaseClient");
        const { scheduleServiceReminder } =
          await import("../services/localNotificationService");

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        // Check for upcoming service reminders (next 7 days)
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const { data: dueLogs } = await supabase
          .from("service_logs")
          .select("id, vehicle_id, service_type, next_service_due")
          .eq("user_id", user.id)
          .not("next_service_due", "is", null)
          .lte("next_service_due", sevenDaysFromNow.toISOString().split("T")[0])
          .gte("next_service_due", new Date().toISOString().split("T")[0]);

        if (!dueLogs || dueLogs.length === 0) {
          return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        // Schedule local notifications for due services
        for (const log of dueLogs as any[]) {
          if (!log.next_service_due) continue;
          await scheduleServiceReminder({
            vehicleId: log.vehicle_id,
            serviceName: log.service_type,
            dueDate: new Date(log.next_service_due),
            reminderDays: [3, 1, 0],
          });
        }

        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error("Background task error:", error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    // Register for background fetch
    const status = await BackgroundFetch.getStatusAsync();
    if (status === BackgroundFetch.BackgroundFetchStatus.Available) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_CHECK, {
        minimumInterval: 24 * 60 * 60, // ~daily
        stopOnTerminate: false,
        startOnBoot: true,
      });

      if (__DEV__) {
        console.log("Background notification check task registered");
      }
    }
  } catch (error) {
    if (__DEV__) {
      console.log("Background tasks not available:", error);
    }
  }
}
