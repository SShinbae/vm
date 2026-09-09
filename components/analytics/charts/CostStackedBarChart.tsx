/**
 * Cost Stacked Bar Chart using react-native-chart-kit
 * Shows fuel and service costs stacked for comparison
 */

import React from "react";
import { Dimensions, Text, View } from "react-native";
import { StackedBarChart } from "react-native-chart-kit";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { CostChartDataPoint } from "../../../types/analytics";
import { ChartLegend, LegendItem } from "./ChartLegend";
import { withOpacity } from "@/src/design-system";

interface CostStackedBarChartProps {
  data: CostChartDataPoint[];
  title: string;
  height?: number;
  showLegend?: boolean;
}

export function CostStackedBarChart({
  data,
  title,
  height = 250,
  showLegend = true,
}: CostStackedBarChartProps) {
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

  const chartData = {
    labels: data.map((d) => d.label),
    legend: ["Fuel", "Service"],
    data: data.map((d) => [d.fuelCost, d.serviceCost]),
    barColors: [theme.colors.analytics.fuel, theme.colors.analytics.service],
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => withOpacity(theme.colors.text, opacity),
    labelColor: (opacity = 1) =>
      withOpacity(theme.colors.textSecondary, opacity),
    style: {
      borderRadius: theme.borderRadius.lg,
    },
    barPercentage: 0.7,
  };

  const legendItems: LegendItem[] = [
    { name: "Fuel", color: theme.colors.analytics.fuel },
    { name: "Service", color: theme.colors.analytics.service },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <StackedBarChart
        data={chartData}
        width={screenWidth - 32}
        height={height}
        chartConfig={chartConfig}
        style={styles.chart}
        hideLegend
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
