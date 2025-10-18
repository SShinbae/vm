import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LineChart as RNLineChart } from "react-native-chart-kit";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const screenWidth = Dimensions.get("window").width;

  const chartColor = color || colors.chart.fuel;
  const areaColor = chartColor + "20"; // 20% opacity

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
    labels: data.map((point) => point.label?.split(" ")[0] || ""),
    datasets: [
      {
        data: data.map((point) => point.y),
        color: (opacity = 1) =>
          chartColor +
          Math.floor(opacity * 255)
            .toString(16)
            .padStart(2, "0"),
        strokeWidth: 3,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) =>
      colors.text +
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
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: chartColor,
    },
    formatYLabel: formatY,
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
            marginVertical: 8,
            borderRadius: 16,
          }}
        />
      </View>
    </View>
  );
}
