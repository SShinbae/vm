/**
 * Scheduled function: Check service reminders (daily at 9 AM UTC)
 *
 * Queries service_logs.next_service_due within 30 days,
 * determines which thresholds apply, and sends reminder notifications.
 */

import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./_shared/supabaseAdmin";
import {
  getUserPreferences,
  shouldDeliverNotification,
  sendOneSignalPush,
  createNotificationRecord,
  isDeduplicated,
  recordDedup,
  cleanupDedupRecords,
} from "./_shared/notifications";

export const handler: Handler = async () => {
  console.log("check-reminders: starting daily reminder check");

  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Find service logs with upcoming due dates
    const { data: dueLogs, error: dueError } = await supabaseAdmin
      .from("service_logs")
      .select("id, vehicle_id, user_id, service_type, next_service_due")
      .not("next_service_due", "is", null)
      .lte("next_service_due", thirtyDaysFromNow.toISOString().split("T")[0])
      .order("next_service_due", { ascending: true });

    if (dueError) {
      console.error("Error querying service logs:", dueError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: dueError.message }),
      };
    }

    let sentCount = 0;
    let skippedCount = 0;

    for (const log of dueLogs || []) {
      if (!log.next_service_due) continue;

      const dueDate = new Date(log.next_service_due);
      const daysUntilDue = Math.ceil(
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Determine threshold label
      let thresholdLabel: string | null = null;
      if (daysUntilDue < 0) {
        thresholdLabel = "overdue";
      } else if (daysUntilDue <= 3) {
        thresholdLabel = "3days";
      } else if (daysUntilDue <= 7) {
        thresholdLabel = "7days";
      } else if (daysUntilDue <= 30) {
        thresholdLabel = "30days";
      }

      if (!thresholdLabel) continue;

      // Check user preferences
      const prefs = await getUserPreferences(log.user_id);

      // Check if this threshold is in the user's configured reminder days
      if (prefs) {
        const reminderDays = ((prefs as any)
          .service_reminder_days as number[]) || [30, 7, 3];
        const thresholdDayMap: Record<string, number> = {
          "30days": 30,
          "7days": 7,
          "3days": 3,
          overdue: 0,
        };
        const thresholdDay = thresholdDayMap[thresholdLabel];
        if (
          thresholdDay &&
          !reminderDays.includes(thresholdDay) &&
          thresholdLabel !== "overdue"
        ) {
          skippedCount++;
          continue;
        }
      }

      // Check delivery preferences
      const { deliver } = shouldDeliverNotification(prefs, "service_reminder");

      // Dedup check
      const dedupKey = `service_reminder:${log.vehicle_id}:${thresholdLabel}`;
      const alreadySent = await isDeduplicated(log.user_id, dedupKey);
      if (alreadySent) {
        skippedCount++;
        continue;
      }

      // Get vehicle info
      const { data: vehicle } = await supabaseAdmin
        .from("vehicles")
        .select("make, model, year")
        .eq("id", log.vehicle_id)
        .single();

      const vehicleName = vehicle
        ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
        : "your vehicle";

      let title: string;
      let body: string;

      if (thresholdLabel === "overdue") {
        title = "Service Overdue";
        body = `${log.service_type} for ${vehicleName} was due ${Math.abs(daysUntilDue)} day(s) ago`;
      } else {
        title = "Service Reminder";
        body = `${log.service_type} for ${vehicleName} is due in ${daysUntilDue} day(s)`;
      }

      // Always create notification record
      await createNotificationRecord({
        userId: log.user_id,
        notificationType: "service_reminder",
        title,
        body,
        data: {
          vehicleId: log.vehicle_id,
          serviceLogId: log.id,
          serviceType: log.service_type,
          dueDate: log.next_service_due,
          daysUntilDue,
        },
        relatedVehicleId: log.vehicle_id,
        actionUrl: `/logs/service/${log.id}`,
      });

      // Send push only if preferences allow
      if (deliver) {
        await sendOneSignalPush({
          recipientIds: [log.user_id],
          title,
          body,
          data: {
            type: "service_reminder",
            vehicleId: log.vehicle_id,
            serviceLogId: log.id,
          },
          webUrl: process.env.SITE_URL
            ? `${process.env.SITE_URL}/logs/service/${log.id}`
            : undefined,
          appUrl: `vehiclesmanagement://logs/service/${log.id}`,
        });
      }

      // Record dedup
      await recordDedup(log.user_id, dedupKey);
      sentCount++;
    }

    // Clean up old dedup records
    await cleanupDedupRecords();

    console.log(
      `check-reminders: done. ${sentCount} sent, ${skippedCount} skipped`,
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ sentCount, skippedCount }),
    };
  } catch (error) {
    console.error("check-reminders error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal error" }),
    };
  }
};
