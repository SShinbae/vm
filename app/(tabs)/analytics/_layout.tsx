import { Stack } from "expo-router";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import React from "react";
import { View } from "react-native";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { webPageStyles } from "@/components/layout/webPageStyles";
import { WebFilterButton } from "@/components/ui/WebFilterButton";
import { PeriodSelector } from "@/components/analytics/PeriodSelector";
import {
  AnalyticsPeriodProvider,
  AnalyticsVehicleProvider,
  usePeriodSelector,
} from "@/hooks/useAnalytics";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStyles } from "react-native-unistyles";

import { MaxWidthContainer } from "@/components/layout/MaxWidthContainer";

// Import tab screens
import CostsTab from "./costs";
import FuelTab from "./fuel";
import OverviewTab from "./index";
import PerformanceTab from "./performance";
import ServiceTab from "./service";

const Tab = createMaterialTopTabNavigator();

function AnalyticsTabs() {
  const { theme } = useStyles();
  const { styles: web } = useStyles(webPageStyles);
  const { isWeb, isMobile } = useResponsiveLayout();
  const isWebPage = isWeb && !isMobile;
  const { period, setPeriod, periods } = usePeriodSelector();
  const handleCustomRange = (startDate: Date, endDate: Date) => {
    setPeriod({
      label: `${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}`,
      days: Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000),
      startDate,
      endDate,
    });
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "left", "right"]}
    >
      <MaxWidthContainer
        fullWidth={isWebPage}
        style={isWebPage ? web.frame : undefined}
      >
        {!isWebPage ? (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="costs" />
            <Stack.Screen name="fuel" />
            <Stack.Screen name="service" />
            <Stack.Screen name="performance" />
          </Stack>
        ) : (
          <Tab.Navigator
            tabBar={
              isWebPage
                ? ({ state, descriptors, navigation }) => (
                    <View style={web.toolbar}>
                      <View style={web.filters}>
                        {state.routes.map((route, index) => (
                          <WebFilterButton
                            key={route.key}
                            label={String(
                              descriptors[route.key].options.tabBarLabel ||
                                route.name,
                            )}
                            selected={state.index === index}
                            onPress={() => {
                              const event = navigation.emit({
                                type: "tabPress",
                                target: route.key,
                                canPreventDefault: true,
                              });
                              if (
                                state.index !== index &&
                                !event.defaultPrevented
                              )
                                navigation.navigate(route.name);
                            }}
                          />
                        ))}
                      </View>
                      {state.routes[state.index].name === "overview" && (
                        <PeriodSelector
                          selectedPeriod={period}
                          onPeriodChange={setPeriod}
                          periods={periods}
                          allowCustomRange
                          onCustomRangeSelect={handleCustomRange}
                          placement="toolbar"
                        />
                      )}
                    </View>
                  )
                : undefined
            }
            screenOptions={{
              lazy: true,
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
                minHeight: 48,
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
        )}
      </MaxWidthContainer>
    </SafeAreaView>
  );
}

export default function AnalyticsLayout() {
  return (
    <AnalyticsPeriodProvider>
      <AnalyticsVehicleProvider>
        <AnalyticsTabs />
      </AnalyticsVehicleProvider>
    </AnalyticsPeriodProvider>
  );
}
