import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import {
  ActivityIndicator,
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

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
          backgroundColor: colors.icon + "20",
          borderColor: colors.icon + "30",
          borderWidth: 1,
        });
        break;
      case "outline":
        baseStyle.push({
          backgroundColor: "transparent",
          borderColor: colors.tint,
          borderWidth: 1,
        });
        break;
      case "danger":
        baseStyle.push({
          backgroundColor: "#ff4444",
        });
        break;
      default:
        baseStyle.push({
          backgroundColor: colors.tint,
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
        baseStyle.push({ color: colors.tint });
        break;
      case "danger":
        baseStyle.push({ color: "white" });
        break;
      default:
        // Primary button: use white text for better contrast with tint background
        baseStyle.push({ color: "white" });
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
        return colors.tint;
      case "danger":
        return "white";
      default:
        // Primary button: use white icons for better contrast with tint background
        return "white";
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          color={
            variant === "outline" || variant === "secondary"
              ? colors.tint
              : "white"
          }
          size="small"
        />
      );
    }

    const iconElement = icon ? (
      <IconSymbol name={icon as any} size={getIconSize()} color={getIconColor()} />
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
    gap: 8,
  },
  buttonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonMedium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonLarge: {
    paddingHorizontal: 24,
    paddingVertical: 16,
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
