import { spacing, withOpacity } from "@/src/design-system";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { useStyles } from "react-native-unistyles";
import { FEATURES } from "./content";
import { useBreakpoint } from "./layout";
import { SectionHeading } from "./SectionHeading";

export function FeatureGrid() {
  const { theme } = useStyles();
  const { isMobile } = useBreakpoint();

  return (
    <View>
      <SectionHeading
        eyebrow="Features"
        title="Everything your car costs, in one place"
      />
      <View
        style={{
          flexDirection: isMobile ? "column" : "row",
          flexWrap: "wrap",
          gap: spacing.lg,
        }}
      >
        {FEATURES.map((feature) => (
          <View
            key={feature.title}
            style={{
              flexBasis: isMobile ? "auto" : "48%",
              flexGrow: 1,
              backgroundColor: theme.colors.background,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.colors.border,
              padding: isMobile ? 24 : 32,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: withOpacity(theme.colors.primary, 0.1),
                justifyContent: "center",
                alignItems: "center",
                marginBottom: spacing.lg,
              }}
            >
              <Ionicons
                name={feature.icon}
                size={24}
                color={theme.colors.primary}
              />
            </View>
            <Text
              accessibilityRole="header"
              aria-level={3}
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: theme.colors.text,
                marginBottom: spacing.sm,
              }}
            >
              {feature.title}
            </Text>
            <Text
              style={{
                fontSize: 16,
                lineHeight: 24,
                color: theme.colors.textSecondary,
              }}
            >
              {feature.description}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
