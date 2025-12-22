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
  const { styles } = useStyles(stylesheet);
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
        {tabs.map((tab) => {
          const isActive = activePath === tab.path;
          return (
            <TouchableOpacity
              key={tab.path}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => router.push(tab.path as any)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.name}
              </Text>
              {isActive && <View style={styles.indicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.sm,
  },
  tab: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    position: "relative",
  },
  tabActive: {
    // Active state handled by indicator
  },
  tabText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: theme.colors.primary,
  },
}));
