import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useStyles } from "react-native-unistyles";
import { Section, useBreakpoint } from "./layout";

export function Hero() {
  const { theme } = useStyles();
  const router = useRouter();
  const { isMobile, isDesktop } = useBreakpoint();

  return (
    <Section
      style={{
        paddingTop: isMobile ? 40 : 80,
        paddingBottom: isMobile ? 56 : 88,
      }}
    >
      <View
        style={{
          flexDirection: isDesktop ? "row" : "column",
          alignItems: isDesktop ? "center" : "stretch",
          gap: isDesktop ? 48 : 36,
        }}
      >
        <View style={{ flex: isDesktop ? 0.9 : undefined }}>
          <Text
            style={{
              color: theme.colors.primary,
              fontSize: 14,
              fontWeight: "600",
              marginBottom: 20,
            }}
          >
            Less paperwork. More perspective.
          </Text>
          <Text
            accessibilityRole="header"
            aria-level={1}
            style={{
              fontSize: isMobile ? 42 : 60,
              lineHeight: isMobile ? 47 : 65,
              fontWeight: "800",
              letterSpacing: -1.8,
              color: theme.colors.text,
              maxWidth: 560,
              marginBottom: 24,
            }}
          >
            Know what your car{" "}
            <Text style={{ color: theme.colors.primary }}>really costs.</Text>
          </Text>
          <Text
            style={{
              fontSize: isMobile ? 17 : 19,
              lineHeight: 28,
              color: theme.colors.text,
              opacity: 0.8,
              maxWidth: 460,
              marginBottom: 28,
            }}
          >
            Fuel, services and expenses. Together at last. A clearer view of
            every vehicle you and your family own.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/register")}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Get started, it's free"
            style={{
              backgroundColor: theme.colors.text,
              paddingVertical: 17,
              paddingHorizontal: 24,
              borderRadius: 12,
              alignSelf: isMobile ? "stretch" : "flex-start",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <Text
              style={{
                color: theme.colors.background,
                fontSize: 17,
                fontWeight: "600",
              }}
            >
              Create your free account
            </Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={theme.colors.background}
            />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 13,
              lineHeight: 20,
              color: theme.colors.text,
              opacity: 0.75,
              marginTop: 14,
            }}
          >
            Free to use. No ads. No credit card.
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 20,
              marginTop: 32,
            }}
          >
            {["Receipt photos", "Family sharing"].map((label) => (
              <View
                key={label}
                style={{ flexDirection: "row", alignItems: "center", gap: 7 }}
              >
                <Ionicons
                  name="checkmark"
                  size={16}
                  color={theme.colors.primary}
                />
                <Text style={{ fontSize: 14, color: theme.colors.text }}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View
          style={{
            flex: isDesktop ? 1.2 : undefined,
            backgroundColor: theme.colors.surface,
            borderRadius: 24,
            padding: isMobile ? 24 : 20,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: isMobile ? 300 : undefined,
              borderRadius: isMobile ? 22 : 12,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Image
              source={
                isMobile
                  ? require("@/assets/images/landing-mobile-dashboard.png")
                  : require("@/assets/images/landing-dashboard.webp")
              }
              accessible
              accessibilityRole="image"
              accessibilityLabel={
                isMobile
                  ? "Mobile dashboard with vehicle totals, fuel costs and quick logging actions"
                  : "Desktop dashboard with vehicle totals and recent activity"
              }
              style={{
                width: "100%",
                aspectRatio: isMobile ? 1206 / 2622 : 1562 / 784,
              }}
              contentFit="contain"
              priority="high"
            />
          </View>
          <Text
            style={{
              color: theme.colors.text,
              opacity: 0.75,
              fontSize: 12,
              lineHeight: 18,
              marginTop: 16,
              textAlign: "center",
            }}
          >
            Your everyday overview, on any screen. Sample account shown.
          </Text>
        </View>
      </View>
    </Section>
  );
}
