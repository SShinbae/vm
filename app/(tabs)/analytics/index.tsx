import React, { useMemo } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MetricCard,
  PeriodSelector,
  VehicleFilter,
  EmptyAnalytics,
  TrendLineChart,
  UpcomingServiceCard,
  AnalyticsHeader,
} from "../../../components/analytics";
import {
  useAnalyticsData,
  usePeriodSelector,
  useVehicleFilter,
} from "../../../hooks/useAnalytics";

export default function OverviewTab() {
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

  const { loading, error, costMetrics, fuelMetrics, serviceMetrics, refetch } =
    useAnalyticsData(filters);

  const hasData =
    costMetrics &&
    (costMetrics.totalCost > 0 ||
      fuelMetrics?.fuelUps ||
      serviceMetrics?.totalServices);

  if (loading || vehiclesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading analytics...</Text>
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
          message="Failed to load analytics data. Please try again."
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
        <EmptyAnalytics />
      </SafeAreaView>
    );
  }

  const upcomingServices = serviceMetrics?.upcomingServices.slice(0, 3) || [];

  return (
    <SafeAreaView style={styles.container}>
      <AnalyticsHeader />
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

          {/* Summary Cards */}
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCardWrapper}>
              <MetricCard
                title="Total Cost"
                value={`RM${costMetrics?.totalCost.toFixed(2) || 0}`}
                subtitle={period.label}
                icon="cash-outline"
                color={theme.colors.analytics.cost}
              />
            </View>
            <View style={styles.metricCardWrapper}>
              <MetricCard
                title="Cost Per Km"
                value={`RM${costMetrics?.costPerKm.toFixed(2) || 0}`}
                subtitle="Average"
                icon="speedometer-outline"
                color={theme.colors.primary}
              />
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricCardWrapper}>
              <MetricCard
                title="Fuel Cost"
                value={`RM${costMetrics?.totalFuelCost.toFixed(2) || 0}`}
                subtitle={`${fuelMetrics?.fuelUps || 0} fill-ups`}
                icon="water-outline"
                color={theme.colors.analytics.fuel}
              />
            </View>
            <View style={styles.metricCardWrapper}>
              <MetricCard
                title="Service Cost"
                value={`RM${costMetrics?.totalServiceCost.toFixed(2) || 0}`}
                subtitle={`${serviceMetrics?.totalServices || 0} services`}
                icon="build-outline"
                color={theme.colors.analytics.service}
              />
            </View>
          </View>

          {/* Quick Stats */}
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {fuelMetrics?.averageConsumption.toFixed(1) || 0}
              </Text>
              <Text style={styles.statLabel}>L/100km</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {fuelMetrics?.totalDistance.toFixed(0) || 0}
              </Text>
              <Text style={styles.statLabel}>km traveled</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {vehicles.length > 0 ? vehicles.length : 0}
              </Text>
              <Text style={styles.statLabel}>vehicles</Text>
            </View>
          </View>

          {/* Upcoming Maintenance */}
          {upcomingServices.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Upcoming Maintenance</Text>
              {upcomingServices.map((service, index) => (
                <UpcomingServiceCard key={index} service={service} />
              ))}
            </>
          )}

          {/* Monthly Trend - we'll add this when we have trend data */}
          {/* Placeholder for now */}
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
  metricsGrid: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  metricCardWrapper: {
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: "center",
  },
  statValue: {
    fontSize: theme.fontSize["2xl"],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  spacing: {
    height: theme.spacing.xl,
  },
}));
