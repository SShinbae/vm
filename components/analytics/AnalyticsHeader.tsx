import React from "react";
import { View, Text } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

export function AnalyticsHeader() {
  const { styles } = useStyles(stylesheet);

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Analytics Overview</Text>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
}));
