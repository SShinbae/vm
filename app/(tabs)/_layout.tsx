import { useStyles } from "react-native-unistyles";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import { ResponsiveTabBar } from "@/components/navigation/ResponsiveTabBar";
import { WebSidebar } from "@/components/navigation/WebSidebar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useNotifications } from "@/lib/contexts/NotificationContext";
import { SidebarProvider, useSidebar } from "@/lib/contexts/SidebarContext";

function TabLayoutContent() {
  const { theme } = useStyles();
  const layout = useResponsiveLayout();
  const { toggle, isOpen } = useSidebar();
  const { unreadCount } = useNotifications();

  // Add keyboard shortcuts
  useKeyboardShortcuts({
    onToggleSidebar: toggle,
  });

  // Hide tab bar on web desktop, show WebSidebar instead
  const showTabBar = !layout.isWeb || layout.isMobile;

  return (
    <View style={styles.container}>
      {/* Sidebar for web desktop only */}
      {Platform.OS === "web" && !layout.isMobile && <WebSidebar />}

      {/* Main content area with responsive margin for sidebar */}
      <View
        style={[
          styles.content,
          // Desktop web: add margin for sidebar
          Platform.OS === "web" &&
            !layout.isMobile && {
              marginLeft: isOpen ? 240 : 60,
            },
        ]}
      >
        <Tabs
          tabBar={(props) =>
            showTabBar ? <ResponsiveTabBar {...props} /> : null
          }
          screenOptions={{
            tabBarActiveTintColor: theme.colors.primary,
            headerShown: false,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarLabel: "Home",
              tabBarIcon: ({ color, size }) => (
                <IconSymbol name="house.fill" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="vehicles"
            options={{
              title: "Vehicles",
              tabBarLabel: "Vehicles",
              tabBarIcon: ({ color, size }) => (
                <IconSymbol name="car.fill" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="analytics"
            options={{
              title: "Analytics",
              tabBarLabel: "Analytics",
              tabBarIcon: ({ color, size }) => (
                <IconSymbol
                  name="chart.line.uptrend.xyaxis"
                  size={size}
                  color={color}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="logs"
            options={{
              title: "Logs",
              tabBarLabel: "Logs",
              tabBarIcon: ({ color, size }) => (
                <IconSymbol name="doc.text.fill" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="notifications"
            options={{
              title: "Notifications",
              tabBarLabel: "Notifications",
              tabBarIcon: ({ color, size }) => (
                <IconSymbol name="bell.fill" size={size} color={color} />
              ),
              tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: "Profile",
              tabBarLabel: "Profile",
              tabBarIcon: ({ color, size }) => (
                <IconSymbol name="person.fill" size={size} color={color} />
              ),
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <SidebarProvider>
      <TabLayoutContent />
    </SidebarProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  content: {
    flex: 1,
    ...Platform.select({
      web: {
        transition: "margin-left 0.3s ease",
      },
    }),
  },
});
