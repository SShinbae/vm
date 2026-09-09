/**
 * Cost Pie Chart using react-native-chart-kit
 * Shows fuel vs service cost breakdown
 */

import React from "react";
import { Dimensions, Text, View } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { ChartLegend, LegendItem } from "./ChartLegend";
import { withOpacity, spacing } from "@/src/design-system";

interface CostPieChartProps {
  totalFuelCost: number;
  totalServiceCost: number;
  title: string;
  height?: number;
  showLegend?: boolean;
}

export function CostPieChart({
  totalFuelCost,
  totalServiceCost,
  title,
  height = 220,
  showLegend = true,
}: CostPieChartProps) {
  const { styles, theme } = useStyles(stylesheet);
  const screenWidth = Dimensions.get("window").width;

  const totalCost = totalFuelCost + totalServiceCost;

  if (totalCost === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.emptyContainer, { height }]}>
          <Text style={styles.emptyText}>No cost data available</Text>
        </View>
      </View>
    );
  }

  const fuelPercentage = (totalFuelCost / totalCost) * 100;
  const servicePercentage = (totalServiceCost / totalCost) * 100;

  const pieData = [
    {
      name: "Fuel",
      cost: totalFuelCost,
      color: theme.colors.analytics.fuel,
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    },
    {
      name: "Service",
      cost: totalServiceCost,
      color: theme.colors.analytics.service,
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    },
  ];

  const chartConfig = {
    color: (opacity = 1) => withOpacity(theme.colors.text, opacity),
  };

  const legendItems: LegendItem[] = [
    {
      name: "Fuel",
      color: theme.colors.analytics.fuel,
      value: `RM${totalFuelCost.toFixed(2)} (${fuelPercentage.toFixed(1)}%)`,
    },
    {
      name: "Service",
      color: theme.colors.analytics.service,
      value: `RM${totalServiceCost.toFixed(2)} (${servicePercentage.toFixed(1)}%)`,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        <PieChart
          data={pieData}
          width={screenWidth - 32}
          height={height}
          chartConfig={chartConfig}
          accessor="cost"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
        <View style={styles.centerLabel}>
          <Text style={styles.centerLabelTitle}>Total</Text>
          <Text style={styles.centerLabelValue}>RM{totalCost.toFixed(2)}</Text>
        </View>
      </View>
      {showLegend && <ChartLegend items={legendItems} orientation="vertical" />}
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
  chartContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  centerLabel: {
    position: "absolute",
    left: "25%",
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabelTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: spacing.xs,
  },
  centerLabelValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
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
