import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const defaultColors = [
    colors.chart.fuel,
    colors.chart.service,
    colors.chart.mileage,
    colors.chart.primary,
  ];
  const pieColors = customColors || defaultColors;

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
      textAlign: "center",
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
    name: point.x,
    value: point.y,
    label: point.label || point.x,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={pieColors[index % pieColors.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, name: any) => [
                `RM${value.toFixed(0)}`,
                name,
              ]}
              contentStyle={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.cardBorder}`,
                borderRadius: "8px",
              }}
            />
            {showLegend && (
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry: any) => (
                  <span
                    style={{ color: colors.textSecondary, fontSize: "12px" }}
                  >
                    {value} (RM{entry.payload.value.toFixed(0)})
                  </span>
                )}
              />
            )}
          </RechartsPieChart>
        </ResponsiveContainer>
      </View>
    </View>
  );
}
