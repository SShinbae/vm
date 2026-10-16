import { useStyles } from "react-native-unistyles";
import { router, Tabs, usePathname } from "expo-router";
import React, { useEffect } from "react";

import { ResponsiveTabBar } from "@/components/navigation/ResponsiveTabBar";
import { DashboardWebLayout } from "@/components/layout/DashboardWebLayout";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useNotifications } from "@/lib/contexts/NotificationContext";
import { pushService } from "@/lib/services/pushService";

export default function TabLayout() {
  const { theme } = useStyles();
  const layout = useResponsiveLayout();
  const pathname = usePathname();
  const { unreadCount } = useNotifications();

  // Open the screen for a notification tap that launched the app, on top of
  // the dashboard, now that the navigator is mounted.
  useEffect(() => {
    const route = pushService.consumeLaunchRoute();
    if (route) router.push(route as never);
  }, []);

  // Hide tab bar on web desktop, show WebSidebar instead
  const showTabBar = !layout.isWeb || layout.isMobile;
  const showHeader =
    ["/", "/vehicles", "/logs", "/notifications", "/profile"].includes(
      pathname,
    ) ||
    pathname === "/analytics" ||
    pathname.startsWith("/analytics/");

  return (
    <DashboardWebLayout showHeader={showHeader}>
      <Tabs
        backBehavior="fullHistory"
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
            href: layout.isWeb && !layout.isMobile ? undefined : null,
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
    </DashboardWebLayout>
  );
}
