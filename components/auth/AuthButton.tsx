import { spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline";
  fullWidth?: boolean;
  style?: ViewStyle;
}

/**
 * AuthButton - Primary action button with loading state
 *
 * Features:
 * - Themed background with shadow
 * - Loading spinner integration
 * - Disabled state styling
 * - Three variants: primary, secondary, outline
 */
export function AuthButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  fullWidth = true,
  style,
}: AuthButtonProps) {
  const { theme } = useStyles();
  const colors = theme.colors;

  const isDisabled = disabled || loading;

  const getBackgroundColor = () => {
    if (variant === "outline") return "transparent";
    if (variant === "secondary") return colors.surface;
    return colors.primary;
  };

  const getTextColor = () => {
    if (variant === "outline") return colors.primary;
    if (variant === "secondary") return colors.text;
    return theme.colors.white;
  };

  const getBorderColor = () => {
    if (variant === "outline") return colors.primary;
    return "transparent";
  };

  const styles = StyleSheet.create({
    button: {
      backgroundColor: getBackgroundColor(),
      borderRadius: 8,
      paddingVertical: spacing.lg,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.xl,
      minHeight: 52,
      borderWidth: variant === "outline" ? 2 : 0,
      borderColor: getBorderColor(),
      ...(variant === "primary" && {
        shadowColor: colors.primary,
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
      }),
      ...(fullWidth && { width: "100%" }),
    },
    buttonDisabled: {
      opacity: 0.6,
      shadowOpacity: 0,
      elevation: 0,
    },
    buttonText: {
      color: getTextColor(),
      fontSize: 16,
      fontWeight: "600",
      letterSpacing: 0.5,
    },
  });

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.buttonDisabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? theme.colors.white : colors.primary}
          size="small"
        />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
