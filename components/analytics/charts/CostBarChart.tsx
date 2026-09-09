/**
 * Cost Bar Chart using react-native-chart-kit
 * Displays cost comparisons across time periods
 */

import React from "react";
import { Dimensions, Text, View } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { CostChartDataPoint } from "../../../types/analytics";
import { withOpacity } from "@/src/design-system";

interface CostBarChartProps {
  data: CostChartDataPoint[];
  title: string;
  type?: "fuel" | "service" | "total";
  height?: number;
}

export function CostBarChart({
  data,
  title,
  type = "total",
  height = 250,
}: CostBarChartProps) {
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

  const barColor =
    type === "fuel"
      ? theme.colors.analytics.fuel
      : type === "service"
        ? theme.colors.analytics.service
        : theme.colors.analytics.cost;

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        data: data.map((d) =>
          type === "fuel"
            ? d.fuelCost
            : type === "service"
              ? d.serviceCost
              : d.totalCost,
        ),
      },
    ],
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: () => barColor,
    labelColor: (opacity = 1) =>
      withOpacity(theme.colors.textSecondary, opacity),
    style: {
      borderRadius: theme.borderRadius.lg,
    },
    barPercentage: 0.7,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <BarChart
        data={chartData}
        width={screenWidth - 32}
        height={height}
        chartConfig={chartConfig}
        style={styles.chart}
        fromZero
        showValuesOnTopOfBars={false}
        withInnerLines={true}
        yAxisLabel=""
        yAxisSuffix=""
      />
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
