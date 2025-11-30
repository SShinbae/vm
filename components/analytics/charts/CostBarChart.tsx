/**
 * Cost Bar Chart using Victory Native
 * Displays cost comparisons across time periods
 */

import React from "react";
import { Dimensions, Text, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import {
  VictoryChart,
  VictoryBar,
  VictoryAxis,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from "victory-native";
import { CostChartDataPoint } from "../../../types/analytics";
import { transformToVictoryData } from "../../../lib/analytics/chart-helpers";

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
  const chartWidth = screenWidth - 32;

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

  const chartData = transformToVictoryData(data, type);

  const isDark = theme.colors.background === "#1e292e";
  const axisColor = isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)";
  const labelColor = isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)";

  const barColor =
    type === "fuel"
      ? theme.colors.analytics.fuel
      : type === "service"
        ? theme.colors.analytics.service
        : theme.colors.analytics.cost;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        <VictoryChart
          width={chartWidth}
          height={height}
          containerComponent={
            <VictoryVoronoiContainer
              labels={({ datum }: any) => `RM${datum.y.toFixed(2)}`}
              labelComponent={
                <VictoryTooltip
                  style={{
                    fill: theme.colors.text,
                    fontSize: 12,
                  }}
                  flyoutStyle={{
                    fill: theme.colors.surface,
                    stroke: theme.colors.border,
                    strokeWidth: 1,
                  }}
                />
              }
            />
          }
          padding={{ top: 20, bottom: 50, left: 50, right: 20 }}
          domainPadding={{ x: [20, 20] }}
        >
          {/* X Axis */}
          <VictoryAxis
            style={{
              axis: { stroke: axisColor, strokeWidth: 1 },
              tickLabels: {
                fill: labelColor,
                fontSize: 10,
                angle: data.length > 7 ? -45 : 0,
                textAnchor: data.length > 7 ? "end" : "middle",
              },
              grid: { stroke: "transparent" },
            }}
          />

          {/* Y Axis */}
          <VictoryAxis
            dependentAxis
            style={{
              axis: { stroke: axisColor, strokeWidth: 1 },
              tickLabels: {
                fill: labelColor,
                fontSize: 10,
              },
              grid: {
                stroke: axisColor,
                strokeWidth: 0.5,
                strokeDasharray: "3,3",
              },
            }}
            tickFormat={(t: any) => `${t}`}
          />

          {/* Bars */}
          <VictoryBar
            data={chartData}
            style={{
              data: {
                fill: barColor,
                width: data.length > 15 ? 8 : 15,
              },
            }}
            cornerRadius={{ top: 4 }}
          />
        </VictoryChart>
      </View>
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
    overflow: "hidden",
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
