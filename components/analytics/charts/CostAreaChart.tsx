/**
 * Cost Area Chart using react-native-chart-kit
 * Shows cumulative cost trends over time
 */

import React from "react";
import { Dimensions, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { CostChartDataPoint } from "../../../types/analytics";
import { calculateCumulativeCosts } from "../../../lib/analytics/chart-helpers";
import { ChartLegend, LegendItem } from "./ChartLegend";

interface CostAreaChartProps {
  data: CostChartDataPoint[];
  title: string;
  height?: number;
  showLegend?: boolean;
}

export function CostAreaChart({
  data,
  title,
  height = 250,
  showLegend = true,
}: CostAreaChartProps) {
  const { styles, theme } = useStyles(stylesheet);
  const screenWidth = Dimensions.get("window").width;

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.emptyContainer, { height }]}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      </View>
    );
  }

  const cumulativeData = calculateCumulativeCosts(data);
  const isDark = theme.colors.background === "#1e292e";

  const chartData = {
    labels: cumulativeData.map((d) => d.label),
    datasets: [
      {
        data: cumulativeData.map((d) => d.totalCost),
        color: () => theme.colors.analytics.cost,
        strokeWidth: 3,
      },
      {
        data: cumulativeData.map((d) => d.fuelCost),
        color: () => theme.colors.analytics.fuel,
        strokeWidth: 2,
      },
      {
        data: cumulativeData.map((d) => d.serviceCost),
        color: () => theme.colors.analytics.service,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) =>
      isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) =>
      isDark
        ? `rgba(255, 255, 255, ${opacity * 0.7})`
        : `rgba(0, 0, 0, ${opacity * 0.7})`,
    style: {
      borderRadius: theme.borderRadius.lg,
    },
    propsForDots: {
      r: "3",
      strokeWidth: "1",
    },
    fillShadowGradient: theme.colors.analytics.cost,
    fillShadowGradientOpacity: 0.3,
  };

  const legendItems: LegendItem[] = [
    { name: "Total", color: theme.colors.analytics.cost },
    { name: "Fuel", color: theme.colors.analytics.fuel },
    { name: "Service", color: theme.colors.analytics.service },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <LineChart
        data={chartData}
        width={screenWidth - 32}
        height={height}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withInnerLines={false}
        withOuterLines={true}
        withVerticalLines={false}
        withHorizontalLines={true}
        fromZero
      />
      {showLegend && <ChartLegend items={legendItems} />}
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  chart: {
    borderRadius: theme.borderRadius.lg,
  },
  emptyContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
  },
}));
