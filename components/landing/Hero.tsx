import { spacing, withOpacity } from "@/src/design-system";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Platform, Text, TouchableOpacity, View } from "react-native";
import { useStyles } from "react-native-unistyles";
import { FACTS } from "./content";
import { Section, useBreakpoint } from "./layout";

export function Hero() {
  const { theme } = useStyles();
  const router = useRouter();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const reduceMotion = useReducedMotion();

  // Web paints instantly; native gets a short fade-in unless reduced motion is on.
  const shouldAnimate = Platform.OS !== "web" && !reduceMotion;
  const fade = useRef(new Animated.Value(shouldAnimate ? 0 : 1)).current;
  useEffect(() => {
    if (shouldAnimate) {
      Animated.timing(fade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [shouldAnimate, fade]);

  return (
    <Section
      style={{
        paddingTop: isMobile ? 48 : 80,
        paddingBottom: isMobile ? 56 : 96,
      }}
    >
      <Animated.View
        style={{
          opacity: fade,
          flexDirection: isDesktop ? "row" : "column",
          alignItems: isDesktop ? "center" : "stretch",
          gap: isDesktop ? 64 : 48,
        }}
      >
        <View style={{ flex: isDesktop ? 1 : undefined }}>
          <Text
            accessibilityRole="header"
            aria-level={1}
            style={{
              fontSize: isMobile ? 40 : isTablet ? 52 : 56,
              lineHeight: isMobile ? 46 : isTablet ? 58 : 62,
              fontWeight: "800",
              letterSpacing: -1.5,
              color: theme.colors.text,
              marginBottom: spacing.lg,
            }}
          >
            Know what your car{" "}
            <Text style={{ color: theme.colors.primary }}>really costs.</Text>
          </Text>

          <Text
            style={{
              fontSize: isMobile ? 17 : 20,
              lineHeight: isMobile ? 26 : 30,
              color: theme.colors.textSecondary,
              maxWidth: 520,
              marginBottom: spacing.xxl,
            }}
          >
            Log fuel, services and expenses for every family vehicle. See where
            the money goes.
          </Text>

          <View
            style={{
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "stretch" : "center",
              gap: isMobile ? spacing.md : spacing.xl,
              marginBottom: spacing.xxl,
            }}
          >
            <TouchableOpacity
              onPress={() => router.push("/(auth)/register")}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Get started, it's free"
              style={{
                backgroundColor: theme.colors.primary,
                paddingVertical: 16,
                paddingHorizontal: 28,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: theme.colors.white,
                  fontSize: 17,
                  fontWeight: "700",
                }}
              >
                Get started — it&apos;s free
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              accessibilityRole="link"
              style={{ alignItems: "center", paddingVertical: 8 }}
            >
              <Text
                style={{
                  color: theme.colors.text,
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                I already have an account →
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {FACTS.map((fact) => (
              <View
                key={fact.label}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  backgroundColor: theme.colors.surface,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <Ionicons
                  name={fact.icon}
                  size={15}
                  color={theme.colors.primary}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: theme.colors.text,
                  }}
                >
                  {fact.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View
          style={{
            flex: isDesktop ? 1.15 : undefined,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            padding: 6,
            shadowColor: theme.colors.black,
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.12,
            shadowRadius: 40,
            elevation: 8,
          }}
        >
          <Image
            source={require("@/assets/images/landing-dashboard.webp")}
            accessibilityLabel="Dashboard showing monthly vehicle spending, fuel efficiency and recent logs"
            style={{
              width: "100%",
              aspectRatio: 1562 / 784,
              borderRadius: 11,
              backgroundColor: withOpacity(theme.colors.primary, 0.05),
            }}
            contentFit="cover"
            priority="high"
          />
        </View>
      </Animated.View>
    </Section>
  );
}
