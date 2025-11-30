/**
 * Cost Area Chart using Victory Native
 * Shows cumulative cost trends over time
 */

import React from "react";
import { Dimensions, Text, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import {
  VictoryChart,
  VictoryArea,
  VictoryAxis,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from "victory-native";
import { CostChartDataPoint } from "../../../types/analytics";
import {
  calculateCumulativeCosts,
  transformToVictoryData,
} from "../../../lib/analytics/chart-helpers";
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

  const cumulativeData = calculateCumulativeCosts(data);
  const totalData = transformToVictoryData(cumulativeData, "total");
  const fuelData = transformToVictoryData(cumulativeData, "fuel");
  const serviceData = transformToVictoryData(cumulativeData, "service");

  const isDark = theme.colors.background === "#1e292e";
  const axisColor = isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)";
  const labelColor = isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)";

  const legendItems: LegendItem[] = [
    {
      name: "Total",
      color: theme.colors.analytics.cost,
    },
    {
      name: "Fuel",
      color: theme.colors.analytics.fuel,
    },
    {
      name: "Service",
      color: theme.colors.analytics.service,
    },
  ];

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

          {/* Total Area */}
          <VictoryArea
            data={totalData}
            style={{
              data: {
                fill: theme.colors.analytics.cost,
                fillOpacity: 0.3,
                stroke: theme.colors.analytics.cost,
                strokeWidth: 2,
              },
            }}
            interpolation="monotoneX"
          />

          {/* Fuel Area */}
          <VictoryArea
            data={fuelData}
            style={{
              data: {
                fill: theme.colors.analytics.fuel,
                fillOpacity: 0.2,
                stroke: theme.colors.analytics.fuel,
                strokeWidth: 1.5,
                strokeDasharray: "5,5",
              },
            }}
            interpolation="monotoneX"
          />

          {/* Service Area */}
          <VictoryArea
            data={serviceData}
            style={{
              data: {
                fill: theme.colors.analytics.service,
                fillOpacity: 0.2,
                stroke: theme.colors.analytics.service,
                strokeWidth: 1.5,
                strokeDasharray: "5,5",
              },
            }}
            interpolation="monotoneX"
          />
        </VictoryChart>
      </View>

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
