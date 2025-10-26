import React from "react";
import { View, Text } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Ionicons } from "@expo/vector-icons";

interface EmptyAnalyticsProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title?: string;
  message?: string;
}

export function EmptyAnalytics({
  icon = "analytics-outline",
  title = "No Data Available",
  message = "Start tracking your fuel and service logs to see analytics here.",
}: EmptyAnalyticsProps) {
  const { styles, theme } = useStyles(stylesheet);

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={theme.colors.textSecondary} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxxl,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    textAlign: "center",
  },
  message: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: "center",
    lineHeight: 22,
  },
}));
