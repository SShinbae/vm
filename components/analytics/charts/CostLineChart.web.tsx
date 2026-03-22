/**
 * Cost Line Chart web implementation using recharts
 * Displays cost trends over time with multiple data series
 */

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
  Legend,
} from "recharts";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { CostChartDataPoint } from "../../../types/analytics";

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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const costColor = colors.chart?.primary || "#3b82f6";
  const fuelColor = colors.chart?.fuel || "#f59e0b";
  const serviceColor = colors.chart?.service || "#10b981";

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

  const chartData = data.map((d) => ({
    name: d.label,
    totalCost: d.totalCost,
    fuelCost: d.fuelCost,
    serviceCost: d.serviceCost,
  }));

  const formatY = (value: number) => `RM${value.toFixed(0)}`;

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
              formatter={(value: any, name?: string) => {
                const label =
                  name === "totalCost"
                    ? "Total"
                    : name === "fuelCost"
                      ? "Fuel"
                      : "Service";
                return [`RM${Number(value).toFixed(2)}`, label];
              }}
              labelStyle={{ color: colors.text }}
              contentStyle={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.cardBorder || colors.border}`,
                borderRadius: "8px",
              }}
            />
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey="totalCost"
              name="Total"
              stroke={costColor}
              strokeWidth={3}
              dot={{ fill: costColor, strokeWidth: 2, r: 3, stroke: costColor }}
              activeDot={{ r: 5, stroke: costColor, strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="fuelCost"
              name="Fuel"
              stroke={fuelColor}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="serviceCost"
              name="Service"
              stroke={serviceColor}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </View>
    </View>
  );
}
