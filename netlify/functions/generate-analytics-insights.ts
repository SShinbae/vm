/**
 * Scheduled function: Generate analytics insights (weekly, Mondays 11 AM UTC)
 *
 * Calculates fuel efficiency trends and cost summaries,
 * respects user's analytics_frequency setting.
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
} from "./_shared/notifications";
import { calculateFuelEfficiency } from "../../lib/analytics/calculations";
import { getPreviousReportingPeriod } from "./_shared/reportingPeriod";
import type { FuelLog } from "../../types";

export const handler: Handler = async () => {
  console.log("generate-analytics-insights: starting");

  try {
    const now = new Date();
    // Get all users; users without fuel logs in the reporting period are skipped.
    const { data: users } = await supabaseAdmin.from("profiles").select("id");

    if (!users || users.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ sentCount: 0 }) };
    }

    let sentCount = 0;

    for (const user of users) {
      const prefs = await getUserPreferences(user.id);

      // Check analytics frequency preference
      const frequency = prefs?.analytics_frequency || "weekly";

      if (frequency === "never") continue;

      const period = getPreviousReportingPeriod(
        now,
        frequency,
        prefs?.timezone,
      );
      if (frequency === "monthly" && period.localDayOfMonth > 7) continue;

      const { deliver } = shouldDeliverNotification(prefs, "analytics_insight");

      const dedupKey = `analytics_insight:${frequency}:${period.periodKey}`;
      if (await isDeduplicated(user.id, dedupKey)) continue;

      const { data: fuelLogs } = await supabaseAdmin
        .from("fuel_logs")
        .select(
          "id, user_id, vehicle_id, cost, liters_filled, odometer_reading, date, location, created_at",
        )
        .eq("user_id", user.id)
        .gte("date", period.startDate)
        .lt("date", period.endDate)
        .order("date", { ascending: true });

      if (!fuelLogs || fuelLogs.length === 0) continue;

      const totalCost = fuelLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
      const totalLiters = fuelLogs.reduce(
        (sum, log) => sum + log.liters_filled,
        0,
      );
      const fuelMetrics = calculateFuelEfficiency(fuelLogs as FuelLog[], []);

      let title: string;
      let body: string;
      const data: Record<string, any> = {
        period: period.periodKey,
        periodStart: period.startDate,
        periodEnd: period.endDate,
        totalCost,
        totalLiters,
        logCount: fuelLogs.length,
      };

      if (fuelMetrics.totalDistance > 0 && fuelMetrics.averageConsumption > 0) {
        const efficiency = 100 / fuelMetrics.averageConsumption;
        data.efficiency = Math.round(efficiency * 100) / 100;
        data.kmDriven = fuelMetrics.totalDistance;

        title =
          frequency === "monthly"
            ? "Monthly Fuel Report"
            : "Weekly Fuel Summary";
        body = `${fuelMetrics.totalDistance.toLocaleString()} km driven, ${efficiency.toFixed(1)} km/L efficiency. Total spent: RM${totalCost.toFixed(2)}`;
      } else {
        title =
          frequency === "monthly"
            ? "Monthly Cost Summary"
            : "Weekly Cost Summary";
        body = `${fuelLogs.length} fuel ${fuelLogs.length === 1 ? "entry" : "entries"} totaling RM${totalCost.toFixed(2)} (${totalLiters.toFixed(1)}L)`;
      }

      await createNotificationRecord({
        userId: user.id,
        notificationType: "analytics_insight",
        title,
        body,
        data,
        actionUrl: "/analytics/fuel",
      });

      if (deliver) {
        await sendOneSignalPush({
          recipientIds: [user.id],
          title,
          body,
          data: { type: "analytics_insight", period: period.periodKey },
          webUrl: process.env.SITE_URL
            ? `${process.env.SITE_URL}/analytics/fuel`
            : undefined,
          appUrl: "vehiclesmanagement://analytics/fuel",
        });
      }

      await recordDedup(user.id, dedupKey);
      sentCount++;
    }

    console.log(
      `generate-analytics-insights: done. ${sentCount} insights sent`,
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ sentCount }),
    };
  } catch (error) {
    console.error("generate-analytics-insights error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal error" }),
    };
  }
};
