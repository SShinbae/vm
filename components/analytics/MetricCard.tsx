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

// Map icon names to their background colors
const getIconColors = (icon: string | undefined, theme: any) => {
  switch (icon) {
    case "cash-outline":
      return { bg: theme.colors.green?.[100] || "#d1fae5", color: theme.colors.green?.[600] || "#059669" };
    case "speedometer-outline":
      return { bg: theme.colors.indigo?.[100] || "#e0e7ff", color: theme.colors.indigo?.[600] || "#4f46e5" };
    case "water-outline":
      return { bg: theme.colors.blue?.[100] || "#dbeafe", color: theme.colors.blue?.[600] || "#2563eb" };
    case "build-outline":
      return { bg: theme.colors.amber?.[100] || "#fef3c7", color: theme.colors.amber?.[600] || "#d97706" };
    default:
      return { bg: theme.colors.gray?.[100] || "#f3f4f6", color: theme.colors.gray?.[600] || "#4b5563" };
  }
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color,
}: MetricCardProps) {
  const { styles, theme } = useStyles(stylesheet);
  const iconColors = getIconColors(icon, theme);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: iconColors.bg }]}>
            <Ionicons
              name={icon}
              size={24}
              color={color || iconColors.color}
            />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.value, color && { color }]}>{value}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
  },
  iconContainer: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    marginBottom: 4,
  },
  value: {
    fontSize: theme.fontSize["2xl"],
    color: theme.colors.text,
    fontWeight: theme.fontWeight.bold,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
}));
