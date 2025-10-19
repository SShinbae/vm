import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { BarChart as RNBarChart } from "react-native-chart-kit";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { ChartDataPoint } from "@/lib/services/analyticsService";

interface BarChartProps {
  data: ChartDataPoint[];
  title: string;
  height?: number;
  color?: string;
  formatY?: (value: number) => string;
  horizontal?: boolean;
}

export function BarChart({
  data,
  title,
  height = 200,
  color,
  formatY = (value: number) =>
    `RM${typeof value === "number" && !isNaN(value) ? value.toFixed(0) : "0"}`,
  horizontal = false,
}: BarChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const screenWidth = Dimensions.get("window").width;

  const chartColor = color || colors.chart.service;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 16,
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
    labels: data.map((point) => {
      const label = point.label || String(point.x);
      // Truncate long vehicle names for better display
      return label.length > 8 ? label.substring(0, 6) + "..." : label;
    }),
    datasets: [
      {
        data: data.map((point) => {
          const value = point.y;
          // Ensure all values are valid numbers
          return typeof value === "number" && !isNaN(value) ? value : 0;
        }),
      },
    ],
  };

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) =>
      chartColor +
      Math.floor(opacity * 255)
        .toString(16)
        .padStart(2, "0"),
    labelColor: (opacity = 1) =>
      colors.textSecondary +
      Math.floor(opacity * 255)
        .toString(16)
        .padStart(2, "0"),
    style: {
      borderRadius: 16,
    },
    formatYLabel: (yLabel: string) => formatY(parseFloat(yLabel)),
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        <RNBarChart
          data={chartData}
          width={screenWidth - 64}
          height={height}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={chartConfig}
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
          showBarTops={false}
          showValuesOnTopOfBars={true}
          fromZero={true}
        />
      </View>
    </View>
  );
}
