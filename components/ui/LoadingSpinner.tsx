import { baseColors, withOpacity, spacing } from "@/src/design-system";
import { useStyles } from "react-native-unistyles";
import React from "react";
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";

interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
  text?: string;
  variant?: "default" | "overlay" | "inline";
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function LoadingSpinner({
  size = "large",
  color,
  text,
  variant = "default",
  style,
  textStyle,
}: LoadingSpinnerProps) {
  const { theme } = useStyles();
  const colors = theme.colors;

  const spinnerColor = color || colors.primary;

  const getContainerStyle = () => {
    const baseStyle: any[] = [styles.container];

    switch (variant) {
      case "overlay":
        baseStyle.push(styles.overlayContainer);
        break;
      case "inline":
        baseStyle.push(styles.inlineContainer);
        break;
      default:
        baseStyle.push(styles.defaultContainer);
    }

    if (style) {
      baseStyle.push(style);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle: any[] = [styles.text, { color: colors.text }];

    if (textStyle) {
      baseStyle.push(textStyle);
    }

    return baseStyle;
  };

  return (
    <View style={getContainerStyle()}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {text && <Text style={getTextStyle()}>{text}</Text>}
    </View>
  );
}

export function LoadingOverlay({
  visible,
  text = "Loading...",
  size = "large",
  color,
}: {
  visible: boolean;
  text?: string;
  size?: "small" | "large";
  color?: string;
}) {
  if (!visible) return null;

  return (
    <View style={styles.fullOverlay}>
      <View style={styles.overlayContent}>
        <LoadingSpinner
          size={size}
          color={color}
          text={text}
          variant="overlay"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  defaultContainer: {
    flex: 1,
    paddingVertical: spacing.xxxl,
  },
  overlayContainer: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  inlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  text: {
    marginTop: spacing.md,
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  fullOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: withOpacity(baseColors.black, 0.3),
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  overlayContent: {
    backgroundColor: withOpacity(baseColors.white, 0.95),
    borderRadius: 12,
    padding: spacing.xl,
    minWidth: 120,
    alignItems: "center",
  },
});
