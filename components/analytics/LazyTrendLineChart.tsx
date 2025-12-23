import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, Text } from "react-native";
import { useStyles } from "react-native-unistyles";
import { TrendDataPoint } from "../../types/analytics";

interface LazyTrendLineChartProps {
  data: TrendDataPoint[];
  title: string;
  yAxisLabel?: string;
  height?: number;
  color?: string;
}

/**
 * Lazy-loaded wrapper for TrendLineChart
 * Defers loading of react-native-chart-kit until the component is actually needed
 * This reduces the initial bundle size significantly
 */
export function LazyTrendLineChart(props: LazyTrendLineChartProps) {
  const [ChartComponent, setChartComponent] = useState<any>(null);
  const { theme } = useStyles();

  useEffect(() => {
    // Only load the chart library if there's data to display
    if (props.data.length > 0) {
      import("./TrendLineChart").then((module) => {
        setChartComponent(() => module.TrendLineChart);
      });
    }
  }, [props.data.length]);

  // Show loading indicator while chart is being loaded
  if (props.data.length > 0 && !ChartComponent) {
    return (
      <View
        style={{
          height: props.height || 220,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          marginBottom: theme.spacing.md,
        }}
      >
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text
          style={{
            marginTop: theme.spacing.sm,
            color: theme.colors.textSecondary,
            fontSize: theme.fontSize.sm,
          }}
        >
          Loading chart...
        </Text>
      </View>
    );
  }

  // Render the actual chart once loaded
  if (ChartComponent) {
    return <ChartComponent {...props} />;
  }

  // Show empty state if no data
  return (
    <View
      style={{
        height: props.height || 220,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.md,
        padding: theme.spacing.lg,
      }}
    >
      <Text
        style={{
          fontSize: theme.fontSize.lg,
          fontWeight: theme.fontWeight.semibold,
          color: theme.colors.text,
          marginBottom: theme.spacing.sm,
        }}
      >
        {props.title}
      </Text>
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontSize: theme.fontSize.sm,
        }}
      >
        No data available
      </Text>
    </View>
  );
}
