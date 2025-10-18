import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  disabled?: boolean;
}

export function Tooltip({
  content,
  children,
  position = "top",
  disabled = false,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Only show tooltip on web and when not disabled
  if (Platform.OS !== "web" || disabled) {
    return <>{children}</>;
  }

  const getTooltipStyle = () => {
    const baseStyle = {
      ...styles.tooltip,
      backgroundColor: colors.surface,
      borderColor: colors.border,
    };

    if (Platform.OS === "web") {
      switch (position) {
        case "top":
          return { ...baseStyle, bottom: "100%", marginBottom: 8 } as any;
        case "bottom":
          return { ...baseStyle, top: "100%", marginTop: 8 } as any;
        case "left":
          return { ...baseStyle, right: "100%", marginRight: 8 } as any;
        case "right":
          return { ...baseStyle, left: "100%", marginLeft: 8 } as any;
        default:
          return { ...baseStyle, bottom: "100%", marginBottom: 8 } as any;
      }
    }

    return baseStyle;
  };

  return (
    <View
      style={styles.container}
      {...(Platform.OS === "web" &&
        ({
          onMouseEnter: () => setVisible(true),
          onMouseLeave: () => setVisible(false),
        } as any))}
    >
      {children}
      {visible && (
        <View style={getTooltipStyle()}>
          <Text style={[styles.text, { color: colors.text }]}>{content}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  tooltip: {
    position: "absolute",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    zIndex: 1000,
    minWidth: 120,
    maxWidth: 200,
    ...Platform.select({
      web: {
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
      },
    }),
  },
  text: {
    fontSize: 12,
    textAlign: "center",
  },
});
