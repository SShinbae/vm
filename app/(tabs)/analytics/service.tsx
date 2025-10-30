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
  UpcomingServiceCard,
} from "../../../components/analytics";
import {
  useAnalyticsData,
  usePeriodSelector,
  useVehicleFilter,
  useAnalyticsTrends,
} from "../../../hooks/useAnalytics";

export default function ServiceTab() {
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

  const { loading, error, serviceMetrics, costMetrics, refetch } =
    useAnalyticsData(filters);
  const { trendData } = useAnalyticsTrends(filters, "service");

  const hasData = serviceMetrics && serviceMetrics.totalServices > 0;

  if (loading || vehiclesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <AnalyticsHeader />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading service analytics...</Text>
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
          message="Failed to load service analytics. Please try again."
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
          icon="build-outline"
          title="No Service Data"
          message="Start logging your vehicle services to see analytics here."
        />
      </SafeAreaView>
    );
  }

  const formatServiceType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Get top 3 service types by count
  const topServiceTypes = Object.entries(serviceMetrics.servicesByType)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

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

          {/* Service Overview */}
          <Text style={styles.sectionTitle}>Service Overview</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCardWrapper}>
              <MetricCard
                title="Total Services"
                value={serviceMetrics.totalServices}
                subtitle={period.label}
                icon="construct-outline"
                color={theme.colors.analytics.service}
              />
            </View>
            <View style={styles.metricCardWrapper}>
              <MetricCard
                title="Total Cost"
                value={`RM${costMetrics?.totalServiceCost.toFixed(2) || 0}`}
                subtitle={period.label}
                icon="cash-outline"
                color={theme.colors.analytics.cost}
              />
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricCardWrapper}>
              <MetricCard
                title="Average Cost"
                value={`RM${costMetrics?.averageServiceCost.toFixed(2) || 0}`}
                subtitle="per service"
                icon="calculator-outline"
                color={theme.colors.analytics.purple}
              />
            </View>
            <View style={styles.metricCardWrapper}>
              <MetricCard
                title="Service Interval"
                value={`${serviceMetrics.averageServiceInterval.toFixed(0)}`}
                subtitle="km average"
                icon="git-compare-outline"
                color={theme.colors.analytics.teal}
              />
            </View>
          </View>

          {/* Top Service Types */}
          <Text style={styles.sectionTitle}>Most Frequent Services</Text>
          <View style={styles.serviceTypesList}>
            {topServiceTypes.map(([type, count]) => {
              const cost =
                serviceMetrics.costByServiceType[
                  type as keyof typeof serviceMetrics.costByServiceType
                ];
              return (
                <View key={type} style={styles.serviceTypeCard}>
                  <View style={styles.serviceTypeHeader}>
                    <Text style={styles.serviceTypeName}>
                      {formatServiceType(type)}
                    </Text>
                    <Text style={styles.serviceTypeCount}>{count}x</Text>
                  </View>
                  <Text style={styles.serviceTypeCost}>
                    RM{cost.toFixed(2)} total
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Upcoming Services */}
          {serviceMetrics.upcomingServices.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Upcoming Maintenance</Text>
              {serviceMetrics.upcomingServices.map((service, index) => (
                <UpcomingServiceCard key={index} service={service} />
              ))}
            </>
          )}

          {/* Trend Chart */}
          {trendData.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Service Frequency</Text>
              <TrendLineChart
                data={trendData}
                title="Services Per Month"
                color={theme.colors.analytics.service}
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
  serviceTypesList: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  serviceTypeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.analytics.service,
  },
  serviceTypeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  serviceTypeName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  serviceTypeCount: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.analytics.service,
  },
  serviceTypeCost: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  spacing: {
    height: theme.spacing.xl,
  },
}));
