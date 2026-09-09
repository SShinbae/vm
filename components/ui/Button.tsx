import { spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { IconSymbol } from "./icon-symbol";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  iconPosition?: "left" | "right";
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  icon,
  iconPosition = "left",
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const { theme } = useStyles();
  const colors = theme.colors;

  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.button];

    // Size styles
    switch (size) {
      case "small":
        baseStyle.push(styles.buttonSmall);
        break;
      case "large":
        baseStyle.push(styles.buttonLarge);
        break;
      default:
        baseStyle.push(styles.buttonMedium);
    }

    // Variant styles
    switch (variant) {
      case "secondary":
        baseStyle.push({
          backgroundColor: colors.secondary,
          borderColor: colors.border,
          borderWidth: 1,
        });
        break;
      case "outline":
        baseStyle.push({
          backgroundColor: "transparent",
          borderColor: colors.primary,
          borderWidth: 1,
        });
        break;
      case "danger":
        baseStyle.push({
          backgroundColor: colors.error,
        });
        break;
      default:
        baseStyle.push({
          backgroundColor: colors.primary,
        });
    }

    // Full width
    if (fullWidth) {
      baseStyle.push(styles.fullWidth);
    }

    // Disabled state
    if (disabled || loading) {
      baseStyle.push(styles.disabled);
    }

    // Custom style
    if (style) {
      baseStyle.push(style);
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle[] => {
    const baseStyle: TextStyle[] = [styles.text];

    // Size text styles
    switch (size) {
      case "small":
        baseStyle.push(styles.textSmall);
        break;
      case "large":
        baseStyle.push(styles.textLarge);
        break;
      default:
        baseStyle.push(styles.textMedium);
    }

    // Variant text styles - improved contrast for dark mode
    switch (variant) {
      case "secondary":
        baseStyle.push({ color: colors.text });
        break;
      case "outline":
        baseStyle.push({ color: colors.primary });
        break;
      case "danger":
        baseStyle.push({ color: theme.colors.white });
        break;
      default:
        // Primary button: use white text for better contrast with primary background
        baseStyle.push({ color: theme.colors.white });
    }

    // Custom text style
    if (textStyle) {
      baseStyle.push(textStyle);
    }

    return baseStyle;
  };

  const getIconSize = () => {
    switch (size) {
      case "small":
        return 14;
      case "large":
        return 18;
      default:
        return 16;
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case "secondary":
        return colors.text;
      case "outline":
        return colors.primary;
      case "danger":
        return theme.colors.white;
      default:
        // Primary button: use white icons for better contrast with primary background
        return theme.colors.white;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          color={
            variant === "outline" || variant === "secondary"
              ? colors.primary
              : theme.colors.white
          }
          size="small"
        />
      );
    }

    const iconElement = icon ? (
      <IconSymbol
        name={icon as any}
        size={getIconSize()}
        color={getIconColor()}
      />
    ) : null;

    const textElement = <Text style={getTextStyle()}>{title}</Text>;

    if (!icon) {
      return textElement;
    }

    return iconPosition === "left" ? (
      <>
        {iconElement}
        {textElement}
      </>
    ) : (
      <>
        {textElement}
        {iconElement}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    gap: spacing.sm,
    minHeight: Platform.select({ ios: 44, default: 48 }),
  },
  buttonSmall: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  buttonMedium: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  buttonLarge: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
  textSmall: {
    fontSize: 14,
  },
  textMedium: {
    fontSize: 16,
  },
  textLarge: {
    fontSize: 18,
  },
});
