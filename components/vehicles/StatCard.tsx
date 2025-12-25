import React from "react";
import { View, Text } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
}

/**
 * StatCard Component
 * Displays a single statistic with an icon, value, and title
 * Isolated component for better reusability and testing
 */
export function StatCard({ title, value, icon }: StatCardProps) {
  const { styles, theme, breakpoint } = useStyles(stylesheet);

  // Responsive icon size
  const iconSize = breakpoint === "xs" ? 20 : 24;

  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={styles.statIconContainer}>
          <IconSymbol
            name={icon as any}
            size={iconSize}
            color={theme.colors.primary}
          />
        </View>
      </View>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statTitle} numberOfLines={2}>
        {title}
      </Text>
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  statIconContainer: {
    width: {
      xs: 40,
      sm: 48,
    },
    height: {
      xs: 40,
      sm: 48,
    },
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
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
