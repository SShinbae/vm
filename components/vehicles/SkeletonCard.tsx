import React from "react";
import { View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

/**
 * SkeletonCard Component
 * Loading placeholder for vehicle cards
 */
export function SkeletonCard() {
  const { styles } = useStyles(stylesheet);

  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: "60%" }]} />
        <View style={[styles.skeletonLine, { width: "40%" }]} />
      </View>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  skeletonCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
    marginBottom: theme.spacing.lg,
  },
  skeletonImage: {
    width: "100%",
    height: 180,
    backgroundColor: theme.colors.disabled,
  },
  skeletonContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: theme.colors.disabled,
    borderRadius: theme.borderRadius.sm,
  },
}));
