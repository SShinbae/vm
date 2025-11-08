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
  TrendLineChart,
  UpcomingServiceCard,
} from '@/components/analytics';
import {
  useAnalyticsData,
  usePeriodSelector,
  useVehicleFilter,
  useAnalyticsTrends,
} from '@/hooks/useAnalytics';

export default function ServiceTab() {
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

  const { loading, error, serviceMetrics, costMetrics, refetch } = useAnalyticsData(filters);
  const { trendData } = useAnalyticsTrends(filters, 'service');

  const hasData = serviceMetrics && serviceMetrics.totalServices > 0;

  // Loading state
  if (loading || vehiclesLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <AnalyticsHeader />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: theme.fontSize.base, color: theme.colors.textSecondary }}>
            Loading service analytics...
          </Text>
        </View>
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
          message="Failed to load service analytics. Please try again."
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
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get top 3 service types by count
  const topServiceTypes = Object.entries(serviceMetrics.servicesByType)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
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

          {/* Service Overview */}
          <Text
            style={{
              fontSize: theme.fontSize.xl,
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
              marginBottom: theme.spacing.md,
              marginTop: theme.spacing.lg,
            }}
          >
            Service Overview
          </Text>

          {/* First Row: Total Services & Total Cost */}
          <View
            style={{
              flexDirection: 'row',
              gap: theme.spacing.md,
              marginBottom: theme.spacing.md,
            }}
          >
            <View style={{ flex: 1 }}>
              <MetricCard
                title="Total Services"
                value={serviceMetrics.totalServices}
                subtitle={period.label}
                icon="construct-outline"
                color={theme.colors.analytics.service}
              />
            </View>
            <View style={{ flex: 1 }}>
              <MetricCard
                title="Total Cost"
                value={`RM${costMetrics?.totalServiceCost.toFixed(2) || 0}`}
                subtitle={period.label}
                icon="cash-outline"
                color={theme.colors.analytics.cost}
              />
            </View>
          </View>

          {/* Second Row: Average Cost & Service Interval */}
          <View
            style={{
              flexDirection: 'row',
              gap: theme.spacing.md,
              marginBottom: theme.spacing.md,
            }}
          >
            <View style={{ flex: 1 }}>
              <MetricCard
                title="Average Cost"
                value={`RM${costMetrics?.averageServiceCost.toFixed(2) || 0}`}
                subtitle="per service"
                icon="calculator-outline"
                color={theme.colors.analytics.purple}
              />
            </View>
            <View style={{ flex: 1 }}>
              <MetricCard
                title="Service Interval"
                value={`${serviceMetrics.averageServiceInterval.toFixed(0)}`}
                subtitle="km average"
                icon="git-compare-outline"
                color={theme.colors.analytics.teal}
              />
            </View>
          </View>

          {/* Most Frequent Services */}
          <Text
            style={{
              fontSize: theme.fontSize.xl,
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
              marginBottom: theme.spacing.md,
              marginTop: theme.spacing.lg,
            }}
          >
            Most Frequent Services
          </Text>

          <View style={{ gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
            {topServiceTypes.map(([type, count]) => {
              const cost =
                serviceMetrics.costByServiceType[
                  type as keyof typeof serviceMetrics.costByServiceType
                ];
              return (
                <View
                  key={type}
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.lg,
                    padding: theme.spacing.lg,
                    borderLeftWidth: 4,
                    borderLeftColor: theme.colors.analytics.service,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: theme.spacing.xs,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: theme.fontSize.base,
                        fontWeight: theme.fontWeight.bold,
                        color: theme.colors.text,
                      }}
                    >
                      {formatServiceType(type)}
                    </Text>
                    <Text
                      style={{
                        fontSize: theme.fontSize.lg,
                        fontWeight: theme.fontWeight.bold,
                        color: theme.colors.analytics.service,
                      }}
                    >
                      {count}x
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    RM{cost.toFixed(2)} total
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Upcoming Maintenance */}
          {serviceMetrics.upcomingServices.length > 0 && (
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
              {serviceMetrics.upcomingServices.map((service, index) => (
                <UpcomingServiceCard key={index} service={service} />
              ))}
            </>
          )}

          {/* Trend Chart */}
          {trendData.length > 0 && (
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
                Service Frequency
              </Text>
              <TrendLineChart
                data={trendData}
                title="Services Per Month"
                color={theme.colors.analytics.service}
              />
            </>
          )}

          {/* Bottom spacing */}
          <View style={{ height: theme.spacing.xl }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
