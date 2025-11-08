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

  const trendColor = trend && trend > 0 ? theme.colors.success : theme.colors.error;
  const trendBg = trend && trend > 0 ? theme.colors.success + "20" : theme.colors.error + "20";

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
    width: "47%", // Approximate 50% minus gap
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
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
    marginBottom: theme.spacing.sm,
  },
  statIcon: {
    fontSize: 24,
  },
  trendBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  trendText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  statValue: {
    fontSize: theme.fontSize["2xl"],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
}));