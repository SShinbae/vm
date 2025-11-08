import React, { useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStyles } from 'react-native-unistyles';
import {
  MetricCard,
  PeriodSelector,
  VehicleFilter,
  EmptyAnalytics,
  AnalyticsHeader,
  UpcomingServiceCard,
} from '@/components/analytics';
import {
  useAnalyticsData,
  usePeriodSelector,
  useVehicleFilter,
} from '@/hooks/useAnalytics';

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
    [period, selectedVehicleIds]
  );

  const { loading, error, costMetrics, fuelMetrics, serviceMetrics, refetch } =
    useAnalyticsData(filters);

  const hasData =
    costMetrics &&
    (costMetrics.totalCost > 0 || fuelMetrics?.fuelUps || serviceMetrics?.totalServices);

  // Loading state
  if (loading || vehiclesLoading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: theme.fontSize.base, color: theme.colors.textSecondary }}>
          Loading analytics...
        </Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <EmptyAnalytics
          icon="alert-circle-outline"
          title="Error Loading Data"
          message="Failed to load analytics data. Please try again."
        />
      </SafeAreaView>
    );
  }

  // Empty state
  if (!hasData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
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
        <EmptyAnalytics />
      </SafeAreaView>
    );
  }

  const upcomingServices = serviceMetrics?.upcomingServices.slice(0, 3) || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AnalyticsHeader />
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
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

          {/* Summary Cards */}
          <Text
            style={{
              fontSize: theme.fontSize.xl,
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
              marginBottom: theme.spacing.md,
              marginTop: theme.spacing.lg,
            }}
          >
            Summary
          </Text>

          {/* First Row: Total Cost & Cost Per Km */}
          <View
            style={{
              flexDirection: 'row',
              gap: theme.spacing.md,
              marginBottom: theme.spacing.md,
            }}
          >
            <View style={{ flex: 1 }}>
              <MetricCard
                title="Total Cost"
                value={`RM${costMetrics?.totalCost.toFixed(2) || 0}`}
                subtitle={period.label}
                icon="cash-outline"
                color={theme.colors.analytics.cost}
              />
            </View>
            <View style={{ flex: 1 }}>
              <MetricCard
                title="Cost Per Km"
                value={`RM${costMetrics?.costPerKm.toFixed(2) || 0}`}
                subtitle="Average"
                icon="speedometer-outline"
                color={theme.colors.primary}
              />
            </View>
          </View>

          {/* Second Row: Fuel & Service Cost */}
          <View
            style={{
              flexDirection: 'row',
              gap: theme.spacing.md,
              marginBottom: theme.spacing.md,
            }}
          >
            <View style={{ flex: 1 }}>
              <MetricCard
                title="Fuel Cost"
                value={`RM${costMetrics?.totalFuelCost.toFixed(2) || 0}`}
                subtitle={`${fuelMetrics?.fuelUps || 0} fill-ups`}
                icon="water-outline"
                color={theme.colors.analytics.fuel}
              />
            </View>
            <View style={{ flex: 1 }}>
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
          <Text
            style={{
              fontSize: theme.fontSize.xl,
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
              flexDirection: 'row',
              gap: theme.spacing.md,
              marginBottom: theme.spacing.md,
            }}
          >
            {/* Avg Consumption */}
            <View
              style={{
                flex: 1,
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing.lg,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: theme.fontSize['2xl'],
                  fontWeight: theme.fontWeight.bold,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs,
                }}
              >
                {fuelMetrics?.averageConsumption.toFixed(1) || 0}
              </Text>
              <Text
                style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textSecondary,
                  textAlign: 'center',
                }}
              >
                L/100km
              </Text>
            </View>

            {/* Total Distance */}
            <View
              style={{
                flex: 1,
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing.lg,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: theme.fontSize['2xl'],
                  fontWeight: theme.fontWeight.bold,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs,
                }}
              >
                {fuelMetrics?.totalDistance.toFixed(0) || 0}
              </Text>
              <Text
                style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textSecondary,
                  textAlign: 'center',
                }}
              >
                km traveled
              </Text>
            </View>

            {/* Vehicle Count */}
            <View
              style={{
                flex: 1,
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.lg,
                padding: theme.spacing.lg,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: theme.fontSize['2xl'],
                  fontWeight: theme.fontWeight.bold,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs,
                }}
              >
                {vehicles.length > 0 ? vehicles.length : 0}
              </Text>
              <Text
                style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textSecondary,
                  textAlign: 'center',
                }}
              >
                vehicles
              </Text>
            </View>
          </View>

          {/* Upcoming Maintenance */}
          {upcomingServices.length > 0 && (
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
                Upcoming Maintenance
              </Text>
              {upcomingServices.map((service, index) => (
                <UpcomingServiceCard key={index} service={service} />
              ))}
            </>
          )}

          {/* Bottom spacing */}
          <View style={{ height: theme.spacing.xl }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
