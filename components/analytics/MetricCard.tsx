import { withOpacity, spacing } from "@/src/design-system";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  trend?: {
    direction: "up" | "down" | "neutral";
    percentage: number;
  };
  color?: string;
}

// Map icon names onto the theme's analytics palette.
// These tokens already have light/dark variants, so the chip follows the scheme.
// The icon duplicates the visible title, so it is decorative rather than
// information-carrying.
const getIconColors = (icon: string | undefined, theme: any) => {
  const chip = (hex: string) => ({ bg: withOpacity(hex, 0.12), color: hex });

  switch (icon) {
    case "cash-outline":
      return chip(theme.colors.analytics.cost);
    case "speedometer-outline":
      return chip(theme.colors.analytics.neutral);
    case "water-outline":
      return chip(theme.colors.analytics.fuel);
    case "build-outline":
      return chip(theme.colors.analytics.service);
    default:
      return {
        bg: theme.colors.gray[100],
        color: theme.colors.gray[600],
      };
  }
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color,
}: MetricCardProps) {
  const { styles, theme } = useStyles(stylesheet);
  const { isMobile, isTablet } = useResponsiveLayout();
  const iconColors = getIconColors(icon, theme);

  const iconSize = isMobile ? 20 : 24;

  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      <View style={styles.content}>
        {icon && (
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: iconColors.bg },
              isMobile && styles.iconContainerMobile,
            ]}
          >
            <Ionicons
              name={icon}
              size={iconSize}
              color={color || iconColors.color}
            />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={[styles.title, isMobile && styles.titleMobile]}>
            {title}
          </Text>
          <Text
            style={[
              styles.value,
              color && { color },
              isMobile && styles.valueMobile,
              isTablet && styles.valueTablet,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {value}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, isMobile && styles.subtitleMobile]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 120,
    flex: 1,
  },
  containerMobile: {
    padding: theme.spacing.md,
    minHeight: 100,
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
    flex: 1,
  },
  iconContainer: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainerMobile: {
    padding: theme.spacing.sm,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  titleMobile: {
    fontSize: theme.fontSize.xs,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: theme.fontSize["2xl"],
    color: theme.colors.text,
    fontWeight: theme.fontWeight.bold,
    marginBottom: spacing.xs,
    flexWrap: "nowrap",
    flexShrink: 1,
  },
  valueMobile: {
    fontSize: theme.fontSize.base,
  },
  valueTablet: {
    fontSize: theme.fontSize.xl,
  },
  subtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  subtitleMobile: {
    fontSize: 10,
  },
}));
