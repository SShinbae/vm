/**
 * Scheduled function: Check cost alerts (weekly, Mondays 10 AM UTC)
 *
 * Aggregates fuel costs per user for current month,
 * compares against spending thresholds, and flags expensive fuel entries.
 */

import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./_shared/supabaseAdmin";
import {
  deliverNotification,
  getUserPreferences,
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
      const threshold = prefs?.monthly_spending_threshold;

      if (!threshold || totalCost < threshold) continue;

      const dedupKey = `cost_alert:monthly:${monthKey}`;
      const title = "Monthly spending alert";
      const body = `Your fuel spending this month (RM${totalCost.toFixed(2)}) has exceeded your threshold (RM${threshold.toFixed(2)})`;

      const result = await deliverNotification({
        userId,
        notificationKey: dedupKey,
        notificationType: "cost_alert",
        title,
        body,
        data: { type: "cost_alert", totalCost, threshold, month: monthKey },
        actionUrl: "/analytics/costs",
        webUrl: process.env.SITE_URL
          ? `${process.env.SITE_URL}/analytics/costs`
          : undefined,
        preferences: prefs,
      });
      if (result === "in_app" || result === "pushed") sentCount++;
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
        const alertPercentage = prefs?.fuel_price_alert_percentage || 20;

        if (latestPrice > avgPrice * (1 + alertPercentage / 100)) {
          const dedupKey = `cost_alert:fuel_price:${monthKey}`;
          const title = "Fuel price alert";
          const body = `Your latest fuel price (RM${latestPrice.toFixed(2)}/L) is ${Math.round(((latestPrice - avgPrice) / avgPrice) * 100)}% above your average (RM${avgPrice.toFixed(2)}/L)`;

          const result = await deliverNotification({
            userId,
            notificationKey: dedupKey,
            notificationType: "cost_alert",
            title,
            body,
            data: {
              type: "cost_alert",
              latestPrice,
              avgPrice,
              alertPercentage,
            },
            actionUrl: "/analytics/costs",
            webUrl: process.env.SITE_URL
              ? `${process.env.SITE_URL}/analytics/costs`
              : undefined,
            preferences: prefs,
          });
          if (result === "in_app" || result === "pushed") sentCount++;
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
