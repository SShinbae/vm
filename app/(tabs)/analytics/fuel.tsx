import {
  EmptyAnalytics,
  MetricCard,
  PeriodSelector,
  TrendLineChart,
  VehicleFilter,
} from "@/components/analytics";
import {
  useAnalyticsData,
  useAnalyticsTrends,
  usePeriodSelector,
  useVehicleFilter,
} from "@/hooks/useAnalytics";
import React, { useMemo } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStyles } from "react-native-unistyles";

export default function FuelTab() {
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
    [period, selectedVehicleIds],
  );

  const { loading, error, fuelMetrics, costMetrics, refetch } =
    useAnalyticsData(filters);
  const { trendData, trendAnalysis } = useAnalyticsTrends(filters, "fuel");

  const hasData = fuelMetrics && fuelMetrics.fuelUps > 0;

  // Loading state
  if (loading || vehiclesLoading) {
    return (
      <SafeAreaView
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
              fontSize: theme.fontSize.base,
              color: theme.colors.textSecondary,
            }}
          >
            Loading fuel analytics...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <ScrollView style={{ flex: 1 }}>
          <View
            style={{
              paddingHorizontal: theme.spacing.xl,
              paddingVertical: theme.spacing.lg,
            }}
          >
            <Text
              style={{
                fontSize: theme.fontSize["3xl"],
                fontWeight: theme.fontWeight.bold,
                color: theme.colors.text,
                marginBottom: theme.spacing.xs,
              }}
            >
              Fuel Analytics
            </Text>
            <Text
              style={{
                fontSize: theme.fontSize.base,
                color: theme.colors.textSecondary,
              }}
            >
              Track fuel consumption and efficiency
            </Text>
          </View>
          <View style={{ padding: theme.spacing.lg }}>
            <EmptyAnalytics
              icon="alert-circle-outline"
              title="Error Loading Data"
              message="Failed to load fuel analytics. Please try again."
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Empty state
  if (!hasData) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <ScrollView style={{ flex: 1 }}>
          <View
            style={{
              paddingHorizontal: theme.spacing.xl,
              paddingVertical: theme.spacing.lg,
            }}
          >
            <Text
              style={{
                fontSize: theme.fontSize["3xl"],
                fontWeight: theme.fontWeight.bold,
                color: theme.colors.text,
                marginBottom: theme.spacing.xs,
              }}
            >
              Fuel Analytics
            </Text>
            <Text
              style={{
                fontSize: theme.fontSize.base,
                color: theme.colors.textSecondary,
              }}
            >
              Track fuel consumption and efficiency
            </Text>
          </View>
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
            icon="water-outline"
            title="No Fuel Data"
            message="Start logging your fuel fill-ups to see analytics here."
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: theme.spacing.xl,
            paddingVertical: theme.spacing.lg,
            backgroundColor: theme.colors.background,
          }}
        >
          <Text
            style={{
              fontSize: theme.fontSize["3xl"],
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
              marginBottom: theme.spacing.xs,
            }}
          >
            Fuel Analytics
          </Text>
          <Text
            style={{
              fontSize: theme.fontSize.base,
              color: theme.colors.textSecondary,
            }}
          >
            Track fuel consumption and efficiency
          </Text>
        </View>

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

          {/* Fuel Efficiency Metrics */}
          <Text
            style={{
              fontSize: theme.fontSize.xl,
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
              marginBottom: theme.spacing.md,
              marginTop: theme.spacing.lg,
            }}
          >
            Fuel Efficiency
          </Text>

          {/* First Row: Avg Consumption & Total Distance */}
          <View
            style={{
              flexDirection: "row",
              gap: theme.spacing.md,
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
                trend={trendAnalysis || undefined}
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
              flexDirection: "row",
              gap: theme.spacing.md,
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
              fontSize: theme.fontSize.xl,
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
              marginBottom: theme.spacing.md,
              marginTop: theme.spacing.lg,
            }}
          >
            Fuel Costs
          </Text>

          {/* Third Row: Total Cost & Avg Price */}
          <View
            style={{
              flexDirection: "row",
              gap: theme.spacing.md,
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
              fontSize: theme.fontSize.xl,
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
              marginBottom: theme.spacing.md,
              marginTop: theme.spacing.lg,
            }}
          >
            Fill-up Statistics
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: theme.spacing.md,
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
                  fontSize: theme.fontSize["2xl"],
                  fontWeight: theme.fontWeight.bold,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs,
                }}
              >
                {fuelMetrics.fuelUps}
              </Text>
              <Text
                style={{
                  fontSize: theme.fontSize.xs,
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
                  fontSize: theme.fontSize["2xl"],
                  fontWeight: theme.fontWeight.bold,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs,
                }}
              >
                {fuelMetrics.totalLitersFilled.toFixed(0)}
              </Text>
              <Text
                style={{
                  fontSize: theme.fontSize.xs,
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
                  fontSize: theme.fontSize["2xl"],
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
                  fontSize: theme.fontSize.xs,
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
                  fontSize: theme.fontSize.xl,
                  fontWeight: theme.fontWeight.bold,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.md,
                  marginTop: theme.spacing.lg,
                }}
              >
                Efficiency Trend
              </Text>
              <TrendLineChart
                data={trendData}
                title="Fuel Consumption Over Time"
                yAxisLabel=""
                color={theme.colors.analytics.fuel}
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
