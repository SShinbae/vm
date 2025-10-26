import React, { useMemo } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  PeriodSelector,
  VehicleFilter,
  EmptyAnalytics,
  AnalyticsHeader,
} from "../../../components/analytics";
import {
  useAnalyticsData,
  usePeriodSelector,
  useVehicleFilter,
} from "../../../hooks/useAnalytics";

export default function PerformanceTab() {
  const { styles, theme } = useStyles(stylesheet);
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

  if (loading || vehiclesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <AnalyticsHeader />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading vehicle performance...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyAnalytics
          icon="alert-circle-outline"
          title="Error Loading Data"
          message="Failed to load vehicle performance data. Please try again."
        />
      </SafeAreaView>
    );
  }

  if (!hasData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.filtersContainer}>
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
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Filters */}
          <View style={styles.filtersContainer}>
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
              <Text style={styles.sectionTitle}>Highlights</Text>
              <View style={styles.highlightsRow}>
                <View style={styles.highlightCard}>
                  <Text style={styles.highlightLabel}>Most Efficient</Text>
                  <Text style={styles.highlightVehicle} numberOfLines={1}>
                    {mostEfficient.vehicleName}
                  </Text>
                  <Text style={styles.highlightValue}>
                    {mostEfficient.fuelEfficiency.toFixed(1)} L/100km
                  </Text>
                </View>
                <View style={styles.highlightCard}>
                  <Text style={styles.highlightLabel}>Least Efficient</Text>
                  <Text style={styles.highlightVehicle} numberOfLines={1}>
                    {leastEfficient.vehicleName}
                  </Text>
                  <Text style={styles.highlightValue}>
                    {leastEfficient.fuelEfficiency.toFixed(1)} L/100km
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Vehicle Comparison Table */}
          <Text style={styles.sectionTitle}>Vehicle Comparison</Text>
          {sortedVehicles.map((vehicle, index) => (
            <View key={vehicle.vehicleId} style={styles.vehicleCard}>
              <View style={styles.vehicleHeader}>
                <View style={styles.vehicleRank}>
                  <Text style={styles.rankNumber}>#{index + 1}</Text>
                </View>
                <Text style={styles.vehicleName} numberOfLines={1}>
                  {vehicle.vehicleName}
                </Text>
              </View>

              <View style={styles.vehicleMetrics}>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Total Cost</Text>
                  <Text style={styles.metricValue}>
                    RM{vehicle.totalCost.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Cost per km</Text>
                  <Text style={styles.metricValue}>
                    RM{vehicle.costPerKm.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Fuel Efficiency</Text>
                  <Text style={styles.metricValue}>
                    {vehicle.fuelEfficiency.toFixed(1)} L/100km
                  </Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Distance Traveled</Text>
                  <Text style={styles.metricValue}>
                    {vehicle.totalDistance.toFixed(0)} km
                  </Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Services</Text>
                  <Text style={styles.metricValue}>
                    {vehicle.serviceCount} completed
                  </Text>
                </View>
              </View>

              {/* Cost breakdown bar */}
              <View style={styles.costBreakdown}>
                <Text style={styles.costBreakdownLabel}>Cost Breakdown</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(vehicle.totalCost / sortedVehicles[0].totalCost) * 100}%`,
                        backgroundColor: theme.colors.analytics.cost,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          ))}

          <View style={styles.spacing} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
  },
  filtersContainer: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  highlightsRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  highlightCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: "center",
  },
  highlightLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    marginBottom: theme.spacing.xs,
  },
  highlightVehicle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.xs,
    textAlign: "center",
  },
  highlightValue: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
  vehicleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  vehicleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  vehicleRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  rankNumber: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  vehicleName: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  vehicleMetrics: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  metricValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  costBreakdown: {
    marginTop: theme.spacing.sm,
  },
  costBreakdownLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: theme.borderRadius.sm,
  },
  spacing: {
    height: theme.spacing.xl,
  },
}));
