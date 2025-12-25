import React from "react";
import { Text, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: string;
  trend?: number;
};

export function StatCard({ title, value, icon, trend }: StatCardProps) {
  const { styles, theme } = useStyles(stylesheet);

  const trendColor =
    trend && trend > 0 ? theme.colors.success : theme.colors.error;
  const trendBg =
    trend && trend > 0
      ? theme.colors.success + "20"
      : theme.colors.error + "20";

  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Text style={styles.statIcon}>{icon}</Text>
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
  statIcon: {
    fontSize: {
      xs: 20,
      sm: 24,
    },
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
}));
