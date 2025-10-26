import React from "react";
import { View, Text } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Ionicons } from "@expo/vector-icons";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  trend?: {
    direction: "up" | "down" | "neutral";
    percentage: number;
  };
  color?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color,
}: MetricCardProps) {
  const { styles, theme } = useStyles(stylesheet);

  const getTrendColor = () => {
    if (!trend) return theme.colors.textSecondary;
    switch (trend.direction) {
      case "up":
        return theme.colors.success;
      case "down":
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getTrendIcon = (): keyof typeof Ionicons.glyphMap => {
    if (!trend) return "remove-outline";
    switch (trend.direction) {
      case "up":
        return "trending-up-outline";
      case "down":
        return "trending-down-outline";
      default:
        return "remove-outline";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={color || theme.colors.primary}
          />
        )}
      </View>

      <View style={styles.content}>
        <Text style={[styles.value, color && { color }]}>{value}</Text>
        {trend && (
          <View style={styles.trendContainer}>
            <Ionicons name={getTrendIcon()} size={16} color={getTrendColor()} />
            <Text style={[styles.trendText, { color: getTrendColor() }]}>
              {trend.percentage}%
            </Text>
          </View>
        )}
      </View>

      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    minHeight: 120,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  content: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: theme.spacing.sm,
  },
  value: {
    fontSize: theme.fontSize["2xl"],
    color: theme.colors.text,
    fontWeight: theme.fontWeight.bold,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  trendText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  subtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
}));
