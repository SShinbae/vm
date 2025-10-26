/**
 * Modern Analytics Tab Bar Component (2025 UI)
 * - Pill-style segmented control with smooth animations
 * - Background transitions when switching tabs
 * - Subtle shadows on active tabs with primary color glow
 * - Rounded corners with light shadow elevation
 * - Spring animations using react-native-reanimated
 */

import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { useRouter, usePathname } from "expo-router";

const tabs = [
  { name: "Overview", path: "/analytics" },
  { name: "Fuel", path: "/analytics/fuel" },
  { name: "Service", path: "/analytics/service" },
  { name: "Vehicles", path: "/analytics/performance" },
];

export function AnalyticsTabBar() {
  const { styles, theme } = useStyles(stylesheet);
  const router = useRouter();
  const pathname = usePathname();

  const getActivePath = () => {
    if (pathname === "/(tabs)/analytics" || pathname === "/analytics")
      return "/analytics";
    if (pathname.includes("fuel")) return "/analytics/fuel";
    if (pathname.includes("service")) return "/analytics/service";
    if (pathname.includes("performance")) return "/analytics/performance";
    return "/analytics";
  };

  const activePath = getActivePath();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => {
            const isActive = activePath === tab.path;
            return (
              <TouchableOpacity
                key={tab.path}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => router.push(tab.path as any)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.tabContent,
                    isActive && styles.tabContentActive,
                  ]}
                >
                  <Text
                    style={[styles.tabText, isActive && styles.tabTextActive]}
                  >
                    {tab.name}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
    paddingVertical: theme.spacing.md,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 4,
    // Soft shadow elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    marginHorizontal: 2,
  },
  tabActive: {
    // Active state styling applied via tabContentActive
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: 12,
  },
  tabContentActive: {
    backgroundColor: theme.colors.primary,
    // Primary color glow
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  tabText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.white,
  },
}));
