/**
 * Cost Pie Chart using Victory Native
 * Shows fuel vs service cost breakdown
 */

import React from "react";
import { Dimensions, Text, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { VictoryPie, VictoryLabel } from "victory-native";
import {
  generatePieChartData,
  transformToPieData,
} from "../../../lib/analytics/chart-helpers";
import { ChartLegend, LegendItem } from "./ChartLegend";

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
  height = 300,
  showLegend = true,
}: CostPieChartProps) {
  const { styles, theme } = useStyles(stylesheet);
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - 32;

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

  const pieChartData = generatePieChartData(totalFuelCost, totalServiceCost, {
    fuel: theme.colors.analytics.fuel,
    service: theme.colors.analytics.service,
  });

  const victoryData = transformToPieData(pieChartData);

  const isDark = theme.colors.background === "#1e292e";
  const labelColor = isDark ? "#FFFFFF" : "#000000";

  const legendItems: LegendItem[] = pieChartData.map((item) => ({
    name: item.label,
    color: item.color,
    value: `RM${item.value.toFixed(2)} (${item.percentage.toFixed(1)}%)`,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        <VictoryPie
          data={victoryData}
          width={chartWidth}
          height={height}
          colorScale={[
            theme.colors.analytics.fuel,
            theme.colors.analytics.service,
          ]}
          innerRadius={height * 0.25}
          labelRadius={height * 0.35}
          style={{
            labels: {
              fill: labelColor,
              fontSize: 14,
              fontWeight: "bold",
            },
            data: {
              stroke: theme.colors.surface,
              strokeWidth: 2,
            },
          }}
          labelComponent={
            <VictoryLabel
              style={{
                fill: labelColor,
                fontSize: 12,
                fontWeight: "600",
              }}
            />
          }
        />

        {/* Center Total */}
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
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabelTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  centerLabelValue: {
    fontSize: theme.fontSize.xl,
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
