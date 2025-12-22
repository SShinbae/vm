import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const chartColor = color || colors.chart?.fuel || colors.primary;

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 12,
    },
    chartContainer: {
      height: height,
      width: "100%",
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
    },
    emptyContainer: {
      height: height,
      backgroundColor: colors.card,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
  });

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

  // Prepare data for Recharts
  const chartData = data.map((d) => {
    let label = d.label || "";
    if (!label && d.date) {
      try {
        // Extract MM-DD from ISO date string
        if (typeof d.date === "string" && d.date.length >= 10) {
          label = d.date.slice(5, 10); // MM-DD
        }
      } catch {
        label = "";
      }
    }
    return {
      name: label,
      value: d.value,
    };
  });

  const formatY = (value: number) => {
    if (yAxisLabel) {
      return `${yAxisLabel}${value.toFixed(1)}`;
    }
    return value.toFixed(1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={colors.chart?.grid || colors.border}
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke={colors.textSecondary}
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: colors.border }}
            />
            <YAxis
              stroke={colors.textSecondary}
              fontSize={12}
              tickFormatter={formatY}
              tickLine={false}
              axisLine={{ stroke: colors.border }}
            />
            <Tooltip
              formatter={(value: any) => [formatY(value), "Value"]}
              labelStyle={{ color: colors.text }}
              contentStyle={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.cardBorder || colors.border}`,
                borderRadius: "8px",
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={2}
              dot={{
                fill: chartColor,
                strokeWidth: 2,
                r: 4,
                stroke: chartColor,
              }}
              activeDot={{ r: 6, stroke: chartColor, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </View>
    </View>
  );
}
