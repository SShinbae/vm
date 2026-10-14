import { spacing } from "@/src/design-system";
import { Image } from "expo-image";
import { Link } from "expo-router";
import React from "react";
import { Linking, Pressable, Text, TouchableOpacity, View } from "react-native";
import { useStyles } from "react-native-unistyles";
import { CONTACT_EMAIL, GITHUB_URL } from "./content";
import { Section, useBreakpoint } from "./layout";

export function LandingFooter() {
  const { theme } = useStyles();
  const { isMobile } = useBreakpoint();

  const pageLinks = [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ] as const;
  const links = [
    { label: "GitHub", onPress: () => Linking.openURL(GITHUB_URL) },
    {
      label: "Contact",
      onPress: () => Linking.openURL(`mailto:${CONTACT_EMAIL}`),
    },
  ];

  const linkTextStyle = {
    fontSize: 15,
    fontWeight: "500" as const,
    color: theme.colors.text,
  };

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
            <Link href="/" asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Vehicle Management home"
                style={{
                  minHeight: 44,
                  minWidth: 44,
                  justifyContent: "center",
                }}
              >
                <Image
                  source={require("@/assets/images/vm_logo.webp")}
                  style={{ width: 32, height: 32 }}
                  contentFit="contain"
                  accessible={false}
                />
              </Pressable>
            </Link>
          </View>
          <Text style={{ fontSize: 14, color: theme.colors.text }}>
            A clearer picture of car ownership.
          </Text>
        </View>

        <View
          style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.lg }}
        >
          {/* Real <a href> on web: Google OAuth verification needs a crawlable privacy link. */}
          {pageLinks.map((link) => (
            <Link key={link.label} href={link.href} asChild>
              <Pressable
                accessibilityRole="link"
                style={{ minHeight: 44, justifyContent: "center" }}
              >
                <Text style={linkTextStyle}>{link.label}</Text>
              </Pressable>
            </Link>
          ))}
          {links.map((link) => (
            <TouchableOpacity
              key={link.label}
              onPress={link.onPress}
              accessibilityRole="link"
              style={{ minHeight: 44, justifyContent: "center" }}
            >
              <Text style={linkTextStyle}>{link.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text
        style={{
          fontSize: 13,
          color: theme.colors.text,
          marginTop: spacing.xl,
        }}
      >
        © {new Date().getFullYear()} Vehicle Management. All rights reserved.
      </Text>
    </Section>
  );
}
