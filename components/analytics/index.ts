export { MetricCard } from "./MetricCard";
export { PeriodSelector } from "./PeriodSelector";
export { VehicleFilter } from "./VehicleFilter";
export { EmptyAnalytics } from "./EmptyAnalytics";
export { TrendLineChart } from "./TrendLineChart";
export { LazyTrendLineChart } from "./LazyTrendLineChart";
export { UpcomingServiceCard } from "./UpcomingServiceCard";
export { AnalyticsTabBar } from "./AnalyticsTabBar";
export { AnalyticsHeader } from "./AnalyticsHeader";
export { CostBreakdownCard } from "./CostBreakdownCard";
export { StatCard } from "./StatCard";

// OPTIMIZATION: Export lazy-loaded chart components for code splitting
export {
  LazyTrendLineChart as LazyTrendLineChartV2,
  LazyCostLineChart,
  LazyCostAreaChart,
  LazyCostBarChart,
  LazyCostPieChart,
  LazyCostStackedBarChart,
} from "./LazyChartComponents";
