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

export const handler: Handler = async () => {
  console.log("generate-analytics-insights: starting");

  try {
    const now = new Date();
    const isFirstWeekOfMonth = now.getDate() <= 7;
    const weekKey = `${now.getFullYear()}-W${Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7)}`;
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Get all users with fuel logs
    const { data: users } = await supabaseAdmin.from("profiles").select("id");

    if (!users || users.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ sentCount: 0 }) };
    }

    let sentCount = 0;

    for (const user of users) {
      const prefs = await getUserPreferences(user.id);

      // Check analytics frequency preference
      const frequency = prefs
        ? (prefs as any).analytics_frequency || "weekly"
        : "weekly";

      if (frequency === "never") continue;
      if (frequency === "monthly" && !isFirstWeekOfMonth) continue;

      const { deliver } = shouldDeliverNotification(prefs, "analytics_insight");

      const dedupKey = `analytics_insight:${frequency === "monthly" ? monthKey : weekKey}`;
      if (await isDeduplicated(user.id, dedupKey)) continue;

      // Get recent fuel logs for this user (last 30 days)
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: fuelLogs } = await supabaseAdmin
        .from("fuel_logs")
        .select("cost, liters_filled, odometer_reading, date")
        .eq("user_id", user.id)
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (!fuelLogs || fuelLogs.length < 2) continue;

      // Calculate total cost and fuel efficiency
      const totalCost = fuelLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
      const totalLiters = fuelLogs.reduce(
        (sum, log) => sum + log.liters_filled,
        0,
      );

      // Calculate km driven (difference between first and last odometer)
      const firstOdometer = fuelLogs[0].odometer_reading;
      const lastOdometer = fuelLogs[fuelLogs.length - 1].odometer_reading;
      const kmDriven = lastOdometer - firstOdometer;

      let title: string;
      let body: string;
      const data: Record<string, any> = {
        period: frequency === "monthly" ? monthKey : weekKey,
        totalCost,
        totalLiters,
        logCount: fuelLogs.length,
      };

      if (kmDriven > 0 && totalLiters > 0) {
        const efficiency = kmDriven / totalLiters;
        data.efficiency = Math.round(efficiency * 100) / 100;
        data.kmDriven = kmDriven;

        title =
          frequency === "monthly"
            ? "Monthly Fuel Report"
            : "Weekly Fuel Summary";
        body = `${kmDriven.toLocaleString()} km driven, ${efficiency.toFixed(1)} km/L efficiency. Total spent: $${totalCost.toFixed(2)}`;
      } else {
        title =
          frequency === "monthly"
            ? "Monthly Cost Summary"
            : "Weekly Cost Summary";
        body = `${fuelLogs.length} fuel entries totaling $${totalCost.toFixed(2)} (${totalLiters.toFixed(1)}L) in the past ${frequency === "monthly" ? "month" : "week"}`;
      }

      await createNotificationRecord({
        userId: user.id,
        notificationType: "analytics_insight",
        title,
        body,
        data,
      });

      if (deliver) {
        await sendOneSignalPush({
          recipientIds: [user.id],
          title,
          body,
          data: { type: "analytics_insight" },
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
