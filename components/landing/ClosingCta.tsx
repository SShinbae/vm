import { spacing } from "@/src/design-system";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useStyles } from "react-native-unistyles";
import { useBreakpoint } from "./layout";

export function ClosingCta() {
  const { theme } = useStyles();
  const router = useRouter();
  const { isMobile } = useBreakpoint();

  return (
    <View
      style={{
        backgroundColor: theme.colors.primary,
        borderRadius: isMobile ? 20 : 24,
        padding: isMobile ? 32 : 64,
        alignItems: "center",
      }}
    >
      <Text
        accessibilityRole="header"
        aria-level={2}
        style={{
          fontSize: isMobile ? 28 : 40,
          lineHeight: isMobile ? 34 : 46,
          fontWeight: "800",
          letterSpacing: -1,
          color: theme.colors.white,
          textAlign: "center",
          marginBottom: spacing.lg,
        }}
      >
        Start tracking your next fill-up
      </Text>
      <Text
        style={{
          fontSize: isMobile ? 17 : 19,
          lineHeight: 28,
          color: theme.colors.white,
          opacity: 0.9,
          textAlign: "center",
          maxWidth: 560,
          marginBottom: spacing.xxl,
        }}
      >
        Free, no credit card. Add your first vehicle in under a minute.
      </Text>
      <TouchableOpacity
        onPress={() => router.push("/(auth)/register")}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Create free account"
        style={{
          backgroundColor: theme.colors.white,
          paddingVertical: 16,
          paddingHorizontal: 32,
          borderRadius: 12,
        }}
      >
        <Text
          style={{
            color: theme.colors.primary,
            fontSize: 17,
            fontWeight: "700",
          }}
        >
          Create free account
        </Text>
      </TouchableOpacity>
    </View>
  );
}
