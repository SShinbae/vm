import React, { useMemo } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStyles } from "react-native-unistyles";
import {
  PeriodSelector,
  VehicleFilter,
  EmptyAnalytics,
  AnalyticsHeader,
} from "@/components/analytics";
import {
  useAnalyticsData,
  usePeriodSelector,
  useVehicleFilter,
} from "@/hooks/useAnalytics";

export default function PerformanceTab() {
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

  const { loading, error, vehicleComparison, refetch } =
    useAnalyticsData(filters);

  const hasData = vehicleComparison && vehicleComparison.length > 0;

  // Loading state
  if (loading || vehiclesLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <AnalyticsHeader />
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text
            style={{
              fontSize: theme.fontSize.base,
              color: theme.colors.textSecondary,
            }}
          >
            Loading vehicle performance...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <EmptyAnalytics
          icon="alert-circle-outline"
          title="Error Loading Data"
          message="Failed to load vehicle performance data. Please try again."
        />
      </SafeAreaView>
    );
  }

  // Empty state
  if (!hasData) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <View style={{ padding: theme.spacing.lg }}>
          <View style={{ marginBottom: theme.spacing.lg }}>
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
        </View>
        <EmptyAnalytics
          icon="car-outline"
          title="No Vehicle Data"
          message="Start logging data for your vehicles to see performance comparisons."
        />
      </SafeAreaView>
    );
  }

  // Sort vehicles by total cost (descending)
  const sortedVehicles = [...vehicleComparison].sort(
    (a, b) => b.totalCost - a.totalCost,
  );

  // Find best and worst performers
  const mostEfficient = [...vehicleComparison].sort(
    (a, b) => a.fuelEfficiency - b.fuelEfficiency,
  )[0];
  const leastEfficient = [...vehicleComparison].sort(
    (a, b) => b.fuelEfficiency - a.fuelEfficiency,
  )[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: theme.spacing.lg }}>
          {/* Filters */}
          <View style={{ marginBottom: theme.spacing.lg }}>
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

          {/* Highlights */}
          {vehicleComparison.length > 1 && (
            <>
              <Text
                style={{
                  fontSize: theme.fontSize.xl,
                  fontWeight: theme.fontWeight.bold,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.md,
                  marginTop: theme.spacing.lg,
                }}
              >
                Highlights
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  gap: theme.spacing.md,
                  marginBottom: theme.spacing.md,
                }}
              >
                {/* Most Efficient */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.lg,
                    padding: theme.spacing.lg,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.fontSize.xs,
                      color: theme.colors.textSecondary,
                      fontWeight: theme.fontWeight.medium,
                      marginBottom: theme.spacing.xs,
                    }}
                  >
                    Most Efficient
                  </Text>
                  <Text
                    style={{
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.text,
                      fontWeight: theme.fontWeight.bold,
                      marginBottom: theme.spacing.xs,
                      textAlign: "center",
                    }}
                    numberOfLines={1}
                  >
                    {mostEfficient.vehicleName}
                  </Text>
                  <Text
                    style={{
                      fontSize: theme.fontSize.xl,
                      color: theme.colors.primary,
                      fontWeight: theme.fontWeight.bold,
                    }}
                  >
                    {mostEfficient.fuelEfficiency.toFixed(1)} L/100km
                  </Text>
                </View>

                {/* Least Efficient */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.lg,
                    padding: theme.spacing.lg,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.fontSize.xs,
                      color: theme.colors.textSecondary,
                      fontWeight: theme.fontWeight.medium,
                      marginBottom: theme.spacing.xs,
                    }}
                  >
                    Least Efficient
                  </Text>
                  <Text
                    style={{
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.text,
                      fontWeight: theme.fontWeight.bold,
                      marginBottom: theme.spacing.xs,
                      textAlign: "center",
                    }}
                    numberOfLines={1}
                  >
                    {leastEfficient.vehicleName}
                  </Text>
                  <Text
                    style={{
                      fontSize: theme.fontSize.xl,
                      color: theme.colors.primary,
                      fontWeight: theme.fontWeight.bold,
                    }}
                  >
                    {leastEfficient.fuelEfficiency.toFixed(1)} L/100km
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Vehicle Comparison Table */}
          <Text
            style={{
              fontSize: theme.fontSize.xl,
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
              marginBottom: theme.spacing.md,
              marginTop: theme.spacing.lg,
            }}
          >
            Vehicle Comparison
          </Text>

          {sortedVehicles.map((vehicle, index) => (
            <View
              key={vehicle.vehicleId}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing.lg,
                marginBottom: theme.spacing.md,
                borderLeftWidth: 4,
                borderLeftColor: theme.colors.primary,
              }}
            >
              {/* Vehicle Header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: theme.spacing.md,
                  gap: theme.spacing.md,
                }}
              >
                {/* Rank Badge */}
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: theme.colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.fontSize.base,
                      fontWeight: theme.fontWeight.bold,
                      color: theme.colors.white,
                    }}
                  >
                    #{index + 1}
                  </Text>
                </View>

                {/* Vehicle Name */}
                <Text
                  style={{
                    flex: 1,
                    fontSize: theme.fontSize.lg,
                    fontWeight: theme.fontWeight.bold,
                    color: theme.colors.text,
                  }}
                  numberOfLines={1}
                >
                  {vehicle.vehicleName}
                </Text>
              </View>

              {/* Vehicle Metrics */}
              <View
                style={{
                  gap: theme.spacing.sm,
                  marginBottom: theme.spacing.md,
                }}
              >
                {/* Total Cost */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    Total Cost
                  </Text>
                  <Text
                    style={{
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.text,
                      fontWeight: theme.fontWeight.medium,
                    }}
                  >
                    RM{vehicle.totalCost.toFixed(2)}
                  </Text>
                </View>

                {/* Cost per km */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    Cost per km
                  </Text>
                  <Text
                    style={{
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.text,
                      fontWeight: theme.fontWeight.medium,
                    }}
                  >
                    RM{vehicle.costPerKm.toFixed(2)}
                  </Text>
                </View>

                {/* Fuel Efficiency */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    Fuel Efficiency
                  </Text>
                  <Text
                    style={{
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.text,
                      fontWeight: theme.fontWeight.medium,
                    }}
                  >
                    {vehicle.fuelEfficiency.toFixed(1)} L/100km
                  </Text>
                </View>

                {/* Distance Traveled */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    Distance Traveled
                  </Text>
                  <Text
                    style={{
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.text,
                      fontWeight: theme.fontWeight.medium,
                    }}
                  >
                    {vehicle.totalDistance.toFixed(0)} km
                  </Text>
                </View>

                {/* Services */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    Services
                  </Text>
                  <Text
                    style={{
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.text,
                      fontWeight: theme.fontWeight.medium,
                    }}
                  >
                    {vehicle.serviceCount} completed
                  </Text>
                </View>
              </View>

              {/* Cost Breakdown Progress Bar */}
              <View style={{ marginTop: theme.spacing.sm }}>
                <Text
                  style={{
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Cost Breakdown
                </Text>
                <View
                  style={{
                    height: 8,
                    backgroundColor: theme.colors.border,
                    borderRadius: theme.borderRadius.sm,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${(vehicle.totalCost / sortedVehicles[0].totalCost) * 100}%`,
                      backgroundColor: theme.colors.analytics.cost,
                      borderRadius: theme.borderRadius.sm,
                    }}
                  />
                </View>
              </View>
            </View>
          ))}

          {/* Bottom spacing */}
          <View style={{ height: theme.spacing.xl }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
