/**
 * Demo Mode Layout
 *
 * This layout wraps all demo mode routes and provides a banner
 * to indicate that the user is in demo mode.
 * Includes WebSidebar for web navigation.
 */

import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { View, Text, Platform, StyleSheet } from "react-native";
import { useDemoMode } from "@/lib/contexts/DemoContext";
import { DemoWebSidebar } from "@/components/navigation/DemoWebSidebar";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { SidebarProvider, useSidebar } from "@/lib/contexts/SidebarContext";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

function DemoLayoutContent() {
  const { isDemoMode, enableDemoMode } = useDemoMode();
  const layout = useResponsiveLayout();
  const { isOpen } = useSidebar();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Ensure demo mode is enabled when entering demo routes
  useEffect(() => {
    console.log("[Demo Layout] Demo mode status:", isDemoMode);
    if (!isDemoMode) {
      console.log("[Demo Layout] Enabling demo mode");
      enableDemoMode();
    }
  }, [isDemoMode, enableDemoMode]);

  // Calculate content margin for web sidebar
  const sidebarWidth =
    layout.isWeb && !layout.isMobile ? (isOpen ? 240 : 60) : 0;
  const bottomBarHeight = layout.isWeb && layout.isMobile ? 64 : 0;

  return (
    <View style={styles.container}>
      {/* Demo Web Sidebar */}
      <DemoWebSidebar />

      {/* Main Content */}
      <View
        style={[
          styles.mainContent,
          Platform.OS === "web" && {
            marginLeft: sidebarWidth,
            marginBottom: bottomBarHeight,
          },
        ]}
      >
        {/* Demo Mode Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            MOD DEMO - Perubahan tidak akan disimpan
          </Text>
        </View>

        {/* Demo Routes */}
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: colors.background,
            },
          }}
        >
          <Stack.Screen name="login" options={{ title: "Demo Login" }} />
          <Stack.Screen
            name="dashboard"
            options={{ title: "Demo Dashboard" }}
          />
          {/* vehicles folder is auto-registered by Expo Router */}
          <Stack.Screen
            name="analytics"
            options={{ title: "Demo Analytics" }}
          />
          <Stack.Screen name="profile" options={{ title: "Demo Profile" }} />
        </Stack>
      </View>
    </View>
  );
}

export default function DemoLayout() {
  return (
    <SidebarProvider>
      <DemoLayoutContent />
    </SidebarProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  mainContent: {
    flex: 1,
    ...Platform.select({
      web: {
        transition: "margin-left 0.3s ease",
      },
    }),
  },
  banner: {
    backgroundColor: "#F59E0B",
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    ...Platform.select({
      web: {
        position: "sticky" as any,
        top: 0,
      },
    }),
  },
  bannerText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
