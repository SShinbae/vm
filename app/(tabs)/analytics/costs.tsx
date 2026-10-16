import { AnalyticsMobilePage } from "@/components/analytics/AnalyticsMobilePage";
import { AnalyticsCompactState } from "@/components/analytics/AnalyticsCompactState";
/**
 * Costs Analytics Tab
 * Displays comprehensive cost visualization with multiple chart types
 */

import {
  EmptyAnalytics,
  MetricCard,
  PeriodSelector,
  VehicleFilter,
  LazyCostLineChart,
} from "@/components/analytics";
import {
  useAnalyticsData,
  useCostChartData,
  usePeriodSelector,
  useVehicleFilter,
} from "@/hooks/useAnalytics";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { formatDate } from "@/lib/utils/dateUtils";
import React, { useMemo } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useStyles } from "react-native-unistyles";

export default function CostsTab() {
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

  // Use custom period if set, otherwise use selected period
  const activePeriod = period;

  const filters = useMemo(
    () => ({
      period: activePeriod,
      vehicleIds: selectedVehicleIds,
    }),
    [activePeriod, selectedVehicleIds],
  );

  const { loading, error, costMetrics, refetch } = useAnalyticsData(filters);
  const {
    chartDataset,
    loading: chartLoading,
    error: chartError,
    refetch: refetchChart,
  } = useCostChartData(filters);

  const hasData =
    costMetrics &&
    (costMetrics.totalFuelCost > 0 || costMetrics.totalServiceCost > 0);

  const handleCustomRangeSelect = (startDate: Date, endDate: Date) => {
    const customLabel = `${formatDate(startDate)} - ${formatDate(endDate)}`;
    const diffInDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const newPeriod = {
      label: customLabel,
      days: diffInDays,
      startDate,
      endDate,
    };

    setPeriod(newPeriod);
  };

  if (
    !isWebPage &&
    (loading ||
      vehiclesLoading ||
      chartLoading ||
      error ||
      chartError ||
      vehiclesError ||
      !hasData)
  ) {
    return (
      <AnalyticsCompactState
        title="Cost Analytics"
        subtitle="Track fuel and service spending"
        loading={loading || vehiclesLoading || chartLoading}
        error={error || chartError || vehiclesError}
        onRetry={() => {
          void refetch();
          void refetchChart();
        }}
      />
    );
  }

  // Loading state
  if (loading || vehiclesLoading || chartLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
        }}
      >
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: isMobile ? theme.fontSize.sm : theme.fontSize.base,
              color: theme.colors.textSecondary,
            }}
          >
            Loading cost analytics...
          </Text>
        </View>
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
                ...(isWebPage && { display: "none" }),
              }}
            >
              Cost Analytics
            </Text>
            <Text
              style={{
                fontSize: isMobile ? theme.fontSize.sm : theme.fontSize.base,
                color: theme.colors.analytics.warning,
                marginTop: theme.spacing.md,
              }}
            >
              Error loading data: {error.message}
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  const content = (
    <>
      {isWebPage && (
        <>
          {/* Header */}
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
              Cost Analytics
            </Text>
            <Text
              style={{
                fontSize: isMobile ? theme.fontSize.sm : theme.fontSize.base,
                color: theme.colors.textSecondary,
              }}
            >
              Comprehensive cost visualization across time periods
            </Text>
          </View>

          {/* Filters */}
          <View
            style={{
              paddingHorizontal: isMobile ? theme.spacing.lg : theme.spacing.xl,
              marginBottom: isMobile ? theme.spacing.md : theme.spacing.lg,
            }}
          >
            {!isWebPage && (
              <PeriodSelector
                selectedPeriod={activePeriod}
                onPeriodChange={setPeriod}
                periods={periods}
                allowCustomRange={true}
                onCustomRangeSelect={handleCustomRangeSelect}
              />
            )}
            <VehicleFilter
              periodControl={
                isWebPage ? (
                  <PeriodSelector
                    selectedPeriod={activePeriod}
                    onPeriodChange={setPeriod}
                    periods={periods}
                    allowCustomRange
                    onCustomRangeSelect={handleCustomRangeSelect}
                    placement="toolbar"
                  />
                ) : undefined
              }
              vehicles={vehicles}
              selectedVehicleIds={selectedVehicleIds}
              onToggleVehicle={toggleVehicle}
              onSelectAll={selectAll}
              onClearAll={clearAll}
            />
          </View>
        </>
      )}
      {/* Content */}
      {!hasData ? (
        <EmptyAnalytics
          title="No Cost Data"
          message="Start tracking fuel and service costs to see analytics"
        />
      ) : (
        <View
          style={{
            paddingHorizontal: isWebPage ? theme.spacing.xl : 0,
            paddingBottom: theme.spacing.xl,
          }}
        >
          {isWebPage ? (
            <>
              <View
                style={{
                  flexDirection: "row",
                  gap: theme.spacing.md,
                  marginBottom: theme.spacing.md,
                }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <MetricCard
                    title="Total Cost"
                    value={`RM${costMetrics?.totalCost.toFixed(2) || "0.00"}`}
                    subtitle={activePeriod.label}
                    icon="cash-outline"
                    color={theme.colors.analytics.cost}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <MetricCard
                    title="Fuel Cost"
                    value={`RM${costMetrics?.totalFuelCost.toFixed(2) || "0.00"}`}
                    subtitle={activePeriod.label}
                    icon="water-outline"
                    color={theme.colors.analytics.fuel}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <MetricCard
                    title="Service Cost"
                    value={`RM${costMetrics?.totalServiceCost.toFixed(2) || "0.00"}`}
                    subtitle={activePeriod.label}
                    icon="construct-outline"
                    color={theme.colors.analytics.service}
                  />
                </View>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  gap: theme.spacing.md,
                  marginBottom: theme.spacing.lg,
                }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <MetricCard
                    title="Cost per km"
                    value={`RM${costMetrics?.costPerKm.toFixed(2) || "0.00"}`}
                    subtitle="Average"
                    icon="speedometer-outline"
                    color={theme.colors.analytics.purple}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <MetricCard
                    title="Daily Average"
                    value={`RM${chartDataset?.summary.averageDailyCost.toFixed(2) || "0.00"}`}
                    subtitle="per day"
                    icon="calendar-outline"
                    color={theme.colors.analytics.teal}
                  />
                </View>
              </View>
            </>
          ) : (
            <>
              <View
                style={{
                  flexDirection: isMobile ? "column" : "row",
                  gap: isMobile ? theme.spacing.sm : theme.spacing.md,
                  marginBottom: isMobile ? theme.spacing.md : theme.spacing.lg,
                }}
              >
                <View style={{ flex: 1 }}>
                  <MetricCard
                    title="Total Cost"
                    value={`RM${costMetrics?.totalCost.toFixed(2) || "0.00"}`}
                    subtitle={activePeriod.label}
                    icon="cash-outline"
                    color={theme.colors.analytics.cost}
                  />
                </View>
              </View>
              <View
                style={{
                  flexDirection: isMobile ? "column" : "row",
                  gap: isMobile ? theme.spacing.sm : theme.spacing.md,
                  marginBottom: isMobile ? theme.spacing.md : theme.spacing.lg,
                }}
              >
                <View style={{ flex: 1 }}>
                  <MetricCard
                    title="Fuel Cost"
                    value={`RM${costMetrics?.totalFuelCost.toFixed(2) || "0.00"}`}
                    subtitle={activePeriod.label}
                    icon="water-outline"
                    color={theme.colors.analytics.fuel}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <MetricCard
                    title="Service Cost"
                    value={`RM${costMetrics?.totalServiceCost.toFixed(2) || "0.00"}`}
                    subtitle={activePeriod.label}
                    icon="construct-outline"
                    color={theme.colors.analytics.service}
                  />
                </View>
              </View>
              <View
                style={{
                  flexDirection: isMobile ? "column" : "row",
                  gap: isMobile ? theme.spacing.sm : theme.spacing.md,
                  marginBottom: isMobile ? theme.spacing.lg : theme.spacing.xl,
                }}
              >
                <View style={{ flex: 1 }}>
                  <MetricCard
                    title="Cost per km"
                    value={`RM${costMetrics?.costPerKm.toFixed(2) || "0.00"}`}
                    subtitle="average"
                    icon="speedometer-outline"
                    color={theme.colors.analytics.purple}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <MetricCard
                    title="Daily Average"
                    value={`RM${chartDataset?.summary.averageDailyCost.toFixed(2) || "0.00"}`}
                    subtitle="per day"
                    icon="calendar-outline"
                    color={theme.colors.analytics.teal}
                  />
                </View>
              </View>
            </>
          )}

          {/* Charts */}
          {chartDataset && chartDataset.data.length > 0 && (
            <>
              {!isWebPage && (
                <Text
                  style={{
                    fontSize: isMobile
                      ? theme.fontSize.lg
                      : isTablet
                        ? theme.fontSize.lg
                        : theme.fontSize.xl,
                    fontWeight: theme.fontWeight.bold,
                    color: theme.colors.text,
                    marginBottom: isMobile
                      ? theme.spacing.md
                      : theme.spacing.lg,
                  }}
                >
                  Cost Visualization
                </Text>
              )}

              {/* OPTIMIZATION: Lazy-loaded Line Chart - Total Costs */}
              <LazyCostLineChart
                data={chartDataset.data}
                title="Cost Trends Over Time"
                subtitle="Total, fuel, and service costs over the selected period."
                showLegend={true}
              />

              {!isWebPage && (
                <View
                  style={{
                    marginTop: theme.spacing.md,
                    padding: theme.spacing.lg,
                    backgroundColor: theme.colors.surface,
                    borderRadius: isWebPage
                      ? theme.borderRadius.xl
                      : theme.borderRadius.lg,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderStyle: "dashed",
                  }}
                >
                  <Text
                    style={{
                      fontSize: isMobile
                        ? theme.fontSize.sm
                        : theme.fontSize.base,
                      color: theme.colors.textSecondary,
                      textAlign: "center",
                      marginBottom: theme.spacing.xs,
                    }}
                  >
                    Additional Chart Types
                  </Text>
                  <Text
                    style={{
                      fontSize: isMobile
                        ? theme.fontSize.xs
                        : theme.fontSize.sm,
                      color: theme.colors.textSecondary,
                      textAlign: "center",
                    }}
                  >
                    Bar charts, stacked charts, area charts, and pie charts
                    coming in the next update
                  </Text>
                </View>
              )}

              {/* Info Footer */}
              {!isWebPage && (
                <View
                  style={{
                    marginTop: isMobile ? theme.spacing.lg : theme.spacing.xl,
                    padding: isMobile ? theme.spacing.sm : theme.spacing.md,
                    backgroundColor: theme.colors.surface,
                    borderRadius: isWebPage
                      ? theme.borderRadius.xl
                      : theme.borderRadius.lg,
                  }}
                >
                  <Text
                    style={{
                      fontSize: isMobile
                        ? theme.fontSize.xs
                        : theme.fontSize.sm,
                      color: theme.colors.textSecondary,
                      textAlign: "center",
                    }}
                  >
                    Charts grouped by {chartDataset.grouping} •{" "}
                    {chartDataset.data.length} data points
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      )}
    </>
  );
  if (!isWebPage)
    return (
      <AnalyticsMobilePage
        title="Cost Analytics"
        subtitle="Track fuel and service spending"
        refreshing={loading}
        onRefresh={() => {
          void refetch();
          void refetchChart();
        }}
      >
        {content}
      </AnalyticsMobilePage>
    );
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
      >
        {content}
      </ScrollView>
    </View>
  );
}
