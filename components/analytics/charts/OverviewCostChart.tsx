import type { CostChartDataPoint } from "../../../types/analytics";

// ponytail: web-only; native Overview keeps CostBreakdownCard.
export function OverviewCostChart(_: {
  data: CostChartDataPoint[];
  previous?: CostChartDataPoint[];
  height?: number;
}) {
  return null;
}
