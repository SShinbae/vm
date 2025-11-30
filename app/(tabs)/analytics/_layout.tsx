import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStyles } from "react-native-unistyles";

// Import tab screens
import CostsTab from "./costs";
import FuelTab from "./fuel";
import OverviewTab from "./index";
import PerformanceTab from "./performance";
import ServiceTab from "./service";

const Tab = createMaterialTopTabNavigator();

export default function AnalyticsLayout() {
  const { theme } = useStyles();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top"]}
    >
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarIndicatorStyle: {
            backgroundColor: theme.colors.primary,
            height: 3,
          },
          tabBarStyle: {
            backgroundColor: theme.colors.background,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          },
          tabBarLabelStyle: {
            fontSize: theme.fontSize.sm,
            fontWeight: theme.fontWeight.semibold,
            textTransform: "none",
          },
          tabBarScrollEnabled: true,
          tabBarItemStyle: {
            width: "auto",
            minWidth: 90,
          },
        }}
      >
        <Tab.Screen
          name="overview"
          component={OverviewTab}
          options={{ tabBarLabel: "Overview" }}
        />
        <Tab.Screen
          name="costs"
          component={CostsTab}
          options={{ tabBarLabel: "Costs" }}
        />
        <Tab.Screen
          name="fuel"
          component={FuelTab}
          options={{ tabBarLabel: "Fuel" }}
        />
        <Tab.Screen
          name="service"
          component={ServiceTab}
          options={{ tabBarLabel: "Service" }}
        />
        <Tab.Screen
          name="performance"
          component={PerformanceTab}
          options={{ tabBarLabel: "Performance" }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}
