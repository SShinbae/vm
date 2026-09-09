/**
 * Cost Line Chart using react-native-chart-kit
 * Displays cost trends over time with multiple data series
 */

import React from "react";
import { Dimensions, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { CostChartDataPoint } from "../../../types/analytics";
import { ChartLegend, LegendItem } from "./ChartLegend";
import { withOpacity } from "@/src/design-system";

interface CostLineChartProps {
  data: CostChartDataPoint[];
  title: string;
  height?: number;
  showLegend?: boolean;
}

export function CostLineChart({
  data,
  title,
  height = 250,
  showLegend = true,
}: CostLineChartProps) {
  const { styles, theme } = useStyles(stylesheet);
  const { isMobile, isTablet } = useResponsiveLayout();
  const screenWidth = Dimensions.get("window").width;

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text
          style={[
            styles.title,
            isMobile && styles.titleMobile,
            isTablet && styles.titleTablet,
          ]}
        >
          {title}
        </Text>
        <View style={[styles.emptyContainer, { height }]}>
          <Text style={[styles.emptyText, isMobile && styles.emptyTextMobile]}>
            No data available
          </Text>
        </View>
      </View>
    );
  }

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        data: data.map((d) => d.totalCost),
        color: () => theme.colors.analytics.cost,
        strokeWidth: 3,
      },
      {
        data: data.map((d) => d.fuelCost),
        color: () => theme.colors.analytics.fuel,
        strokeWidth: 2,
        withDots: false,
      },
      {
        data: data.map((d) => d.serviceCost),
        color: () => theme.colors.analytics.service,
        strokeWidth: 2,
        withDots: false,
      },
    ],
    legend: showLegend ? ["Total", "Fuel", "Service"] : undefined,
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
    propsForDots: {
      r: "3",
      strokeWidth: "1",
    },
  };

  const legendItems: LegendItem[] = [
    { name: "Total", color: theme.colors.analytics.cost },
    { name: "Fuel", color: theme.colors.analytics.fuel },
    { name: "Service", color: theme.colors.analytics.service },
  ];

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.title,
          isMobile && styles.titleMobile,
          isTablet && styles.titleTablet,
        ]}
      >
        {title}
      </Text>
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
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  titleMobile: {
    fontSize: theme.fontSize.base,
    marginBottom: theme.spacing.sm,
  },
  titleTablet: {
    fontSize: theme.fontSize.lg,
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
  emptyTextMobile: {
    fontSize: theme.fontSize.sm,
  },
}));
