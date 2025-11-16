import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { theme } from "../../../theme";
import { tokens } from "../../../tokens";
import { Text } from "../Text";

export interface BadgeProps extends Omit<ViewProps, "style"> {
  variant?: "success" | "warning" | "error" | "info" | "default";
  size?: "sm" | "md" | "lg";
  type?: "filled" | "outlined" | "dot";
  count?: number;
  maxCount?: number;
  children?: React.ReactNode;
  style?: ViewProps["style"];
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  size = "md",
  type = "filled",
  count,
  maxCount = 99,
  children,
  style,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const colors = theme.getThemeColors(colorScheme);

  // Size mapping
  const sizeMap = {
    sm: {
      height: 16,
      paddingHorizontal: tokens.spacing.xxs,
      fontSize: tokens.fontSize.xxxs,
      dotSize: 6,
    },
    md: {
      height: 20,
      paddingHorizontal: tokens.spacing.xs,
      fontSize: tokens.fontSize.xxs,
      dotSize: 8,
    },
    lg: {
      height: 24,
      paddingHorizontal: tokens.spacing.sm,
      fontSize: tokens.fontSize.xs,
      dotSize: 10,
    },
  };

  const sizeStyle = sizeMap[size];

  // Variant colors
  const variantColors = {
    success: {
      bg: colors.success,
      text: "#FFFFFF",
      border: colors.success,
    },
    warning: {
      bg: colors.warning,
      text: "#000000",
      border: colors.warning,
    },
    error: {
      bg: colors.error,
      text: "#FFFFFF",
      border: colors.error,
    },
    info: {
      bg: colors.info,
      text: "#FFFFFF",
      border: colors.info,
    },
    default: {
      bg: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };

  const colorStyle = variantColors[variant];

  // Dot badge
  if (type === "dot") {
    return (
      <View
        style={[
          styles.dot,
          {
            width: sizeStyle.dotSize,
            height: sizeStyle.dotSize,
            backgroundColor: colorStyle.bg,
            borderRadius: sizeStyle.dotSize / 2,
          },
          style,
        ]}
        accessibilityRole="image"
        accessibilityLabel={`${variant} status indicator`}
        {...props}
      />
    );
  }

  // Display count or children
  const displayContent =
    count !== undefined
      ? count > maxCount
        ? `${maxCount}+`
        : count.toString()
      : children;

  // Outlined variant
  const isOutlined = type === "outlined";

  return (
    <View
      style={[
        styles.badge,
        {
          height: sizeStyle.height,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          backgroundColor: isOutlined ? "transparent" : colorStyle.bg,
          borderWidth: isOutlined ? 1 : 0,
          borderColor: colorStyle.border,
          borderRadius: sizeStyle.height / 2,
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={
        count !== undefined ? `${count} notifications` : undefined
      }
      {...props}
    >
      <Text
        variant="label"
        weight="semibold"
        style={{
          fontSize: sizeStyle.fontSize,
          color: isOutlined ? colorStyle.bg : colorStyle.text,
          lineHeight: sizeStyle.height,
        }}
      >
        {displayContent}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  dot: {
    alignSelf: "flex-start",
  },
});
