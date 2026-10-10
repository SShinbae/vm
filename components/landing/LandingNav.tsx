import { spacing, withOpacity } from "@/src/design-system";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStyles } from "react-native-unistyles";
import { Section, useBreakpoint } from "./layout";

/** Material 3 small top app bar height, excluding the status bar inset. */
export const NAV_BAR_HEIGHT = 64;

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
  const { isDesktop } = useBreakpoint();
  // Edge-to-edge Android and iOS draw under the status bar; inset is 0 on web.
  const { top } = useSafeAreaInsets();

  return (
    <Section
      style={{
        backgroundColor: theme.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: withOpacity(theme.colors.border, 0.6),
        paddingTop: top,
      }}
    >
      <View
        style={{
          height: NAV_BAR_HEIGHT,
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
          <Link href="/" asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Vehicle Management home"
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
