import { spacing } from "@/src/design-system";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Linking, Text, TouchableOpacity, View } from "react-native";
import { useStyles } from "react-native-unistyles";
import { CONTACT_EMAIL, GITHUB_URL } from "./content";
import { Section, useBreakpoint } from "./layout";

export function LandingFooter() {
  const { theme } = useStyles();
  const router = useRouter();
  const { isMobile } = useBreakpoint();

  const links = [
    { label: "Privacy", onPress: () => router.push("/privacy") },
    { label: "GitHub", onPress: () => Linking.openURL(GITHUB_URL) },
    {
      label: "Contact",
      onPress: () => Linking.openURL(`mailto:${CONTACT_EMAIL}`),
    },
  ];

  return (
    <Section
      style={{
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingVertical: spacing.xxxl,
      }}
    >
      <View
        style={{
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          gap: spacing.xl,
        }}
      >
        <View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              marginBottom: spacing.xs,
            }}
          >
            <Image
              source={require("@/assets/images/vm_logo.webp")}
              style={{ width: 24, height: 24 }}
              contentFit="contain"
              accessible={false}
            />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: theme.colors.text,
              }}
            >
              Vehicle Management
            </Text>
          </View>
          <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>
            Track. Monitor. Optimize.
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: spacing.xl }}>
          {links.map((link) => (
            <TouchableOpacity
              key={link.label}
              onPress={link.onPress}
              accessibilityRole="link"
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "500",
                  color: theme.colors.textSecondary,
                }}
              >
                {link.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text
        style={{
          fontSize: 13,
          color: theme.colors.textSecondary,
          marginTop: spacing.xl,
        }}
      >
        © {new Date().getFullYear()} Vehicle Management. All rights reserved.
      </Text>
    </Section>
  );
}
