import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./_shared/supabaseAdmin";
import {
  cleanupDedupRecords,
  deliverNotification,
  getUserPreferences,
  applicableThresholds,
} from "./_shared/notifications";

type Reminder = {
  type: "service_reminder" | "mileage_reminder";
  key: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
};

export const handler: Handler = async () => {
  console.log("check-reminders: starting daily reminder check");

  try {
    // ponytail: one daily scan is enough at current scale; add a due-reminders view if this table becomes large.
    const { data: logs, error } = await supabaseAdmin
      .from("service_logs")
      .select(
        "id, vehicle_id, user_id, service_type, next_service_due, next_service_mileage, vehicles(make, model, year, current_mileage)",
      )
      .or("next_service_due.not.is.null,next_service_mileage.not.is.null");
    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }

    const now = new Date();
    let sentCount = 0;
    let skippedCount = 0;

    for (const log of (logs || []) as any[]) {
      const prefs = await getUserPreferences(log.user_id);
      const vehicle = Array.isArray(log.vehicles)
        ? log.vehicles[0]
        : log.vehicles;
      const vehicleName = vehicle
        ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
        : "your vehicle";
      const serviceType = String(log.service_type).replaceAll("_", " ");
      const serviceName = serviceType
        ? serviceType[0].toUpperCase() + serviceType.slice(1)
        : "Service";
      const reminders: Reminder[] = [];

      if (log.next_service_due) {
        const days = Math.ceil(
          (new Date(log.next_service_due).getTime() - now.getTime()) /
            86_400_000,
        );
        const thresholds = (prefs?.service_reminder_days || [30, 7, 3]).filter(
          (value) => value <= 30,
        );
        for (const threshold of applicableThresholds(days, thresholds)) {
          const overdue = threshold === 0;
          reminders.push({
            type: "service_reminder",
            key: `service_reminder:${log.id}:${log.next_service_due}:${overdue ? "overdue" : threshold}`,
            title: overdue ? "Service overdue" : "Service reminder",
            body: overdue
              ? `${serviceName} for ${vehicleName} was due ${Math.abs(days)} day(s) ago`
              : `${serviceName} for ${vehicleName} is due in ${days} day(s)`,
            data: {
              type: "service_reminder",
              vehicleId: log.vehicle_id,
              serviceLogId: log.id,
              dueDate: log.next_service_due,
              daysUntilDue: days,
            },
          });
        }
      }

      if (
        log.next_service_mileage != null &&
        vehicle?.current_mileage != null
      ) {
        const remaining = log.next_service_mileage - vehicle.current_mileage;
        const thresholds = prefs?.mileage_reminder_thresholds || [5000, 1000];
        for (const threshold of applicableThresholds(remaining, thresholds)) {
          const overdue = threshold === 0;
          reminders.push({
            type: "mileage_reminder",
            key: `mileage_reminder:${log.id}:${log.next_service_mileage}:${overdue ? "overdue" : threshold}`,
            title: overdue ? "Service mileage overdue" : "Mileage reminder",
            body: overdue
              ? `${serviceName} for ${vehicleName} is ${Math.abs(remaining).toLocaleString()} km overdue`
              : `${serviceName} for ${vehicleName} is due in ${remaining.toLocaleString()} km`,
            data: {
              type: "mileage_reminder",
              vehicleId: log.vehicle_id,
              serviceLogId: log.id,
              dueMileage: log.next_service_mileage,
              remainingMileage: remaining,
            },
          });
        }
      }

      const sentTypes = new Set<string>();
      for (const reminder of reminders) {
        if (sentTypes.has(reminder.type)) continue;
        const result = await deliverNotification({
          userId: log.user_id,
          notificationKey: reminder.key,
          notificationType: reminder.type,
          title: reminder.title,
          body: reminder.body,
          data: reminder.data,
          relatedVehicleId: log.vehicle_id,
          actionUrl: `/logs/service/${log.id}`,
          webUrl: process.env.SITE_URL
            ? `${process.env.SITE_URL}/logs/service/${log.id}`
            : undefined,
          preferences: prefs,
          now,
        });
        if (result === "in_app" || result === "pushed") {
          sentCount++;
          sentTypes.add(reminder.type);
        } else {
          skippedCount++;
        }
      }
    }

    await cleanupDedupRecords();
    console.log(
      `check-reminders: ${sentCount} created, ${skippedCount} skipped`,
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
