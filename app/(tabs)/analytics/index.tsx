import {
  CostBreakdownCard,
  EmptyAnalytics,
  MetricCard,
  PeriodSelector,
  StatCard,
  UpcomingServiceCard,
  VehicleFilter,
} from "@/components/analytics";
import { SkeletonAnalytics } from "@/components/ui/Skeleton";
import {
  useAnalyticsData,
  usePeriodSelector,
  useVehicleFilter,
} from "@/hooks/useAnalytics";
import React, { useMemo } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStyles } from "react-native-unistyles";

export default function OverviewTab() {
  const { theme } = useStyles();
  const { period, setPeriod, periods } = usePeriodSelector();
  const {
    vehicles,
    selectedVehicleIds,
    toggleVehicle,
    selectAll,
    clearAll,
    loading: vehiclesLoading,
  } = useVehicleFilter();

  const filters = useMemo(
    () => ({
      period,
      vehicleIds: selectedVehicleIds,
    }),
    [period, selectedVehicleIds],
  );

  const { loading, error, costMetrics, fuelMetrics, serviceMetrics, refetch } =
    useAnalyticsData(filters);

  const hasData =
    costMetrics &&
    (costMetrics.totalCost > 0 ||
      fuelMetrics?.fuelUps ||
      serviceMetrics?.totalServices);

  // Loading state
  if (loading || vehiclesLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <SkeletonAnalytics />
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <ScrollView style={{ flex: 1 }}>
          <View
            style={{
              paddingHorizontal: theme.spacing.xl,
              paddingVertical: theme.spacing.lg,
            }}
          >
            <Text
              style={{
                fontSize: theme.fontSize["3xl"],
                fontWeight: theme.fontWeight.bold,
                color: theme.colors.text,
                marginBottom: theme.spacing.xs,
              }}
            >
              Analytics
            </Text>
            <Text
              style={{
                fontSize: theme.fontSize.base,
                color: theme.colors.textSecondary,
              }}
            >
              Track costs, fuel, and maintenance
            </Text>
          </View>
          <View style={{ padding: theme.spacing.lg }}>
            <EmptyAnalytics
              icon="alert-circle-outline"
              title="Error Loading Data"
              message="Failed to load analytics data. Please try again."
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Empty state
  if (!hasData) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <ScrollView style={{ flex: 1 }}>
          <View
            style={{
              paddingHorizontal: theme.spacing.xl,
              paddingVertical: theme.spacing.lg,
            }}
          >
            <Text
              style={{
                fontSize: theme.fontSize["3xl"],
                fontWeight: theme.fontWeight.bold,
                color: theme.colors.text,
                marginBottom: theme.spacing.xs,
              }}
            >
              Analytics
            </Text>
            <Text
              style={{
                fontSize: theme.fontSize.base,
                color: theme.colors.textSecondary,
              }}
            >
              Track costs, fuel, and maintenance
            </Text>
          </View>
          <View style={{ padding: theme.spacing.lg }}>
            <PeriodSelector
              selectedPeriod={period}
              onPeriodChange={setPeriod}
              periods={periods}
            />
            <VehicleFilter
              vehicles={vehicles}
              selectedVehicleIds={selectedVehicleIds}
              onToggleVehicle={toggleVehicle}
              onSelectAll={selectAll}
              onClearAll={clearAll}
            />
          </View>
          <EmptyAnalytics />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const upcomingServices = serviceMetrics?.upcomingServices.slice(0, 3) || [];

  // Calculate selected vehicle count
  const isAllSelected = selectedVehicleIds.length === 0;
  const selectedVehicleCount = isAllSelected
    ? vehicles.length
    : selectedVehicleIds.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: theme.spacing.xl,
            paddingVertical: theme.spacing.lg,
            backgroundColor: theme.colors.background,
          }}
        >
          <Text
            style={{
              fontSize: theme.fontSize["3xl"],
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
              marginBottom: theme.spacing.xs,
            }}
          >
            Analytics
          </Text>
          <Text
            style={{
              fontSize: theme.fontSize.base,
              color: theme.colors.textSecondary,
            }}
          >
            Track costs, fuel, and maintenance
          </Text>
        </View>

        <View style={{ padding: theme.spacing.lg }}>
          {/* Filters */}
          <PeriodSelector
            selectedPeriod={period}
            onPeriodChange={setPeriod}
            periods={periods}
          />
          <VehicleFilter
            vehicles={vehicles}
            selectedVehicleIds={selectedVehicleIds}
            onToggleVehicle={toggleVehicle}
            onSelectAll={selectAll}
            onClearAll={clearAll}
          />

          {/* Summary Section */}
          <Text
            style={{
              fontSize: theme.fontSize["2xl"],
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
              marginBottom: theme.spacing.md,
              marginTop: theme.spacing.lg,
            }}
          >
            Summary
          </Text>

          {/* Metric Cards Grid */}
          <View
            style={{ gap: theme.spacing.md, marginBottom: theme.spacing.md }}
          >
            <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
              <View style={{ flex: 1 }}>
                <MetricCard
                  title="Total Cost"
                  value={`RM${costMetrics?.totalCost.toFixed(2) || 0}`}
                  subtitle={period.label}
                  icon="cash-outline"
                />
              </View>
              <View style={{ flex: 1 }}>
                <MetricCard
                  title="Cost Per Km"
                  value={`RM${costMetrics?.costPerKm.toFixed(2) || 0}`}
                  subtitle="Average"
                  icon="speedometer-outline"
                />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
              <View style={{ flex: 1 }}>
                <MetricCard
                  title="Fuel Cost"
                  value={`RM${costMetrics?.totalFuelCost.toFixed(2) || 0}`}
                  subtitle={`${fuelMetrics?.fuelUps || 0} fill-ups`}
                  icon="water-outline"
                />
              </View>
              <View style={{ flex: 1 }}>
                <MetricCard
                  title="Service Cost"
                  value={`RM${costMetrics?.totalServiceCost.toFixed(2) || 0}`}
                  subtitle={`${serviceMetrics?.totalServices || 0} services`}
                  icon="build-outline"
                />
              </View>
            </View>
          </View>

          {/* Cost Breakdown Section */}
          <Text
            style={{
              fontSize: theme.fontSize["2xl"],
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
              marginBottom: theme.spacing.md,
              marginTop: theme.spacing.lg,
            }}
          >
            Cost Breakdown
          </Text>
          <CostBreakdownCard
            totalCost={costMetrics?.totalCost || 0}
            fuelCost={costMetrics?.totalFuelCost || 0}
            serviceCost={costMetrics?.totalServiceCost || 0}
          />

          {/* Quick Stats Section */}
          <Text
            style={{
              fontSize: theme.fontSize["2xl"],
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
              marginBottom: theme.spacing.md,
              marginTop: theme.spacing.lg,
            }}
          >
            Quick Stats
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: theme.spacing.md,
              marginBottom: theme.spacing.md,
            }}
          >
            <StatCard
              value={fuelMetrics?.averageConsumption.toFixed(1) || 0}
              label="L/100km"
            />
            <StatCard
              value={fuelMetrics?.totalDistance.toFixed(0) || 0}
              label="km traveled"
            />
            <StatCard value={selectedVehicleCount} label="vehicles selected" />
          </View>

          {/* Upcoming Maintenance Section */}
          {upcomingServices.length > 0 && (
            <>
              <Text
                style={{
                  fontSize: theme.fontSize["2xl"],
                  fontWeight: theme.fontWeight.bold,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.md,
                  marginTop: theme.spacing.lg,
                }}
              >
                Upcoming Maintenance
              </Text>
              <View style={{ gap: theme.spacing.md }}>
                {upcomingServices.map((service, index) => (
                  <UpcomingServiceCard key={index} service={service} />
                ))}
              </View>
            </>
          )}

          {/* Bottom spacing */}
          <View style={{ height: theme.spacing.xl }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
