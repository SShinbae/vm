import React from "react";
import { Text, View } from "react-native";
import { useStyles } from "react-native-unistyles";

export function InsightsStrip({ insights }: { insights: string[] }) {
  const { theme } = useStyles();
  if (insights.length === 0) return null;
  return (
    <View style={{ gap: theme.spacing.sm }} accessibilityRole="summary">
      {insights.map((text, index) => (
        <View
          key={`${index}-${text}`}
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderWidth: 1,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.md,
          }}
        >
          <Text
            style={{ color: theme.colors.text, fontSize: theme.fontSize.sm }}
          >
            {text}
          </Text>
        </View>
      ))}
    </View>
  );
}
