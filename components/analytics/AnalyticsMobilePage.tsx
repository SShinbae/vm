import React from "react";
import {
  RefreshControl,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useStyles } from "react-native-unistyles";
import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { usePeriodSelector, useVehicleFilter } from "@/hooks/useAnalytics";
import { AnalyticsVehiclePicker } from "./AnalyticsVehiclePicker";
import { PeriodSelector } from "./PeriodSelector";

export function AnalyticsMobilePage({
  title,
  subtitle,
  report = true,
  refreshing,
  onRefresh,
  children,
}: {
  title: string;
  subtitle: string;
  report?: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  children: React.ReactNode;
}) {
  const { theme } = useStyles();
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 360 || fontScale >= 1.3;
  const { period, periods, setPeriod } = usePeriodSelector();
  const vehicles = useVehicleFilter();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <MobilePageHeader
        title={title}
        subtitle={subtitle}
        onBack={
          report
            ? () => {
                if (router.canGoBack()) router.back();
                else router.replace("/analytics");
              }
            : undefined
        }
      />
      <View
        style={{
          flexDirection: stacked ? "column" : "row",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <View style={{ flex: stacked ? undefined : 1, minWidth: 0 }}>
          <AnalyticsVehiclePicker
            compact
            vehicles={vehicles.vehicles}
            selectedVehicleIds={vehicles.selectedVehicleIds}
            onToggleVehicle={vehicles.toggleVehicle}
            onSelectAll={vehicles.selectAll}
          />
        </View>
        <View style={{ flex: stacked ? undefined : 1, minWidth: 0 }}>
          <PeriodSelector
            compact
            selectedPeriod={period}
            periods={periods}
            onPeriodChange={setPeriod}
          />
        </View>
      </View>
      {children}
    </ScrollView>
  );
}
