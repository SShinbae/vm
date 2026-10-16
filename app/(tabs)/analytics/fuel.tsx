import { AnalyticsMobilePage } from "@/components/analytics/AnalyticsMobilePage";
import { AnalyticsCompactState } from "@/components/analytics/AnalyticsCompactState";
import {
  EmptyAnalytics,
  MetricCard,
  StatCard,
  PeriodSelector,
  LazyTrendLineChart,
  VehicleFilter,
} from "@/components/analytics";
import {
  useAnalyticsData,
  useAnalyticsTrends,
  usePeriodSelector,
  useVehicleFilter,
} from "@/hooks/useAnalytics";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import React, { useMemo } from "react";
import { ResponsiveGrid } from "@/components/layout/ResponsiveGrid";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useStyles } from "react-native-unistyles";

export default function FuelTab() {
  const { theme } = useStyles();
  const { isWeb, isMobile, isTablet } = useResponsiveLayout();
  const isWebPage = isWeb && !isMobile;
  const { period, setPeriod, periods } = usePeriodSelector();
  const {
    vehicles,
    selectedVehicleIds,
    toggleVehicle,
    selectAll,
    clearAll,
    loading: vehiclesLoading,
    error: vehiclesError,
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
  const {
    trendData,
    loading: trendLoading,
    error: trendError,
    refetch: refetchTrends,
  } = useAnalyticsTrends(filters, "fuel");

  const hasData = fuelMetrics && fuelMetrics.fuelUps > 0;

  if (isWebPage) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.xl,
            paddingBottom: theme.spacing.xl,
          }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => {
                void refetch();
                void refetchTrends();
              }}
            />
          }
        >
          <View style={{ marginBottom: theme.spacing.lg }}>
            <VehicleFilter
              vehicles={vehicles}
              selectedVehicleIds={selectedVehicleIds}
              onToggleVehicle={toggleVehicle}
              onSelectAll={selectAll}
              onClearAll={clearAll}
              periodControl={
                <PeriodSelector
                  selectedPeriod={period}
                  onPeriodChange={setPeriod}
                  periods={periods}
                  placement="toolbar"
                  onCustomRangeSelect={(startDate, endDate) =>
                    setPeriod({
                      label: `${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}`,
                      days: Math.ceil(
                        (endDate.getTime() - startDate.getTime()) / 86400000,
                      ),
                      startDate,
                      endDate,
                    })
                  }
                />
              }
            />
          </View>
          {loading || vehiclesLoading ? (
            <Text
              style={{
                color: theme.colors.textSecondary,
                padding: theme.spacing.lg,
              }}
            >
              Loading fuel analytics...
            </Text>
          ) : error ? (
            <EmptyAnalytics
              icon="alert-circle-outline"
              title="Error Loading Data"
              message="Failed to load fuel analytics. Please try again."
            />
          ) : !hasData ? (
            <EmptyAnalytics
              icon="water-outline"
              title="No Fuel Data"
              message="Start logging your fuel fill-ups to see analytics here."
            />
          ) : (
            <>
              <ResponsiveGrid
                columns={{ tablet: 2, desktop: 3, largeDesktop: 3 }}
                spacing={theme.spacing.md}
                style={{ marginBottom: theme.spacing.sm }}
              >
                <MetricCard
                  title="Total Fuel Cost"
                  value={`RM${costMetrics?.totalFuelCost.toFixed(2) || "0.00"}`}
                  subtitle={period.label}
                  icon="cash-outline"
                  color={theme.colors.analytics.cost}
                />
                <MetricCard
                  title="Average Consumption"
                  value={fuelMetrics.averageConsumption.toFixed(1)}
                  subtitle="L/100km"
                  icon="speedometer-outline"
                  color={theme.colors.analytics.fuel}
                />
                <MetricCard
                  title="Total Fill-ups"
                  value={fuelMetrics.fuelUps}
                  subtitle={period.label}
                  icon="water-outline"
                  color={theme.colors.analytics.fuel}
                />
              </ResponsiveGrid>
              <LazyTrendLineChart
                data={trendData}
                title="Fuel Consumption Over Time (L/100km)"
                color={theme.colors.analytics.fuel}
                height={280}
              />
              <Text
                style={{
                  fontSize: theme.fontSize.xl,
                  fontWeight: theme.fontWeight.bold,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.md,
                }}
              >
                Fuel Statistics
              </Text>
              <ResponsiveGrid
                columns={{ tablet: 2, desktop: 3, largeDesktop: 3 }}
                spacing={theme.spacing.md}
              >
                <StatCard
                  value={`${fuelMetrics.totalDistance.toFixed(0)} km`}
                  label="Total Distance"
                />
                <StatCard
                  value={`${fuelMetrics.totalLitersFilled.toFixed(0)} L`}
                  label="Liters Filled"
                />
                <StatCard
                  value={`RM${fuelMetrics.averageFuelPrice.toFixed(2)}`}
                  label="Average Price per Liter"
                />
                <StatCard
                  value={`${fuelMetrics.bestEfficiency.toFixed(1)} L/100km`}
                  label="Best Efficiency"
                />
                <StatCard
                  value={`${fuelMetrics.worstEfficiency.toFixed(1)} L/100km`}
                  label="Worst Efficiency"
                />
                <StatCard
                  value={`${(fuelMetrics.totalDistance / fuelMetrics.fuelUps).toFixed(0)} km`}
                  label="Distance per Fill-up"
                />
              </ResponsiveGrid>
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  if (
    loading ||
    vehiclesLoading ||
    trendLoading ||
    error ||
    trendError ||
    vehiclesError ||
    !hasData
  ) {
    return (
      <AnalyticsCompactState
        title="Fuel Analytics"
        subtitle="Track fuel costs and efficiency"
        loading={loading || vehiclesLoading || trendLoading}
        error={error || trendError || vehiclesError}
        onRetry={() => {
          void refetch();
          void refetchTrends();
        }}
      />
    );
  }

  return (
    <AnalyticsMobilePage
      title="Fuel Analytics"
      subtitle="Track fuel consumption and efficiency"
      refreshing={loading}
      onRefresh={() => {
        void refetch();
        void refetchTrends();
      }}
    >
      {/* Fuel Efficiency Metrics */}
      <Text
        style={{
          fontSize: isMobile
            ? theme.fontSize.lg
            : isTablet
              ? theme.fontSize.lg
              : theme.fontSize.xl,
          fontWeight: theme.fontWeight.bold,
          color: theme.colors.text,
          marginBottom: isMobile ? theme.spacing.sm : theme.spacing.md,
          marginTop: isMobile ? theme.spacing.md : theme.spacing.lg,
        }}
      >
        Fuel Efficiency
      </Text>

      {/* First Row: Avg Consumption & Total Distance */}
      <View
        style={{
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? theme.spacing.sm : theme.spacing.md,
          marginBottom: theme.spacing.md,
        }}
      >
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Average Consumption"
            value={`${fuelMetrics.averageConsumption.toFixed(1)}`}
            subtitle="L/100km"
            icon="speedometer-outline"
            color={theme.colors.analytics.fuel}
          />
        </View>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Total Distance"
            value={`${fuelMetrics.totalDistance.toFixed(0)}`}
            subtitle="kilometers"
            icon="navigate-outline"
            color={theme.colors.primary}
          />
        </View>
      </View>

      {/* Second Row: Best & Worst Efficiency */}
      <View
        style={{
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? theme.spacing.sm : theme.spacing.md,
          marginBottom: theme.spacing.md,
        }}
      >
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Best Efficiency"
            value={`${fuelMetrics.bestEfficiency.toFixed(1)}`}
            subtitle="L/100km"
            icon="trophy-outline"
            color={theme.colors.success}
          />
        </View>
        <View style={{ flex: 1 }}>
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
      <Text
        style={{
          fontSize: isMobile
            ? theme.fontSize.lg
            : isTablet
              ? theme.fontSize.lg
              : theme.fontSize.xl,
          fontWeight: theme.fontWeight.bold,
          color: theme.colors.text,
          marginBottom: isMobile ? theme.spacing.sm : theme.spacing.md,
          marginTop: isMobile ? theme.spacing.md : theme.spacing.lg,
        }}
      >
        Fuel Costs
      </Text>

      {/* Third Row: Total Cost & Avg Price */}
      <View
        style={{
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? theme.spacing.sm : theme.spacing.md,
          marginBottom: theme.spacing.md,
        }}
      >
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Total Fuel Cost"
            value={`RM${costMetrics?.totalFuelCost.toFixed(2) || "0.00"}`}
            subtitle={period.label}
            icon="cash-outline"
            color={theme.colors.analytics.cost}
          />
        </View>
        <View style={{ flex: 1 }}>
          <MetricCard
            title="Average Price"
            value={`RM${fuelMetrics.averageFuelPrice.toFixed(2)}`}
            subtitle="per liter"
            icon="pricetag-outline"
            color={theme.colors.analytics.purple}
          />
        </View>
      </View>

      {/* Fill-up Statistics */}
      <Text
        style={{
          fontSize: isMobile
            ? theme.fontSize.lg
            : isTablet
              ? theme.fontSize.lg
              : theme.fontSize.xl,
          fontWeight: theme.fontWeight.bold,
          color: theme.colors.text,
          marginBottom: isMobile ? theme.spacing.sm : theme.spacing.md,
          marginTop: isMobile ? theme.spacing.md : theme.spacing.lg,
        }}
      >
        Fill-up Statistics
      </Text>
      <View
        style={{
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? theme.spacing.sm : theme.spacing.md,
          marginBottom: theme.spacing.md,
        }}
      >
        {/* Total Fill-ups */}
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
              fontSize: isMobile ? theme.fontSize.xl : theme.fontSize["2xl"],
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
              marginBottom: theme.spacing.xs,
            }}
          >
            {fuelMetrics.fuelUps}
          </Text>
          <Text
            style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
              textAlign: "center",
            }}
          >
            Total Fill-ups
          </Text>
        </View>

        {/* Liters Filled */}
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
              fontSize: isMobile ? theme.fontSize.xl : theme.fontSize["2xl"],
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
              marginBottom: theme.spacing.xs,
            }}
          >
            {fuelMetrics.totalLitersFilled.toFixed(0)}
          </Text>
          <Text
            style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
              textAlign: "center",
            }}
          >
            Liters Filled
          </Text>
        </View>

        {/* km/fill-up */}
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
              fontSize: isMobile ? theme.fontSize.xl : theme.fontSize["2xl"],
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
              marginBottom: theme.spacing.xs,
            }}
          >
            {fuelMetrics.fuelUps > 0
              ? (fuelMetrics.totalDistance / fuelMetrics.fuelUps).toFixed(0)
              : 0}
          </Text>
          <Text
            style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
              textAlign: "center",
            }}
          >
            km/fill-up
          </Text>
        </View>
      </View>

      {/* Trend Chart */}
      {trendData.length > 0 && (
        <>
          <Text
            style={{
              fontSize: isMobile
                ? theme.fontSize.lg
                : isTablet
                  ? theme.fontSize.lg
                  : theme.fontSize.xl,
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
              marginBottom: isMobile ? theme.spacing.sm : theme.spacing.md,
              marginTop: isMobile ? theme.spacing.md : theme.spacing.lg,
            }}
          >
            Efficiency Trend
          </Text>
          <LazyTrendLineChart
            data={trendData}
            title="Fuel Consumption Over Time"
            yAxisLabel=""
            color={theme.colors.analytics.fuel}
          />
        </>
      )}

      {/* Bottom spacing */}
      <View style={{ height: theme.spacing.xl }} />
    </AnalyticsMobilePage>
  );
}
