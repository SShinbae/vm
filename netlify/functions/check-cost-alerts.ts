/**
 * Scheduled function: Check cost alerts (weekly, Mondays 10 AM UTC)
 *
 * Aggregates fuel costs per user for current month,
 * compares against spending thresholds, and flags expensive fuel entries.
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
  console.log("check-cost-alerts: starting weekly cost alert check");

  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Get all users who have fuel logs this month
    const { data: monthlyCosts, error: costError } = await supabaseAdmin
      .from("fuel_logs")
      .select("user_id, cost")
      .gte("date", monthStart)
      .not("cost", "is", null);

    if (costError) {
      console.error("Error querying fuel logs:", costError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: costError.message }),
      };
    }

    // Aggregate per user
    const userCosts = new Map<string, number>();
    for (const log of monthlyCosts || []) {
      const current = userCosts.get(log.user_id) || 0;
      userCosts.set(log.user_id, current + (log.cost || 0));
    }

    let sentCount = 0;

    for (const [userId, totalCost] of userCosts) {
      const prefs = await getUserPreferences(userId);

      // Check threshold
      const threshold = prefs
        ? (prefs as any).monthly_spending_threshold
        : null;

      if (!threshold || totalCost < threshold) continue;

      const { deliver } = shouldDeliverNotification(prefs, "cost_alert");

      // Dedup
      const dedupKey = `cost_alert:monthly:${monthKey}`;
      if (await isDeduplicated(userId, dedupKey)) continue;

      const title = "Monthly Spending Alert";
      const body = `Your fuel spending this month ($${totalCost.toFixed(2)}) has exceeded your threshold ($${threshold.toFixed(2)})`;

      await createNotificationRecord({
        userId,
        notificationType: "cost_alert",
        title,
        body,
        data: { totalCost, threshold, month: monthKey },
        actionUrl: "/analytics/costs",
      });

      if (deliver) {
        await sendOneSignalPush({
          recipientIds: [userId],
          title,
          body,
          data: { type: "cost_alert", month: monthKey },
          webUrl: process.env.SITE_URL
            ? `${process.env.SITE_URL}/analytics/costs`
            : undefined,
          appUrl: "vehiclesmanagement://analytics/costs",
        });
      }

      await recordDedup(userId, dedupKey);
      sentCount++;
    }

    // Fuel price anomaly detection: flag entries 20%+ above user's average
    const { data: allFuelLogs } = await supabaseAdmin
      .from("fuel_logs")
      .select("id, user_id, cost, liters_filled, date")
      .not("cost", "is", null)
      .gt("liters_filled", 0)
      .order("date", { ascending: false })
      .limit(5000);

    if (allFuelLogs && allFuelLogs.length > 0) {
      // Calculate per-user average price per liter
      const userPrices = new Map<string, number[]>();
      for (const log of allFuelLogs) {
        const pricePerLiter = (log.cost || 0) / log.liters_filled;
        const list = userPrices.get(log.user_id) || [];
        list.push(pricePerLiter);
        userPrices.set(log.user_id, list);
      }

      for (const [userId, prices] of userPrices) {
        if (prices.length < 3) continue; // Need enough data

        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const latestPrice = prices[0];

        const prefs = await getUserPreferences(userId);
        const alertPercentage = prefs
          ? (prefs as any).fuel_price_alert_percentage || 20
          : 20;

        if (latestPrice > avgPrice * (1 + alertPercentage / 100)) {
          const dedupKey = `cost_alert:fuel_price:${monthKey}`;
          if (await isDeduplicated(userId, dedupKey)) continue;

          const { deliver } = shouldDeliverNotification(prefs, "cost_alert");

          const title = "Fuel Price Alert";
          const body = `Your latest fuel price ($${latestPrice.toFixed(2)}/L) is ${Math.round(((latestPrice - avgPrice) / avgPrice) * 100)}% above your average ($${avgPrice.toFixed(2)}/L)`;

          await createNotificationRecord({
            userId,
            notificationType: "cost_alert",
            title,
            body,
            data: { latestPrice, avgPrice, alertPercentage },
            actionUrl: "/analytics/costs",
          });

          if (deliver) {
            await sendOneSignalPush({
              recipientIds: [userId],
              title,
              body,
              data: { type: "cost_alert" },
              webUrl: process.env.SITE_URL
                ? `${process.env.SITE_URL}/analytics/costs`
                : undefined,
              appUrl: "vehiclesmanagement://analytics/costs",
            });
          }

          await recordDedup(userId, dedupKey);
          sentCount++;
        }
      }
    }

    console.log(`check-cost-alerts: done. ${sentCount} alerts sent`);

    return {
      statusCode: 200,
      body: JSON.stringify({ sentCount }),
    };
  } catch (error) {
    console.error("check-cost-alerts error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal error" }),
    };
  }
};
