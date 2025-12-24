/**
 * Costs Analytics Tab
 * Displays comprehensive cost visualization with multiple chart types
 */

import {
  EmptyAnalytics,
  MetricCard,
  PeriodSelector,
  VehicleFilter,
} from "@/components/analytics";
import { CostLineChart } from "@/components/analytics/charts";
import {
  useAnalyticsData,
  useCostChartData,
  usePeriodSelector,
  useVehicleFilter,
} from "@/hooks/useAnalytics";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { formatDate } from "@/lib/utils/dateUtils";
import { AnalyticsPeriod } from "@/types/analytics";
import React, { useMemo, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useStyles } from "react-native-unistyles";

export default function CostsTab() {
  const { theme } = useStyles();
  const { isMobile, isTablet } = useResponsiveLayout();
  const { period, setPeriod, periods } = usePeriodSelector();
  const [customPeriod, setCustomPeriod] = useState<AnalyticsPeriod | null>(
    null,
  );

  const {
    vehicles,
    selectedVehicleIds,
    toggleVehicle,
    selectAll,
    clearAll,
    loading: vehiclesLoading,
  } = useVehicleFilter();

  // Use custom period if set, otherwise use selected period
  const activePeriod = customPeriod || period;

  const filters = useMemo(
    () => ({
      period: activePeriod,
      vehicleIds: selectedVehicleIds,
    }),
    [activePeriod, selectedVehicleIds],
  );

  const { loading, error, costMetrics, refetch } = useAnalyticsData(filters);
  const { chartDataset, loading: chartLoading } = useCostChartData(filters);

  const hasData =
    costMetrics &&
    (costMetrics.totalFuelCost > 0 || costMetrics.totalServiceCost > 0);

  const handleCustomRangeSelect = (startDate: Date, endDate: Date) => {
    const customLabel = `${formatDate(startDate)} - ${formatDate(endDate)}`;
    const diffInDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const newPeriod: AnalyticsPeriod = {
      label: customLabel,
      days: diffInDays,
      startDate,
      endDate,
    };

    setCustomPeriod(newPeriod);
  };

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

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
      >
        {/* Header */}
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
          <PeriodSelector
            selectedPeriod={activePeriod}
            onPeriodChange={(p) => {
              setPeriod(p);
              setCustomPeriod(null);
            }}
            periods={periods}
            allowCustomRange={true}
            onCustomRangeSelect={handleCustomRangeSelect}
          />
          <VehicleFilter
            vehicles={vehicles}
            selectedVehicleIds={selectedVehicleIds}
            onToggleVehicle={toggleVehicle}
            onSelectAll={selectAll}
            onClearAll={clearAll}
          />
        </View>

        {/* Content */}
        {!hasData ? (
          <EmptyAnalytics
            title="No Cost Data"
            message="Start tracking fuel and service costs to see analytics"
          />
        ) : (
          <View
            style={{
              paddingHorizontal: isMobile ? theme.spacing.lg : theme.spacing.xl,
              paddingBottom: theme.spacing.xl,
            }}
          >
            {/* Summary Cards */}
            <View
              style={{
                flexDirection: "row",
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
                flexDirection: "row",
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
                flexDirection: "row",
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

            {/* Charts */}
            {chartDataset && chartDataset.data.length > 0 && (
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
                    marginBottom: isMobile
                      ? theme.spacing.md
                      : theme.spacing.lg,
                  }}
                >
                  Cost Visualization
                </Text>

                {/* Line Chart - Total Costs */}
                <CostLineChart
                  data={chartDataset.data}
                  title="Cost Trends Over Time"
                  showLegend={true}
                />

                {/* More chart types coming soon */}
                <View
                  style={{
                    marginTop: theme.spacing.md,
                    padding: isMobile ? theme.spacing.md : theme.spacing.lg,
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.lg,
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

                {/* Info Footer */}
                <View
                  style={{
                    marginTop: isMobile ? theme.spacing.lg : theme.spacing.xl,
                    padding: isMobile ? theme.spacing.sm : theme.spacing.md,
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.lg,
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
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
