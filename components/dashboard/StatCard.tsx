import { withOpacity, spacing } from "@/src/design-system";
import React from "react";
import { Text, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { ComponentProps } from "react";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: ComponentProps<typeof IconSymbol>["name"];
  iconColor?: string;
  trend?: number;
  alertCount?: number;
};

export function StatCard({
  title,
  value,
  icon,
  iconColor,
  trend,
  alertCount,
}: StatCardProps) {
  const { styles, theme } = useStyles(stylesheet);

  const trendColor =
    trend && trend > 0 ? theme.colors.success : theme.colors.error;
  const trendBg =
    trend && trend > 0
      ? withOpacity(theme.colors.success, 0.12)
      : withOpacity(theme.colors.error, 0.12);

  const resolvedIconColor = iconColor ?? theme.colors.primary;

  return (
    <View style={styles.statCard}>
      {alertCount !== undefined && alertCount > 0 && (
        <View style={styles.alertBadge}>
          <Text style={styles.alertBadgeText}>+{alertCount}</Text>
        </View>
      )}
      <View style={styles.statHeader}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: withOpacity(resolvedIconColor, 0.08) },
          ]}
        >
          <IconSymbol name={icon} size={18} color={resolvedIconColor} />
        </View>
        {trend !== undefined && trend !== 0 && (
          <View style={[styles.trendBadge, { backgroundColor: trendBg }]}>
            <Text style={[styles.trendText, { color: trendColor }]}>
              {trend > 0 ? "+" : ""}
              {trend.toFixed(1)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: {
      xs: theme.borderRadius.lg,
      sm: theme.borderRadius.xl,
    },
    padding: {
      xs: theme.spacing.md,
      sm: theme.spacing.lg,
    },
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: "relative",
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: {
      xs: theme.spacing.xs,
      sm: theme.spacing.sm,
    },
  },
  iconContainer: {
    width: {
      xs: 36,
      sm: 40,
    },
    height: {
      xs: 36,
      sm: 40,
    },
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  trendBadge: {
    paddingHorizontal: {
      xs: theme.spacing.xs,
      sm: theme.spacing.sm,
    },
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  trendText: {
    fontSize: {
      xs: 10,
      sm: theme.fontSize.xs,
    },
    fontWeight: theme.fontWeight.semibold,
  },
  statValue: {
    fontSize: {
      xs: theme.fontSize.xl,
      sm: theme.fontSize["2xl"],
    },
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statTitle: {
    fontSize: {
      xs: theme.fontSize.xs,
      sm: theme.fontSize.sm,
    },
    color: theme.colors.textSecondary,
  },
  alertBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: theme.colors.error,
    borderRadius: 999,
    minWidth: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    zIndex: 1,
  },
  alertBadgeText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: theme.fontWeight.bold,
    textAlign: "center",
  },
}));
