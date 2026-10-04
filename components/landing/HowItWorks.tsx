import { spacing } from "@/src/design-system";
import React from "react";
import { Text, View } from "react-native";
import { useStyles } from "react-native-unistyles";
import { STEPS } from "./content";
import { useBreakpoint } from "./layout";
import { SectionHeading } from "./SectionHeading";

export function HowItWorks() {
  const { theme } = useStyles();
  const { isMobile } = useBreakpoint();

  return (
    <View>
      <SectionHeading
        eyebrow="How it works"
        title="Up and running in minutes"
      />
      <View
        style={{
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? spacing.xl : spacing.xxl,
        }}
      >
        {STEPS.map((step, index) => (
          <View key={step.title} style={{ flex: isMobile ? undefined : 1 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.colors.primary,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: spacing.md,
              }}
            >
              <Text
                style={{
                  color: theme.colors.white,
                  fontSize: 17,
                  fontWeight: "700",
                }}
              >
                {index + 1}
              </Text>
            </View>
            <Text
              accessibilityRole="header"
              aria-level={3}
              style={{
                fontSize: 19,
                fontWeight: "700",
                color: theme.colors.text,
                marginBottom: spacing.xs,
              }}
            >
              {step.title}
            </Text>
            <Text
              style={{
                fontSize: 16,
                lineHeight: 24,
                color: theme.colors.textSecondary,
              }}
            >
              {step.description}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
