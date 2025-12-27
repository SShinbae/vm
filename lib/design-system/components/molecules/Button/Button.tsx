import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { allIcons } from "../../../icons";
import { theme } from "../../../theme";
import { tokens } from "../../../tokens";
import { Icon } from "../../atoms/Icon";
import { Text } from "../../atoms/Text";

export interface ButtonProps extends Omit<
  PressableProps,
  "style" | "children"
> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  leftIcon?: keyof typeof allIcons;
  rightIcon?: keyof typeof allIcons;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  children,
  onPress,
  style,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const colors = theme.getThemeColors(colorScheme);

  // Size configurations
  const sizeConfig = {
    sm: {
      height: 36,
      paddingHorizontal: tokens.spacing.md,
      fontSize: tokens.fontSize.sm,
      iconSize: 16 as const,
    },
    md: {
      height: 44,
      paddingHorizontal: tokens.spacing.lg,
      fontSize: tokens.fontSize.base,
      iconSize: 20 as const,
    },
    lg: {
      height: 52,
      paddingHorizontal: tokens.spacing.xl,
      fontSize: tokens.fontSize.lg,
      iconSize: 24 as const,
    },
  };

  const config = sizeConfig[size];

  // Variant colors
  const variantConfig = {
    primary: {
      background: colors.tint,
      backgroundPressed: colors.tint + "DD",
      backgroundDisabled: colors.tint + "40",
      text: "#FFFFFF",
      textDisabled: "#FFFFFF80",
      border: "transparent",
    },
    secondary: {
      background: colors.card,
      backgroundPressed: colors.card + "DD",
      backgroundDisabled: colors.card + "40",
      text: colors.text,
      textDisabled: colors.textTertiary,
      border: colors.border,
    },
    outline: {
      background: "transparent",
      backgroundPressed: colors.tint + "10",
      backgroundDisabled: "transparent",
      text: colors.tint,
      textDisabled: colors.textTertiary,
      border: colors.tint,
    },
    ghost: {
      background: "transparent",
      backgroundPressed: colors.tint + "10",
      backgroundDisabled: "transparent",
      text: colors.tint,
      textDisabled: colors.textTertiary,
      border: "transparent",
    },
    danger: {
      background: colors.error,
      backgroundPressed: colors.error + "DD",
      backgroundDisabled: colors.error + "40",
      text: "#FFFFFF",
      textDisabled: "#FFFFFF80",
      border: "transparent",
    },
  };

  const colorConfig = variantConfig[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        {
          height: config.height,
          paddingHorizontal: config.paddingHorizontal,
          backgroundColor:
            pressed && !isDisabled
              ? colorConfig.backgroundPressed
              : isDisabled
                ? colorConfig.backgroundDisabled
                : colorConfig.background,
          borderWidth: variant === "outline" || variant === "secondary" ? 1 : 0,
          borderColor: isDisabled
            ? colorConfig.border + "40"
            : colorConfig.border,
          borderRadius: tokens.radius.md,
          width: fullWidth ? "100%" : "auto",
          opacity: isDisabled && !loading ? 0.5 : 1,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={typeof children === "string" ? children : undefined}
      {...props}
    >
      {({ pressed }) => (
        <View style={styles.content}>
          {loading && (
            <ActivityIndicator
              size="small"
              color={isDisabled ? colorConfig.textDisabled : colorConfig.text}
              style={styles.loader}
            />
          )}

          {!loading && leftIcon && (
            <Icon
              name={leftIcon}
              size={config.iconSize}
              color="primary"
              style={[styles.icon, styles.leftIcon]}
            />
          )}

          <Text
            variant="label"
            weight="semibold"
            style={{
              fontSize: config.fontSize,
              color: isDisabled ? colorConfig.textDisabled : colorConfig.text,
            }}
          >
            {children}
          </Text>

          {!loading && rightIcon && (
            <Icon
              name={rightIcon}
              size={config.iconSize}
              color="primary"
              style={[styles.icon, styles.rightIcon]}
            />
          )}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loader: {
    marginRight: tokens.spacing.xs,
  },
  icon: {
    // Icon styles will be overridden by the Icon component
  },
  leftIcon: {
    marginRight: tokens.spacing.xs,
  },
  rightIcon: {
    marginLeft: tokens.spacing.xs,
  },
});
