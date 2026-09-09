import { spacing } from "@/src/design-system";
import React from "react";
import { View, Text } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

interface StatCardProps {
  value: string | number;
  label: string;
}

export function StatCard({ value, label }: StatCardProps) {
  const { styles } = useStyles(stylesheet);
  const { isMobile, isTablet } = useResponsiveLayout();

  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      <Text
        style={[
          styles.value,
          isMobile && styles.valueMobile,
          isTablet && styles.valueTablet,
        ]}
      >
        {value}
      </Text>
      <Text style={[styles.label, isMobile && styles.labelMobile]}>
        {label}
      </Text>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minWidth: 100,
  },
  containerMobile: {
    padding: theme.spacing.md,
    minWidth: 80,
  },
  value: {
    fontSize: theme.fontSize["3xl"],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  valueMobile: {
    fontSize: theme.fontSize.xl,
  },
  valueTablet: {
    fontSize: theme.fontSize["2xl"],
  },
  label: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  labelMobile: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
}));
