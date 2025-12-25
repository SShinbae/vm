/**
 * Lazy-loaded chart components for code splitting
 * This file provides React.lazy wrappers for heavy chart libraries
 * to reduce initial bundle size and improve app startup performance
 */

import React, { Suspense, ComponentType } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useStyles } from "react-native-unistyles";

// OPTIMIZATION: Lazy load chart components to reduce initial bundle size
const TrendLineChartLazy = React.lazy(() =>
  import("./TrendLineChart").then((module) => ({
    default: module.TrendLineChart,
  })),
);

const CostLineChartLazy = React.lazy(() =>
  import("./charts/CostLineChart").then((module) => ({
    default: module.CostLineChart,
  })),
);

const CostAreaChartLazy = React.lazy(() =>
  import("./charts/CostAreaChart").then((module) => ({
    default: module.CostAreaChart,
  })),
);

const CostBarChartLazy = React.lazy(() =>
  import("./charts/CostBarChart").then((module) => ({
    default: module.CostBarChart,
  })),
);

const CostPieChartLazy = React.lazy(() =>
  import("./charts/CostPieChart").then((module) => ({
    default: module.CostPieChart,
  })),
);

const CostStackedBarChartLazy = React.lazy(() =>
  import("./charts/CostStackedBarChart").then((module) => ({
    default: module.CostStackedBarChart,
  })),
);

// Loading fallback component
function ChartLoadingFallback({ height = 220 }: { height?: number }) {
  const { theme } = useStyles();

  return (
    <View
      style={{
        height,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        justifyContent: "center",
        alignItems: "center",
        padding: theme.spacing.xl,
      }}
    >
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text
        style={{
          marginTop: theme.spacing.md,
          color: theme.colors.textSecondary,
          fontSize: theme.fontSize.sm,
        }}
      >
        Loading chart...
      </Text>
    </View>
  );
}

// HOC to wrap lazy components with Suspense
function withChartSuspense<P extends object>(
  Component: ComponentType<P>,
  height?: number,
) {
  return function ChartWithSuspense(props: P) {
    return (
      <Suspense fallback={<ChartLoadingFallback height={height} />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Export lazy-loaded components wrapped with Suspense
export const LazyTrendLineChart = withChartSuspense(TrendLineChartLazy, 220);
export const LazyCostLineChart = withChartSuspense(CostLineChartLazy, 220);
export const LazyCostAreaChart = withChartSuspense(CostAreaChartLazy, 220);
export const LazyCostBarChart = withChartSuspense(CostBarChartLazy, 220);
export const LazyCostPieChart = withChartSuspense(CostPieChartLazy, 300);
export const LazyCostStackedBarChart = withChartSuspense(
  CostStackedBarChartLazy,
  220,
);
