import React, { useMemo } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MetricCard,
  PeriodSelector,
  VehicleFilter,
  EmptyAnalytics,
  AnalyticsHeader,
  TrendLineChart,
} from "../../../components/analytics";
import {
  useAnalyticsData,
  usePeriodSelector,
  useVehicleFilter,
  useAnalyticsTrends,
} from "../../../hooks/useAnalytics";

export default function FuelTab() {
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

  const { loading, error, fuelMetrics, costMetrics, refetch } =
    useAnalyticsData(filters);
  const { trendData, trendAnalysis } = useAnalyticsTrends(filters, "fuel");

  const hasData = fuelMetrics && fuelMetrics.fuelUps > 0;

  if (loading || vehiclesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <AnalyticsHeader />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading fuel analytics...</Text>
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
          message="Failed to load fuel analytics. Please try again."
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
          icon="water-outline"
          title="No Fuel Data"
          message="Start logging your fuel fill-ups to see analytics here."
        />
      </SafeAreaView>
    );
  }

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

          {/* Fuel Efficiency Metrics */}
          <Text style={styles.sectionTitle}>Fuel Efficiency</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCardWrapper}>
              <MetricCard
                title="Average Consumption"
                value={`${fuelMetrics.averageConsumption.toFixed(1)}`}
                subtitle="L/100km"
                icon="speedometer-outline"
                color={theme.colors.analytics.fuel}
                trend={trendAnalysis || undefined}
              />
            </View>
            <View style={styles.metricCardWrapper}>
              <MetricCard
                title="Total Distance"
                value={`${fuelMetrics.totalDistance.toFixed(0)}`}
                subtitle="kilometers"
                icon="navigate-outline"
                color={theme.colors.primary}
              />
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricCardWrapper}>
              <MetricCard
                title="Best Efficiency"
                value={`${fuelMetrics.bestEfficiency.toFixed(1)}`}
                subtitle="L/100km"
                icon="trophy-outline"
                color={theme.colors.success}
              />
            </View>
            <View style={styles.metricCardWrapper}>
              <MetricCard
                title="Worst Efficiency"
                value={`${fuelMetrics.worstEfficiency.toFixed(1)}`}
                subtitle="L/100km"
                icon="warning-outline"
                color={theme.colors.warning}
              />
            </View>
          </View>

          {/* Cost Metrics */}
          <Text style={styles.sectionTitle}>Fuel Costs</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCardWrapper}>
              <MetricCard
                title="Total Fuel Cost"
                value={`RM${costMetrics?.totalFuelCost.toFixed(2) || "0.00"}`}
                subtitle={period.label}
                icon="cash-outline"
                color={theme.colors.analytics.cost}
              />
            </View>
            <View style={styles.metricCardWrapper}>
              <MetricCard
                title="Average Price"
                value={`RM${fuelMetrics.averageFuelPrice.toFixed(2)}`}
                subtitle="per liter"
                icon="pricetag-outline"
                color={theme.colors.analytics.purple}
              />
            </View>
          </View>

          {/* Fill-up Stats */}
          <Text style={styles.sectionTitle}>Fill-up Statistics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{fuelMetrics.fuelUps}</Text>
              <Text style={styles.statLabel}>Total Fill-ups</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {fuelMetrics.totalLitersFilled.toFixed(0)}
              </Text>
              <Text style={styles.statLabel}>Liters Filled</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {fuelMetrics.fuelUps > 0
                  ? (fuelMetrics.totalDistance / fuelMetrics.fuelUps).toFixed(0)
                  : 0}
              </Text>
              <Text style={styles.statLabel}>km/fill-up</Text>
            </View>
          </View>

          {/* Trend Chart */}
          {trendData.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Efficiency Trend</Text>
              <TrendLineChart
                data={trendData}
                title="Fuel Consumption Over Time"
                yAxisLabel=""
                color={theme.colors.analytics.fuel}
              />
            </>
          )}

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
