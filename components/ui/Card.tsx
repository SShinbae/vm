import { withOpacity, spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
} from "react-native";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "elevated" | "outlined" | "filled";
  padding?: "none" | "small" | "medium" | "large";
  onPress?: () => void;
  disabled?: boolean;
}

interface TouchableCardProps
  extends
    Omit<CardProps, "onPress">,
    Omit<TouchableOpacityProps, "style" | "children"> {}

export function Card({
  children,
  style,
  variant = "default",
  padding = "medium",
  onPress,
  disabled = false,
}: CardProps | TouchableCardProps) {
  const { theme } = useStyles();
  const colors = theme.colors;

  const getCardStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.card];

    // Variant styles
    switch (variant) {
      case "elevated":
        baseStyle.push({
          backgroundColor: colors.surface,
          elevation: 4,
          shadowColor: theme.colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          borderWidth: 0,
        });
        break;
      case "outlined":
        baseStyle.push({
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        });
        break;
      case "filled":
        baseStyle.push({
          backgroundColor: colors.surface,
          borderWidth: 0,
          borderColor: "transparent",
        });
        break;
      default:
        baseStyle.push({
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        });
    }

    // Padding styles
    switch (padding) {
      case "none":
        break;
      case "small":
        baseStyle.push(styles.paddingSmall);
        break;
      case "large":
        baseStyle.push(styles.paddingLarge);
        break;
      default:
        baseStyle.push(styles.paddingMedium);
    }

    // Disabled state
    if (disabled) {
      baseStyle.push(styles.disabled);
    }

    // Custom style
    if (style) {
      baseStyle.push(style);
    }

    return baseStyle;
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={getCardStyle()}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={getCardStyle()}>{children}</View>;
}

// Header component for cards
export function CardHeader({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.header, style]}>{children}</View>;
}

// Content component for cards
export function CardContent({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.content, style]}>{children}</View>;
}

// Footer component for cards
export function CardFooter({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const { theme } = useStyles();
  const colors = theme.colors;

  return (
    <View
      style={[
        styles.footer,
        { borderTopColor: withOpacity(colors.textSecondary, 0.06) },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: "hidden",
    minHeight: 48,
  },
  paddingSmall: {
    padding: spacing.md,
  },
  paddingMedium: {
    padding: spacing.lg,
  },
  paddingLarge: {
    padding: spacing.xl,
  },
  disabled: {
    opacity: 0.6,
  },
  header: {
    marginBottom: spacing.md,
  },
  content: {
    flex: 1,
  },
  footer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
});
