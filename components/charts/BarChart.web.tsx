import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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
  formatY = (value: number) => `RM${value.toFixed(0)}`,
  horizontal = false,
}: BarChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

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
        <Text style={styles.title}>{title}</Text>
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
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.chart.grid} />
            <XAxis
              dataKey="name"
              stroke={colors.textSecondary}
              fontSize={12}
              interval={0}
              angle={data.length > 3 ? -45 : 0}
              textAnchor={data.length > 3 ? "end" : "middle"}
              height={data.length > 3 ? 80 : 40}
              tickFormatter={(value) => {
                if (typeof value === "string" && value.length > 15) {
                  return value.substring(0, 12) + "...";
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
                backgroundColor: colors.card,
                border: `1px solid ${colors.cardBorder}`,
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="value" fill={chartColor} radius={[4, 4, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </View>
    </View>
  );
}
