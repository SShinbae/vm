import type {
  CostChartDataPoint,
  FuelEfficiencyMetrics,
  ServiceMetrics,
} from "../../types/analytics";

export interface InsightInput {
  fuelMetrics: FuelEfficiencyMetrics | null;
  previousFuelMetrics?: FuelEfficiencyMetrics | null;
  serviceMetrics: ServiceMetrics | null;
  series: CostChartDataPoint[];
}

export function calculateDelta(
  current: number,
  previous: number | null | undefined,
): { pct: number; direction: "up" | "down" | "neutral" } | null {
  if (!previous) return null;
  const pct = Math.round((Math.abs(current - previous) / previous) * 100);
  const direction =
    current > previous ? "up" : current < previous ? "down" : "neutral";
  return { pct, direction };
}

export function generateInsights({
  fuelMetrics,
  previousFuelMetrics,
  serviceMetrics,
  series,
}: InsightInput): string[] {
  const out: string[] = [];

  const cur = fuelMetrics?.averageConsumption;
  const prev = previousFuelMetrics?.averageConsumption;
  if (cur && prev) {
    const pct = Math.round((Math.abs(cur - prev) / prev) * 100);
    if (pct > 0) {
      // Lower L/100km is better.
      out.push(
        `Fuel efficiency ${cur < prev ? "improved" : "worsened"} ${pct}% vs previous period`,
      );
    }
  }

  // groupByPeriod zero-fills empty buckets; only compare buckets that had spend.
  const spent = series.filter((p) => p.totalCost > 0);
  if (spent.length > 1) {
    const low = spent.reduce((a, b) => (b.totalCost < a.totalCost ? b : a));
    out.push(
      `Lowest-cost period: ${low.label} (RM${low.totalCost.toFixed(2)})`,
    );
  }

  const next = serviceMetrics?.upcomingServices[0];
  if (next) {
    const when =
      next.daysUntilDue != null
        ? `in ${next.daysUntilDue} days`
        : `in ${next.kmUntilDue} km`;
    out.push(`Next service: ${next.vehicleName} ${when}`);
  }

  return out.slice(0, 3);
}
