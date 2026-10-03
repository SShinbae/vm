import { spacing } from "@/src/design-system";
import React from "react";
import { Text, View } from "react-native";
import { useStyles } from "react-native-unistyles";
import { useBreakpoint } from "./layout";

export function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  const { theme } = useStyles();
  const { isMobile } = useBreakpoint();

  return (
    <View style={{ alignItems: "center", marginBottom: isMobile ? 32 : 48 }}>
      <Text
        style={{
          color: theme.colors.primary,
          fontSize: 13,
          fontWeight: "700",
          letterSpacing: 1,
          textTransform: "uppercase",
          marginBottom: spacing.md,
        }}
      >
        {eyebrow}
      </Text>
      <Text
        accessibilityRole="header"
        aria-level={2}
        style={{
          fontSize: isMobile ? 30 : 40,
          lineHeight: isMobile ? 36 : 46,
          fontWeight: "800",
          letterSpacing: -1,
          color: theme.colors.text,
          textAlign: "center",
          maxWidth: 640,
        }}
      >
        {title}
      </Text>
    </View>
  );
}
