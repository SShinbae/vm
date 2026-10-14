import { spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  LineChart as RechartsLineChart,
  Line,
  Area,
  AreaChart as RechartsAreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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
  formatY = (value: number) => `RM${value.toFixed(0)}`,
}: LineChartProps) {
  const { theme } = useStyles();
  const colors = theme.colors;

  const chartColor = color || colors.analytics.fuel;
  const Chart = showArea ? RechartsAreaChart : RechartsLineChart;

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
      height: height,
      width: "100%",
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

  // Prepare data for Recharts
  const chartData = data.map((point) => ({
    name: point.label || point.x,
    value: point.y,
  }));

  return (
    <View style={styles.container}>
      {!embedded && <Text style={styles.title}>{title}</Text>}
      <View style={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <Chart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
            <XAxis
              dataKey="name"
              stroke={colors.textSecondary}
              fontSize={12}
              tickFormatter={(value) => {
                if (typeof value === "string" && value.includes(" ")) {
                  return value.split(" ")[0];
                }
                return value;
              }}
            />
            <YAxis
              stroke={colors.textSecondary}
              fontSize={12}
              tickFormatter={formatY}
            />
            <Tooltip
              formatter={(value: any) => [formatY(value), "Value"]}
              labelStyle={{ color: colors.text }}
              contentStyle={{
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: "8px",
              }}
            />
            {showArea ? (
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                fill={chartColor}
                fillOpacity={0.14}
                strokeWidth={3}
              />
            ) : (
              <Line
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={3}
                dot={{ fill: chartColor, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: chartColor, strokeWidth: 2 }}
              />
            )}
          </Chart>
        </ResponsiveContainer>
      </View>
    </View>
  );
}
