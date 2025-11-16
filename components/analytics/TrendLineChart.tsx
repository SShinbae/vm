import React from "react";
import { Dimensions, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { TrendDataPoint } from "../../types/analytics";

interface TrendLineChartProps {
  data: TrendDataPoint[];
  title: string;
  yAxisLabel?: string;
  height?: number;
  color?: string;
}

export function TrendLineChart({
  data,
  title,
  yAxisLabel = "",
  height = 220,
  color,
}: TrendLineChartProps) {
  const { styles, theme } = useStyles(stylesheet);
  const screenWidth = Dimensions.get("window").width;

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      </View>
    );
  }

  const chartData = {
    labels: data.map((d) => {
      if (d.label) return d.label;
      if (!d.date) return "";

      try {
        // Extract MM-DD from ISO date string
        if (typeof d.date === "string" && d.date.length >= 10) {
          return d.date.slice(5, 10); // MM-DD
        }
        return "";
      } catch {
        console.warn("Invalid date format in trend data:", d.date);
        return "";
      }
    }),
    datasets: [
      {
        data: data.map((d) => d.value),
        color: (opacity = 1) => color || `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 1,
    color: (opacity = 1) => {
      const isDark = theme.colors.background === "#1e292e";
      return isDark
        ? `rgba(255, 255, 255, ${opacity})`
        : `rgba(0, 0, 0, ${opacity})`;
    },
    labelColor: (opacity = 1) => {
      const isDark = theme.colors.background === "#1e292e";
      return isDark
        ? `rgba(255, 255, 255, ${opacity * 0.7})`
        : `rgba(0, 0, 0, ${opacity * 0.7})`;
    },
    style: {
      borderRadius: theme.borderRadius.lg,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: color || theme.colors.primary,
    },
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <LineChart
        data={chartData}
        width={screenWidth - 32}
        height={height}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        yAxisLabel={yAxisLabel}
        yAxisSuffix=""
        withInnerLines={false}
        withOuterLines={true}
        withVerticalLines={false}
        withHorizontalLines={true}
        withVerticalLabels={true}
        withHorizontalLabels={true}
        fromZero
      />
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
  chart: {
    borderRadius: theme.borderRadius.lg,
  },
  emptyContainer: {
    height: 220,
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
