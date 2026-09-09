import { spacing } from "@/src/design-system";
import React from "react";
import { Text, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

interface SidebarBadgeProps {
  count?: number;
  variant?: "full" | "dot";
}

export const SidebarBadge: React.FC<SidebarBadgeProps> = ({
  count,
  variant = "full",
}) => {
  const { styles } = useStyles(stylesheet);

  if (!count || count === 0) return null;

  if (variant === "dot") {
    return <View style={styles.dot} />;
  }

  const displayCount = count > 99 ? "99+" : count.toString();

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{displayCount}</Text>
    </View>
  );
};

const stylesheet = createStyleSheet((theme) => ({
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    backgroundColor: theme.colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
    textAlign: "center",
    lineHeight: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.error,
  },
}));
