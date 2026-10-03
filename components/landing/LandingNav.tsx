import { spacing, withOpacity } from "@/src/design-system";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { useStyles } from "react-native-unistyles";
import { Section, useBreakpoint } from "./layout";

export type SectionKey = "features" | "how" | "faq";

const LINKS: { key: SectionKey; label: string }[] = [
  { key: "features", label: "Features" },
  { key: "how", label: "How it works" },
  { key: "faq", label: "FAQ" },
];

export function LandingNav({
  onNavigate,
}: {
  onNavigate: (key: SectionKey) => void;
}) {
  const { theme } = useStyles();
  const router = useRouter();
  const { isMobile, isDesktop } = useBreakpoint();

  return (
    <Section
      style={{
        backgroundColor: theme.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: withOpacity(theme.colors.border, 0.6),
        paddingTop: Platform.OS === "ios" ? 50 : 0,
      }}
    >
      <View
        style={{
          height: 64,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.lg,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            flex: 1,
          }}
        >
          <Image
            source={require("@/assets/images/vm_logo.webp")}
            style={{ width: 32, height: 32 }}
            contentFit="contain"
            accessibilityLabel="Vehicle Management logo"
          />
          {!isMobile && (
            <Text
              style={{
                fontSize: 17,
                fontWeight: "700",
                color: theme.colors.text,
              }}
            >
              Vehicle Management
            </Text>
          )}
        </View>

        {isDesktop &&
          LINKS.map((link) => (
            <TouchableOpacity
              key={link.key}
              onPress={() => onNavigate(link.key)}
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

        <TouchableOpacity
          onPress={() => router.push("/(auth)/login")}
          accessibilityRole="link"
          accessibilityLabel="Sign in"
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: theme.colors.text,
            }}
          >
            Sign in
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(auth)/register")}
          accessibilityRole="button"
          accessibilityLabel="Get started"
          style={{
            backgroundColor: theme.colors.primary,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 10,
          }}
        >
          <Text
            style={{
              color: theme.colors.white,
              fontSize: 15,
              fontWeight: "600",
            }}
          >
            Get started
          </Text>
        </TouchableOpacity>
      </View>
    </Section>
  );
}
