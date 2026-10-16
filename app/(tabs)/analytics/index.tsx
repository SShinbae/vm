import { AnalyticsMobileSummary } from "@/components/analytics/AnalyticsMobileSummary";
import {
  CostBreakdownCard,
  EmptyAnalytics,
  InsightsStrip,
  MetricCard,
  LazyCostLineChart,
  OverviewCostChart,
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
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { getPreviousPeriod } from "@/lib/analytics/calculations";
import { calculateDelta, generateInsights } from "@/lib/analytics/overview";
import React, { useMemo, useState } from "react";
import { RefreshControl, ScrollView, Switch, Text, View } from "react-native";
import { useStyles } from "react-native-unistyles";

export default function OverviewTab() {
  const { theme } = useStyles();
  const { isWeb, isMobile, isTablet } = useResponsiveLayout();
  const isWebPage = isWeb && !isMobile;
  const [compare, setCompare] = useState(false);
  const comparing = compare && isWebPage;
  const { period, setPeriod, periods } = usePeriodSelector();
  const {
    vehicles,
    selectedVehicleIds,
    toggleVehicle,
    selectAll,
    clearAll,
    loading: vehiclesLoading,
    error: vehiclesError,
    refetch: refetchVehicles,
  } = useVehicleFilter();

  const filters = useMemo(
    () => ({
      period,
      vehicleIds: selectedVehicleIds,
    }),
    [period, selectedVehicleIds],
  );

  const {
    loading,
    error,
    costMetrics,
    fuelMetrics,
    serviceMetrics,
    chartDataset,
    refetch,
  } = useAnalyticsData(filters);

  const previousFilters = useMemo(
    () => ({ ...filters, period: getPreviousPeriod(period) }),
    [filters, period],
  );
  const previous = useAnalyticsData(previousFilters, comparing);
  const series = chartDataset?.data ?? [];

  const hasData =
    costMetrics &&
    (costMetrics.totalCost > 0 ||
      fuelMetrics?.fuelUps ||
      serviceMetrics?.totalServices);

  if (!isWebPage) {
    return (
      <AnalyticsMobileSummary
        costMetrics={costMetrics}
        fuelMetrics={fuelMetrics}
        serviceMetrics={serviceMetrics}
        chartDataset={chartDataset}
        loading={loading || vehiclesLoading}
        error={error || vehiclesError}
        onRefresh={() => {
          void refetch();
          void refetchVehicles();
        }}
      />
    );
  }

  // Loading state
  if (loading || vehiclesLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <SkeletonAnalytics />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView style={{ flex: 1 }}>
          <View
            style={{
              paddingHorizontal: isMobile ? theme.spacing.lg : theme.spacing.xl,
              paddingVertical: isMobile ? theme.spacing.md : theme.spacing.lg,
              ...(isWebPage && { display: "none" }),
            }}
          >
            <Text
              style={{
                fontSize: isMobile
                  ? theme.fontSize["2xl"]
                  : isTablet
                    ? theme.fontSize["2xl"]
                    : theme.fontSize["3xl"],
                fontWeight: theme.fontWeight.bold,
                color: theme.colors.text,
                marginBottom: theme.spacing.xs,
              }}
            >
              Analytics
            </Text>
            <Text
              style={{
                fontSize: isMobile ? theme.fontSize.sm : theme.fontSize.base,
                color: theme.colors.textSecondary,
              }}
            >
              Track costs, fuel, and maintenance
            </Text>
          </View>
          <View
            style={{
              padding: theme.spacing.lg,
              ...(isWebPage && {
                paddingHorizontal: theme.spacing.xl,
                paddingTop: 0,
              }),
            }}
          >
            <EmptyAnalytics
              icon="alert-circle-outline"
              title="Error Loading Data"
              message="Failed to load analytics data. Please try again."
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  // Empty state
  if (!hasData) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView style={{ flex: 1 }}>
          <View
            style={{
              paddingHorizontal: isMobile ? theme.spacing.lg : theme.spacing.xl,
              paddingVertical: isMobile ? theme.spacing.md : theme.spacing.lg,
              ...(isWebPage && { display: "none" }),
            }}
          >
            <Text
              style={{
                fontSize: isMobile
                  ? theme.fontSize["2xl"]
                  : isTablet
                    ? theme.fontSize["2xl"]
                    : theme.fontSize["3xl"],
                fontWeight: theme.fontWeight.bold,
                color: theme.colors.text,
                marginBottom: theme.spacing.xs,
              }}
            >
              Analytics
            </Text>
            <Text
              style={{
                fontSize: isMobile ? theme.fontSize.sm : theme.fontSize.base,
                color: theme.colors.textSecondary,
              }}
            >
              Track costs, fuel, and maintenance
            </Text>
          </View>
          <View
            style={{
              padding: theme.spacing.lg,
              ...(isWebPage && {
                paddingHorizontal: theme.spacing.xl,
                paddingTop: 0,
              }),
            }}
          >
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
      </View>
    );
  }

  const delta = (cur?: number, prev?: number | null) => {
    const d = comparing && cur != null ? calculateDelta(cur, prev) : null;
    return d ? { direction: d.direction, percentage: d.pct } : undefined;
  };
  const insights = generateInsights({
    fuelMetrics,
    previousFuelMetrics: comparing ? previous.fuelMetrics : null,
    serviceMetrics,
    series,
  });

  const upcomingServices = serviceMetrics?.upcomingServices.slice(0, 3) || [];

  // Calculate selected vehicle count
  const isAllSelected = selectedVehicleIds.length === 0;
  const selectedVehicleCount = isAllSelected
    ? vehicles.length
    : selectedVehicleIds.length;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              refetch();
              if (comparing) previous.refetch();
            }}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: isMobile ? theme.spacing.lg : theme.spacing.xl,
            paddingVertical: isMobile ? theme.spacing.md : theme.spacing.lg,
            ...(isWebPage && { display: "none" }),
            backgroundColor: theme.colors.background,
          }}
        >
          <Text
            style={{
              fontSize: isMobile
                ? theme.fontSize["2xl"]
                : isTablet
                  ? theme.fontSize["2xl"]
                  : theme.fontSize["3xl"],
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
              marginBottom: theme.spacing.xs,
            }}
          >
            Analytics
          </Text>
          <Text
            style={{
              fontSize: isMobile ? theme.fontSize.sm : theme.fontSize.base,
              color: theme.colors.textSecondary,
            }}
          >
            Track costs, fuel, and maintenance
          </Text>
        </View>

        <View
          style={{
            padding: theme.spacing.lg,
            ...(isWebPage && {
              paddingHorizontal: theme.spacing.xl,
              paddingTop: 0,
            }),
          }}
        >
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
          {isWebPage && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.sm,
                marginTop: theme.spacing.sm,
              }}
            >
              <Switch
                value={compare}
                onValueChange={setCompare}
                accessibilityLabel="Compare with previous period"
              />
              <Text
                style={{
                  color: theme.colors.text,
                  fontSize: theme.fontSize.sm,
                }}
              >
                Compare with previous period
              </Text>
            </View>
          )}

          {/* Summary Section */}
          {isWebPage ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                gap: theme.spacing.md,
                marginTop: theme.spacing.md,
                marginBottom: theme.spacing.sm,
              }}
            >
              <Text
                style={{
                  fontSize: theme.fontSize.xl,
                  fontWeight: theme.fontWeight.bold,
                  color: theme.colors.text,
                }}
              >
                Summary
              </Text>
              <Text
                style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textSecondary,
                }}
              >
                Key metrics for the selected vehicle in the last {period.label}
              </Text>
            </View>
          ) : (
            <Text
              style={{
                fontSize: isMobile
                  ? theme.fontSize.xl
                  : isTablet
                    ? theme.fontSize.xl
                    : theme.fontSize["2xl"],
                fontWeight: theme.fontWeight.bold,
                color: theme.colors.text,
                marginBottom: isMobile ? theme.spacing.sm : theme.spacing.md,
                marginTop: isMobile ? theme.spacing.md : theme.spacing.lg,
              }}
            >
              Summary
            </Text>
          )}

          {/* Metric Cards Grid */}
          <View
            style={{
              gap: isMobile ? theme.spacing.sm : theme.spacing.md,
              marginBottom: theme.spacing.md,
            }}
          >
            <View
              style={{
                flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? theme.spacing.sm : theme.spacing.md,
              }}
            >
              <View style={{ flex: 1 }}>
                <MetricCard
                  title="Total Cost"
                  value={`RM${costMetrics?.totalCost.toFixed(2) || 0}`}
                  subtitle={period.label}
                  icon="cash-outline"
                  trend={delta(
                    costMetrics?.totalCost,
                    previous.costMetrics?.totalCost,
                  )}
                  sparkline={series.map((s) => s.totalCost)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <MetricCard
                  title="Cost Per Km"
                  value={`RM${costMetrics?.costPerKm.toFixed(2) || 0}`}
                  subtitle="Average"
                  icon="speedometer-outline"
                  trend={delta(
                    costMetrics?.costPerKm,
                    previous.costMetrics?.costPerKm,
                  )}
                />
              </View>
            </View>

            <View
              style={{
                flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? theme.spacing.sm : theme.spacing.md,
              }}
            >
              <View style={{ flex: 1 }}>
                <MetricCard
                  title="Fuel Cost"
                  value={`RM${costMetrics?.totalFuelCost.toFixed(2) || 0}`}
                  subtitle={`${fuelMetrics?.fuelUps || 0} fill-ups`}
                  icon="water-outline"
                  trend={delta(
                    costMetrics?.totalFuelCost,
                    previous.costMetrics?.totalFuelCost,
                  )}
                  sparkline={series.map((s) => s.fuelCost)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <MetricCard
                  title="Service Cost"
                  value={`RM${costMetrics?.totalServiceCost.toFixed(2) || 0}`}
                  subtitle={`${serviceMetrics?.totalServices || 0} services`}
                  icon="build-outline"
                  trend={delta(
                    costMetrics?.totalServiceCost,
                    previous.costMetrics?.totalServiceCost,
                  )}
                  sparkline={series.map((s) => s.serviceCost)}
                />
              </View>
            </View>
          </View>

          {/* Cost Breakdown Section */}
          <Text
            style={{
              fontSize: isMobile
                ? theme.fontSize.xl
                : isTablet
                  ? theme.fontSize.xl
                  : theme.fontSize["2xl"],
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
              marginBottom: isMobile ? theme.spacing.sm : theme.spacing.md,
              marginTop: isMobile ? theme.spacing.md : theme.spacing.lg,
            }}
          >
            Cost Breakdown
          </Text>
          {isWebPage ? (
            <View
              style={{
                flexDirection: "row",
                gap: theme.spacing.lg,
                alignItems: "flex-start",
              }}
            >
              <View style={{ flex: 2 }}>
                <OverviewCostChart
                  data={series}
                  previous={comparing ? previous.chartDataset?.data : undefined}
                />
              </View>
              <View style={{ flex: 1 }}>
                <InsightsStrip insights={insights} />
              </View>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              <LazyCostLineChart
                title="Cost trends over time"
                data={series}
                height={240}
              />
              <CostBreakdownCard
                totalCost={costMetrics?.totalCost || 0}
                fuelCost={costMetrics?.totalFuelCost || 0}
                serviceCost={costMetrics?.totalServiceCost || 0}
              />
            </View>
          )}

          {/* Quick Stats Section */}
          {isWebPage ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                gap: theme.spacing.md,
                marginTop: theme.spacing.md,
                marginBottom: theme.spacing.sm,
              }}
            >
              <Text
                style={{
                  fontSize: theme.fontSize.xl,
                  fontWeight: theme.fontWeight.bold,
                  color: theme.colors.text,
                }}
              >
                Quick Stats
              </Text>
              <Text
                style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textSecondary,
                }}
              >
                Additional insights for the selected vehicle
              </Text>
            </View>
          ) : (
            <Text
              style={{
                fontSize: isMobile
                  ? theme.fontSize.xl
                  : isTablet
                    ? theme.fontSize.xl
                    : theme.fontSize["2xl"],
                fontWeight: theme.fontWeight.bold,
                color: theme.colors.text,
                marginBottom: isMobile ? theme.spacing.sm : theme.spacing.md,
                marginTop: isMobile ? theme.spacing.md : theme.spacing.lg,
              }}
            >
              Quick Stats
            </Text>
          )}
          <View
            style={{
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? theme.spacing.sm : theme.spacing.md,
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
                  fontSize: isMobile
                    ? theme.fontSize.xl
                    : isTablet
                      ? theme.fontSize.xl
                      : theme.fontSize["2xl"],
                  fontWeight: theme.fontWeight.bold,
                  color: theme.colors.text,
                  marginBottom: isMobile ? theme.spacing.sm : theme.spacing.md,
                  marginTop: isMobile ? theme.spacing.md : theme.spacing.lg,
                }}
              >
                Upcoming Maintenance
              </Text>
              <View
                style={{ gap: isMobile ? theme.spacing.sm : theme.spacing.md }}
              >
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
    </View>
  );
}
