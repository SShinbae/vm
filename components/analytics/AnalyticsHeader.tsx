import React from "react";
import { View, Text } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { AnalyticsTabBar } from "./AnalyticsTabBar";

export function AnalyticsHeader() {
  const { styles } = useStyles(stylesheet);

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>
          Track your vehicle performance and expenses
        </Text>
      </View>
      <AnalyticsTabBar />
    </>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.fontSize["3xl"],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
}));
