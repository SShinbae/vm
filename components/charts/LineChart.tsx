import { spacing, withOpacity } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LineChart as RNLineChart } from "react-native-chart-kit";
import { ChartDataPoint } from "@/lib/services/analyticsService";

interface LineChartProps {
  data: ChartDataPoint[];
  title: string;
  height?: number;
  color?: string;
  showArea?: boolean;
  formatY?: (value: number) => string;
}

export function LineChart({
  data,
  title,
  height = 200,
  color,
  showArea = false,
  formatY = (value: number) => `RM${value.toFixed(0)}`,
}: LineChartProps) {
  const { theme } = useStyles();
  const colors = theme.colors;
  const screenWidth = Dimensions.get("window").width;

  const chartColor = color || colors.analytics.fuel;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: spacing.lg,
    },
    chartContainer: {
      alignItems: "center",
    },
    emptyState: {
      height,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
  });

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      </View>
    );
  }

  // Prepare data for react-native-chart-kit
  const chartData = {
    labels: data.map((point) => point.label?.split(" ")[0] || ""),
    datasets: [
      {
        data: data.map((point) => point.y),
        color: (opacity = 1) => withOpacity(chartColor, opacity),
        strokeWidth: 3,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => withOpacity(colors.text, opacity),
    labelColor: (opacity = 1) => withOpacity(colors.textSecondary, opacity),
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: chartColor,
    },
    formatYLabel: (yLabel: string) => formatY(parseFloat(yLabel)),
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        <RNLineChart
          data={chartData}
          width={screenWidth - 64}
          height={height}
          chartConfig={chartConfig}
          bezier={!showArea}
          style={{
            marginVertical: spacing.sm,
            borderRadius: 16,
          }}
        />
      </View>
    </View>
  );
}
