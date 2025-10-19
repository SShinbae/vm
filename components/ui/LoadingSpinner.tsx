import React from "react";
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const spinnerColor = color || colors.tint;

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
    paddingVertical: 40,
  },
  overlayContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  inlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 8,
  },
  text: {
    marginTop: 12,
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
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  overlayContent: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    padding: 24,
    minWidth: 120,
    alignItems: "center",
  },
});
