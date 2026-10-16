import { spacing, withOpacity } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LineChart as RNLineChart } from "react-native-chart-kit";
import { ChartDataPoint } from "@/lib/services/analyticsService";

interface LineChartProps {
  data: ChartDataPoint[];
  title: string;
  height?: number;
  color?: string;
  showArea?: boolean;
  embedded?: boolean;
  width?: number;
  formatY?: (value: number) => string;
}

export function LineChart({
  data,
  title,
  height = 200,
  color,
  showArea = false,
  embedded = false,
  width,
  formatY = (value: number) => `RM${value.toFixed(0)}`,
}: LineChartProps) {
  const { theme } = useStyles();
  const colors = theme.colors;
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const chartWidth = width ?? measuredWidth;
  const labelStep = Math.max(
    1,
    Math.ceil(data.length / Math.max(2, Math.floor(chartWidth / 64))),
  );

  const chartColor = color || colors.analytics.fuel;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: embedded ? "transparent" : colors.surface,
      borderRadius: embedded ? 0 : 12,
      padding: embedded ? 0 : spacing.lg,
      marginBottom: embedded ? 0 : spacing.lg,
      borderWidth: embedded ? 0 : 1,
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
        {!embedded && <Text style={styles.title}>{title}</Text>}
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      </View>
    );
  }

  // Prepare data for react-native-chart-kit
  const chartData = {
    labels: data.map((point, index) =>
      index % labelStep === 0 || index === data.length - 1
        ? point.label || ""
        : "",
    ),
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
      {!embedded && <Text style={styles.title}>{title}</Text>}
      <View
        style={styles.chartContainer}
        accessibilityRole="image"
        accessibilityLabel={title}
        onLayout={(event) => setMeasuredWidth(event.nativeEvent.layout.width)}
      >
        {chartWidth > 0 && (
          <RNLineChart
            data={chartData}
            width={chartWidth}
            height={height}
            chartConfig={chartConfig}
            bezier={!showArea}
            withShadow={showArea}
            style={{
              marginVertical: spacing.sm,
              borderRadius: 16,
            }}
          />
        )}
      </View>
    </View>
  );
}
