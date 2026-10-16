import { AnalyticsMobilePage } from "@/components/analytics/AnalyticsMobilePage";
import { AnalyticsCompactState } from "@/components/analytics/AnalyticsCompactState";
import {
  EmptyAnalytics,
  MetricCard,
  PeriodSelector,
  VehicleFilter,
} from "@/components/analytics";
import {
  useAnalyticsData,
  usePeriodSelector,
  useVehicleFilter,
} from "@/hooks/useAnalytics";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import React, { useMemo } from "react";
import { ResponsiveGrid } from "@/components/layout/ResponsiveGrid";
import { webPageStyles } from "@/components/layout/webPageStyles";
import {
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

export default function PerformanceTab() {
  const { styles, theme } = useStyles(stylesheet);
  const { styles: web } = useStyles(webPageStyles);
  const { isWeb, isMobile } = useResponsiveLayout();
  const isWebPage = isWeb && !isMobile;
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 360 || fontScale >= 1.3;
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

  const {
    loading,
    error,
    vehicleComparison,
    fuelMetrics,
    costMetrics,
    refetch,
  } = useAnalyticsData(filters);

  const hasData = vehicleComparison && vehicleComparison.length > 0;

  const sortedVehicles = [...vehicleComparison].sort(
    (a, b) => b.totalCost - a.totalCost,
  );

  if (isWebPage) {
    const efficiencyRanking = vehicleComparison
      .filter((vehicle) => vehicle.fuelEfficiency > 0)
      .sort((a, b) => a.fuelEfficiency - b.fuelEfficiency);
    const mostEfficient = efficiencyRanking[0];
    const leastEfficient = efficiencyRanking[efficiencyRanking.length - 1];

    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.xl,
            paddingBottom: theme.spacing.xl,
          }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} />
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
              Loading performance data...
            </Text>
          ) : error ? (
            <EmptyAnalytics
              icon="alert-circle-outline"
              title="Error Loading Data"
              message="Failed to load vehicle performance data. Please try again."
            />
          ) : !hasData ? (
            <EmptyAnalytics
              icon="car-outline"
              title="No Vehicle Data"
              message="Start logging data for your vehicles to see performance comparisons."
            />
          ) : (
            <>
              <ResponsiveGrid
                columns={{ tablet: 2, desktop: 3, largeDesktop: 3 }}
                spacing={theme.spacing.md}
                style={{ marginBottom: theme.spacing.sm }}
              >
                <MetricCard
                  title="Total Distance"
                  value={`${fuelMetrics?.totalDistance.toFixed(0) || "0"} km`}
                  subtitle={period.label}
                  icon="navigate-outline"
                  color={theme.colors.primary}
                />
                <MetricCard
                  title="Average Consumption"
                  value={
                    fuelMetrics && fuelMetrics.averageConsumption > 0
                      ? fuelMetrics.averageConsumption.toFixed(1)
                      : "—"
                  }
                  subtitle="L/100km"
                  icon="speedometer-outline"
                  color={theme.colors.analytics.fuel}
                />
                <MetricCard
                  title="Cost per km"
                  value={
                    fuelMetrics && fuelMetrics.totalDistance > 0 && costMetrics
                      ? `RM${costMetrics.costPerKm.toFixed(2)}`
                      : "—"
                  }
                  subtitle="Across selected vehicles"
                  icon="cash-outline"
                  color={theme.colors.analytics.cost}
                />
              </ResponsiveGrid>
              <View style={web.panel}>
                <Text style={[web.heading, { marginBottom: theme.spacing.xs }]}>
                  Vehicle Comparison
                </Text>
                <Text style={styles.description}>
                  Highest total cost first · {period.label}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator
                  contentContainerStyle={{ flexGrow: 1 }}
                >
                  <View
                    role="table"
                    accessibilityLabel="Vehicle performance comparison"
                    style={{ minWidth: 900, flex: 1 }}
                  >
                    <View
                      role="row"
                      style={[styles.tableRow, styles.tableHeader]}
                    >
                      <Text
                        role="columnheader"
                        style={[styles.headerText, styles.vehicleCell]}
                      >
                        Vehicle
                      </Text>
                      <Text
                        role="columnheader"
                        style={[styles.headerText, styles.numberCell]}
                      >
                        Distance (km)
                      </Text>
                      <Text
                        role="columnheader"
                        style={[styles.headerText, styles.numberCell]}
                      >
                        Fuel (L/100km)
                      </Text>
                      <Text
                        role="columnheader"
                        style={[styles.headerText, styles.numberCell]}
                      >
                        Total Cost
                      </Text>
                      <Text
                        role="columnheader"
                        style={[styles.headerText, styles.numberCell]}
                      >
                        Cost per km
                      </Text>
                      <Text
                        role="columnheader"
                        style={[styles.headerText, styles.numberCell]}
                      >
                        Services
                      </Text>
                    </View>
                    {sortedVehicles.map((vehicle) => (
                      <View
                        key={vehicle.vehicleId}
                        role="row"
                        style={styles.tableRow}
                      >
                        <Text
                          role="rowheader"
                          style={[
                            styles.cellText,
                            styles.vehicleCell,
                            { fontWeight: theme.fontWeight.semibold },
                          ]}
                        >
                          {vehicle.vehicleName}
                        </Text>
                        <Text
                          role="cell"
                          style={[styles.cellText, styles.numberCell]}
                        >
                          {vehicle.totalDistance.toLocaleString("en-US", {
                            maximumFractionDigits: 0,
                          })}
                        </Text>
                        <Text
                          role="cell"
                          style={[styles.cellText, styles.numberCell]}
                        >
                          {vehicle.fuelEfficiency > 0
                            ? vehicle.fuelEfficiency.toFixed(1)
                            : "—"}
                        </Text>
                        <Text
                          role="cell"
                          style={[styles.cellText, styles.numberCell]}
                        >
                          RM{vehicle.totalCost.toFixed(2)}
                        </Text>
                        <Text
                          role="cell"
                          style={[styles.cellText, styles.numberCell]}
                        >
                          {vehicle.totalDistance > 0
                            ? `RM${vehicle.costPerKm.toFixed(2)}`
                            : "—"}
                        </Text>
                        <Text
                          role="cell"
                          style={[styles.cellText, styles.numberCell]}
                        >
                          {vehicle.serviceCount}
                        </Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
                <Text
                  style={[
                    styles.description,
                    { marginTop: theme.spacing.md, marginBottom: 0 },
                  ]}
                >
                  — indicates insufficient logs to calculate a metric. Lower
                  L/100km means better fuel efficiency.
                </Text>
              </View>
              {efficiencyRanking.length > 1 && (
                <View style={{ marginTop: theme.spacing.lg }}>
                  <Text style={web.heading}>Efficiency Highlights</Text>
                  <ResponsiveGrid
                    columns={{ tablet: 2, desktop: 2, largeDesktop: 2 }}
                    spacing={theme.spacing.md}
                  >
                    <MetricCard
                      title="Most Efficient"
                      value={`${mostEfficient.fuelEfficiency.toFixed(1)} L/100km`}
                      subtitle={mostEfficient.vehicleName}
                      icon="trophy-outline"
                      color={theme.colors.analytics.fuel}
                    />
                    <MetricCard
                      title="Least Efficient"
                      value={`${leastEfficient.fuelEfficiency.toFixed(1)} L/100km`}
                      subtitle={leastEfficient.vehicleName}
                      icon="speedometer-outline"
                      color={theme.colors.textSecondary}
                    />
                  </ResponsiveGrid>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  if (loading || vehiclesLoading || error || vehiclesError || !hasData) {
    return (
      <AnalyticsCompactState
        title="Performance"
        subtitle="Compare vehicle efficiency and costs"
        loading={loading || vehiclesLoading}
        error={error || vehiclesError}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <AnalyticsMobilePage
      title="Performance"
      subtitle="Compare vehicle efficiency and costs"
      refreshing={loading}
      onRefresh={() => {
        void refetch();
      }}
    >
      <View style={{ gap: 16 }}>
        <MetricCard
          title="Total Distance"
          value={`${fuelMetrics?.totalDistance.toLocaleString("en-US", { maximumFractionDigits: 0 }) || "0"} km`}
          subtitle={period.label}
          icon="navigate-outline"
          color={theme.colors.primary}
        />
        <View style={{ flexDirection: stacked ? "column" : "row", gap: 12 }}>
          <View style={{ flex: stacked ? undefined : 1, minWidth: 0 }}>
            <MetricCard
              title="Average Consumption"
              value={
                fuelMetrics && fuelMetrics.averageConsumption > 0
                  ? fuelMetrics.averageConsumption.toFixed(1)
                  : "—"
              }
              subtitle="L/100km"
              color={theme.colors.analytics.fuel}
            />
          </View>
          <View style={{ flex: stacked ? undefined : 1, minWidth: 0 }}>
            <MetricCard
              title="Cost per km"
              value={
                fuelMetrics && fuelMetrics.totalDistance > 0 && costMetrics
                  ? `RM${costMetrics.costPerKm.toFixed(2)}`
                  : "—"
              }
              subtitle="Across selected vehicles"
              color={theme.colors.analytics.cost}
            />
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <View style={{ gap: 4 }}>
            <Text
              accessibilityRole="header"
              style={{
                color: theme.colors.text,
                fontSize: theme.fontSize.lg,
                fontWeight: "700",
              }}
            >
              Vehicle Comparison
            </Text>
            <Text style={{ color: theme.colors.textSecondary }}>
              Highest total cost first · {period.label}
            </Text>
          </View>
          {sortedVehicles.map((vehicle) => (
            <View
              key={vehicle.vehicleId}
              testID={`performance-vehicle-${vehicle.vehicleId}`}
              style={{
                padding: 16,
                gap: 12,
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.lg,
              }}
            >
              <Text
                accessibilityRole="header"
                style={{
                  color: theme.colors.text,
                  fontSize: theme.fontSize.base,
                  fontWeight: "600",
                }}
              >
                {vehicle.vehicleName}
              </Text>
              <View style={{ gap: 4 }}>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  Total Cost
                </Text>
                <Text
                  style={{
                    color: theme.colors.text,
                    fontSize: theme.fontSize.xl,
                    fontWeight: "700",
                  }}
                >
                  RM{vehicle.totalCost.toFixed(2)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                {[
                  {
                    label: "Distance (km)",
                    value: vehicle.totalDistance.toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    }),
                  },
                  {
                    label: "Fuel (L/100km)",
                    value:
                      vehicle.fuelEfficiency > 0
                        ? vehicle.fuelEfficiency.toFixed(1)
                        : "—",
                  },
                  {
                    label: "Cost per km",
                    value:
                      vehicle.totalDistance > 0
                        ? `RM${vehicle.costPerKm.toFixed(2)}`
                        : "—",
                  },
                  { label: "Services", value: String(vehicle.serviceCount) },
                ].map((metric) => (
                  <View
                    key={metric.label}
                    style={{
                      flexBasis: stacked ? "100%" : "45%",
                      flexGrow: 1,
                      minWidth: 0,
                      gap: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: theme.colors.textSecondary,
                        fontSize: theme.fontSize.sm,
                      }}
                    >
                      {metric.label}
                    </Text>
                    <Text
                      style={{ color: theme.colors.text, fontWeight: "600" }}
                    >
                      {metric.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.fontSize.sm,
            }}
          >
            — indicates insufficient logs to calculate a metric. Lower L/100km
            means better fuel efficiency.
          </Text>
        </View>
      </View>
    </AnalyticsMobilePage>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  description: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing.lg,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  tableHeader: {
    backgroundColor: theme.colors.background,
    paddingVertical: theme.spacing.md,
  },
  headerText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  cellText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
  },
  vehicleCell: { flex: 2, minWidth: 220, paddingRight: theme.spacing.md },
  numberCell: { flex: 1, textAlign: "right", paddingLeft: theme.spacing.sm },
}));
