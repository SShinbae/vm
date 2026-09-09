import { spacing, withOpacity } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { PieChart as RNPieChart } from "react-native-chart-kit";
import { ChartDataPoint } from "@/lib/services/analyticsService";

interface PieChartProps {
  data: ChartDataPoint[];
  title: string;
  height?: number;
  colors?: string[];
  showLegend?: boolean;
}

export function PieChart({
  data,
  title,
  height = 200,
  colors: customColors,
  showLegend = true,
}: PieChartProps) {
  const { theme } = useStyles();
  const colors = theme.colors;
  const screenWidth = Dimensions.get("window").width;

  const defaultColors = [
    colors.analytics.fuel,
    colors.analytics.service,
    colors.info,
    colors.primary,
  ];

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
      textAlign: "center",
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
    legendContainer: {
      marginTop: spacing.lg,
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: spacing.lg,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    legendColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    legendText: {
      fontSize: 12,
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
  const chartData = data.map((point, index) => {
    const pieColors = customColors || defaultColors;
    return {
      name: point.label || point.x,
      population: point.y,
      color: pieColors[index % pieColors.length],
      legendFontColor: colors.textSecondary,
      legendFontSize: 12,
    };
  });

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    color: (opacity = 1) => withOpacity(colors.text, opacity),
    labelColor: (opacity = 1) => withOpacity(colors.textSecondary, opacity),
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        <RNPieChart
          data={chartData}
          width={screenWidth - 64}
          height={height}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[10, 10]}
          hasLegend={showLegend}
        />
      </View>
    </View>
  );
}
