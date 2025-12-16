import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Redirect, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useStyles } from "react-native-unistyles";

// Custom hook for responsive dimensions
const useResponsiveDimensions = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const isMobile = dimensions.width < 768;
  const isTablet = dimensions.width >= 768 && dimensions.width < 1024;
  const isDesktop = dimensions.width >= 1024;

  return {
    width: dimensions.width,
    height: dimensions.height,
    isMobile,
    isTablet,
    isDesktop,
  };
};

interface StatCardProps {
  value: string;
  label: string;
  delay?: number;
  index: number;
}

const StatCard: React.FC<StatCardProps & { reduceMotion?: boolean }> = ({
  value,
  label,
  delay = 0,
  index,
  reduceMotion = false,
}) => {
  const { theme } = useStyles();
  const { isMobile, isTablet } = useResponsiveDimensions();
  const fadeAnim = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const slideAnim = useRef(new Animated.Value(reduceMotion ? 0 : 30)).current;

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reduceMotion, delay, fadeAnim, slideAnim]);

  // Use white background for all cards
  const cardBackgrounds = ["#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF"];

  const accentColors = [
    theme.colors.primary,
    theme.colors.primary,
    theme.colors.primary,
    theme.colors.primary,
  ];

  return (
    <Animated.View
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value}`}
      style={{
        opacity: fadeAnim,
        transform: reduceMotion ? [] : [{ translateY: slideAnim }],
        width: isMobile ? "100%" : isTablet ? "48%" : "23%",
        minWidth: isMobile ? "100%" : 200,
        margin: isMobile ? 8 : 6,
      }}
    >
      <View
        style={{
          backgroundColor: cardBackgrounds[index % 4],
          borderRadius: isMobile ? 16 : 20,
          padding: isMobile ? 24 : isTablet ? 28 : 32,
          borderWidth: 1,
          borderColor: "#FFFFFF",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        {/* Subtle accent line */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: accentColors[index % 4],
            borderTopLeftRadius: isMobile ? 16 : 20,
            borderTopRightRadius: isMobile ? 16 : 20,
          }}
        />

        <Text
          accessible={true}
          accessibilityRole="header"
          style={{
            fontSize: isMobile ? 32 : isTablet ? 36 : 40,
            fontWeight: "700",
            color: theme.colors.text,
            marginBottom: 8,
            letterSpacing: -0.5,
          }}
        >
          {value}
        </Text>
        <Text
          accessible={true}
          style={{
            fontSize: 13,
            color: theme.colors.textSecondary,
            fontWeight: "500",
          }}
        >
          {label}
        </Text>
      </View>
    </Animated.View>
  );
};

interface FeatureCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  delay?: number;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps & { reduceMotion?: boolean }> = ({
  icon,
  title,
  description,
  delay = 0,
  index,
  reduceMotion = false,
}) => {
  const { theme } = useStyles();
  const { isMobile, isTablet } = useResponsiveDimensions();
  const fadeAnim = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const slideAnim = useRef(new Animated.Value(reduceMotion ? 0 : 50)).current;

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reduceMotion, delay, fadeAnim, slideAnim]);

  return (
    <Animated.View
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      style={{
        opacity: fadeAnim,
        transform: reduceMotion ? [] : [{ translateY: slideAnim }],
        marginBottom: 20,
      }}
    >
      <View
        style={{
          backgroundColor:
            (theme.colors as any).card || theme.colors.background,
          borderRadius: isMobile ? 16 : 20,
          padding: isMobile ? 24 : isTablet ? 28 : 32,
          borderWidth: 1,
          borderColor: "#FFFFFF",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        }}
      >
        {/* Icon Container */}
        <View
          style={{
            width: isMobile ? 56 : 64,
            height: isMobile ? 56 : 64,
            borderRadius: isMobile ? 12 : 14,
            backgroundColor: theme.colors.primary + "15",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: isMobile ? 20 : 24,
          }}
        >
          <Ionicons
            name={icon}
            size={isMobile ? 28 : 32}
            color={theme.colors.primary}
          />
        </View>

        <Text
          accessible={true}
          accessibilityRole="header"
          style={{
            fontSize: isMobile ? 20 : isTablet ? 22 : 24,
            fontWeight: "700",
            color: theme.colors.text,
            marginBottom: isMobile ? 12 : 14,
            letterSpacing: -0.3,
          }}
        >
          {title}
        </Text>
        <Text
          accessible={true}
          style={{
            fontSize: isMobile ? 15 : 16,
            color: theme.colors.textSecondary,
            lineHeight: isMobile ? 23 : 25,
            fontWeight: "400",
          }}
        >
          {description}
        </Text>
      </View>
    </Animated.View>
  );
};

export default function Index() {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();
  const { theme } = useStyles();
  const { isMobile, isTablet } = useResponsiveDimensions();
  const [scrollY] = useState(new Animated.Value(0));
  const reduceMotion = useReducedMotion();

  const heroFadeAnim = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const heroSlideAnim = useRef(
    new Animated.Value(reduceMotion ? 0 : 50),
  ).current;

  useEffect(() => {
    if (!loading && !user && !reduceMotion) {
      Animated.parallel([
        Animated.timing(heroFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(heroSlideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, user, reduceMotion, heroFadeAnim, heroSlideAnim]);

  if (!initialized || loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <Image
          source={require("@/assets/images/vm_logo.png")}
          style={{ width: 120, height: 120, marginBottom: 20 }}
          contentFit="contain"
        />
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  const features = [
    {
      icon: "wallet-outline" as keyof typeof Ionicons.glyphMap,
      title: "Expense Tracking",
      description:
        "Monitor all vehicle-related expenses in real-time. Track maintenance, repairs, insurance, and more with detailed categorization and receipt uploads.",
    },
    {
      icon: "speedometer-outline" as keyof typeof Ionicons.glyphMap,
      title: "Mileage Recording",
      description:
        "Automatically log mileage for every trip. Perfect for business deductions, reimbursements, and understanding vehicle usage patterns.",
    },
    {
      icon: "water-outline" as keyof typeof Ionicons.glyphMap,
      title: "Fuel Consumption",
      description:
        "Track fuel purchases and calculate consumption rates. Identify inefficiencies and optimize your fuel costs with detailed analytics.",
    },
    {
      icon: "stats-chart-outline" as keyof typeof Ionicons.glyphMap,
      title: "Advanced Reports",
      description:
        "Generate comprehensive reports with customizable date ranges. Export data for accounting, tax purposes, or fleet analysis.",
    },
  ];

  const parallaxY = scrollY.interpolate({
    inputRange: [0, 500],
    outputRange: [0, -50],
    extrapolate: "clamp",
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Simplified Background */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            position: "absolute",
            top: -150,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: 200,
            backgroundColor: theme.colors.primary + "08",
            transform: [{ translateY: parallaxY }],
          }}
        />
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Section - Improved contrast */}
        <View
          style={{
            backgroundColor: theme.colors.primary,
            paddingTop: Platform.OS === "ios" ? 90 : 70,
            paddingBottom: isMobile ? 60 : isTablet ? 75 : 90,
            paddingHorizontal: isMobile ? 20 : isTablet ? "8%" : "10%",
            position: "relative",
          }}
        >
          <View
            style={{
              maxWidth: 1400,
              alignSelf: "center",
              width: "100%",
            }}
          >
            {/* Hero Text */}
            <Animated.View
              style={{
                opacity: heroFadeAnim,
                transform: reduceMotion ? [] : [{ translateY: heroSlideAnim }],
                marginBottom: isMobile ? 40 : 50,
              }}
            >
              <View
                style={{
                  alignSelf: "flex-start",
                  marginBottom: isMobile ? 20 : 24,
                }}
              >
                <Image
                  source={require("@/assets/images/vm_logo.png")}
                  style={{
                    width: isMobile ? 60 : isTablet ? 70 : 80,
                    height: isMobile ? 60 : isTablet ? 70 : 80,
                  }}
                  contentFit="contain"
                />
              </View>

              <Text
                accessible={true}
                accessibilityRole="header"
                style={{
                  fontSize: isMobile ? 44 : isTablet ? 56 : 64,
                  fontWeight: "800",
                  color: "#FFFFFF",
                  marginBottom: 20,
                  letterSpacing: -1.5,
                  lineHeight: isMobile ? 52 : isTablet ? 64 : 72,
                }}
              >
                Manage Your{"\n"}
                <Text
                  style={{
                    color: "#FFFFFF",
                    textDecorationLine: "underline",
                    textDecorationColor: theme.colors.info,
                    textDecorationStyle: "solid",
                  }}
                >
                  Vehicle Operations
                </Text>
              </Text>

              <Text
                accessible={true}
                style={{
                  fontSize: isMobile ? 18 : isTablet ? 20 : 22,
                  color: "#FFFFFF",
                  opacity: 0.9,
                  lineHeight: 32,
                  maxWidth: 580,
                  marginBottom: 40,
                  fontWeight: "400",
                }}
              >
                Track expenses, monitor mileage, analyze fuel consumption, and
                generate comprehensive reports—all in one powerful platform.
              </Text>

              {/* CTA Buttons - Improved visibility */}
              <View
                style={{
                  flexDirection: isMobile ? "column" : "row",
                  gap: isMobile ? 12 : 16,
                  alignItems: isMobile ? "stretch" : "center",
                }}
              >
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/register")}
                  activeOpacity={0.85}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Register Now"
                  accessibilityHint="Navigate to registration page"
                  style={{
                    backgroundColor: "#FFFFFF",
                    paddingVertical: isMobile ? 16 : isTablet ? 18 : 20,
                    paddingHorizontal: isMobile ? 32 : isTablet ? 38 : 44,
                    borderRadius: 12,
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    elevation: 5,
                  }}
                >
                  <Text
                    style={{
                      color: theme.colors.primary,
                      fontSize: 17,
                      fontWeight: "700",
                    }}
                  >
                    Register Now →
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push("/(auth)/login")}
                  activeOpacity={0.85}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Sign in"
                  accessibilityHint="Navigate to login page"
                  style={{
                    backgroundColor: "transparent",
                    paddingVertical: isMobile ? 16 : isTablet ? 18 : 20,
                    paddingHorizontal: isMobile ? 32 : isTablet ? 38 : 44,
                    borderRadius: 12,
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: "#FFFFFF",
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 17,
                      fontWeight: "600",
                    }}
                  >
                    Sign In
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Stats Grid */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                marginHorizontal: isMobile ? -8 : -6,
                justifyContent: isMobile
                  ? "center"
                  : isTablet
                    ? "space-between"
                    : "flex-start",
              }}
            >
              <StatCard
                value="247"
                label="Vehicles Tracked"
                delay={300}
                index={0}
                reduceMotion={reduceMotion}
              />
              <StatCard
                value="RM108K"
                label="Total Expenses"
                delay={400}
                index={1}
                reduceMotion={reduceMotion}
              />
              <StatCard
                value="12.4L"
                label="Avg Consumption"
                delay={500}
                index={2}
                reduceMotion={reduceMotion}
              />
              <StatCard
                value="89.5KM"
                label="KM This Month"
                delay={600}
                index={3}
                reduceMotion={reduceMotion}
              />
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View
          style={{
            paddingHorizontal: isMobile ? 20 : isTablet ? "8%" : "10%",
            paddingTop: isMobile ? 60 : isTablet ? 80 : 100,
            paddingBottom: isMobile ? 40 : 50,
          }}
        >
          {/* Section header */}
          <View
            style={{
              marginBottom: isMobile ? 40 : isTablet ? 50 : 60,
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: theme.colors.primary + "15",
                paddingHorizontal: 18,
                paddingVertical: 8,
                borderRadius: 20,
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  color: theme.colors.primary,
                  fontSize: 13,
                  fontWeight: "600",
                  letterSpacing: 0.5,
                }}
              >
                Features
              </Text>
            </View>

            <Text
              style={{
                fontSize: isMobile ? 38 : isTablet ? 46 : 52,
                fontWeight: "800",
                color: theme.colors.text,
                textAlign: "center",
                marginBottom: 18,
                letterSpacing: -1,
              }}
            >
              Everything You Need
            </Text>
            <Text
              style={{
                fontSize: isMobile ? 17 : isTablet ? 18 : 20,
                color: theme.colors.textSecondary,
                textAlign: "center",
                lineHeight: 28,
                maxWidth: 640,
                fontWeight: "400",
              }}
            >
              Comprehensive tools to keep your vehicles running efficiently and
              your costs under control.
            </Text>
          </View>

          <View
            style={{
              maxWidth: 1400,
              alignSelf: "center",
              width: "100%",
            }}
          >
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 150}
                index={index}
                reduceMotion={reduceMotion}
              />
            ))}
          </View>
        </View>

        {/* CTA Section */}
        <View
          style={{
            paddingHorizontal: isMobile ? 20 : isTablet ? "8%" : "10%",
            paddingVertical: isMobile ? 50 : isTablet ? 60 : 70,
          }}
        >
          <View
            style={{
              maxWidth: 1200,
              alignSelf: "center",
              width: "100%",
              backgroundColor: theme.colors.primary,
              padding: isMobile ? 32 : isTablet ? 50 : 70,
              borderRadius: isMobile ? 20 : 24,
              borderWidth: 1,
              borderColor: "#FFFFFF",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.1,
              shadowRadius: 20,
              elevation: 5,
            }}
          >
            <View>
              <Text
                accessible={true}
                accessibilityRole="header"
                style={{
                  fontSize: isMobile ? 32 : isTablet ? 38 : 44,
                  fontWeight: "800",
                  color: "#FFFFFF",
                  textAlign: "center",
                  marginBottom: 18,
                  letterSpacing: -1,
                }}
              >
                Ready to Optimize Your Fleet?
              </Text>
              <Text
                accessible={true}
                style={{
                  fontSize: isMobile ? 18 : isTablet ? 19 : 21,
                  color: "#FFFFFF",
                  opacity: 0.9,
                  textAlign: "center",
                  marginBottom: 38,
                  lineHeight: 30,
                  maxWidth: 720,
                  alignSelf: "center",
                }}
              >
                Join thousands of businesses and individuals who trust our
                platform to manage their vehicles efficiently.
              </Text>

              <TouchableOpacity
                onPress={() => router.push("/(auth)/register")}
                activeOpacity={0.85}
                style={{ alignSelf: "center" }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Register Now"
                accessibilityHint="Navigate to registration page"
              >
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    paddingVertical: 20,
                    paddingHorizontal: 54,
                    borderRadius: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    elevation: 5,
                  }}
                >
                  <Text
                    style={{
                      color: theme.colors.primary,
                      fontSize: 17,
                      fontWeight: "700",
                    }}
                  >
                    Register Now
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingVertical: 40,
            borderTopWidth: 1,
            borderTopColor: "#FFFFFF",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: 15,
              textAlign: "center",
            }}
          >
            © 2025 Vehicle Management. All rights reserved.
          </Text>
          <Text
            style={{
              color: theme.colors.primary,
              fontSize: 14,
              textAlign: "center",
              marginTop: 8,
              fontWeight: "600",
            }}
          >
            Track. Monitor. Optimize.
          </Text>
        </View>
      </Animated.ScrollView>
    </View>
  );
}
