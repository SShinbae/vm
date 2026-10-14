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
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

export default function PerformanceTab() {
  const { styles, theme } = useStyles(stylesheet);
  const { styles: web } = useStyles(webPageStyles);
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

  if (isWebPage) {
    const sortedVehicles = [...vehicleComparison].sort(
      (a, b) => b.totalCost - a.totalCost,
    );
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

  // Loading state
  if (loading || vehiclesLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text
            style={{
              fontSize: theme.fontSize.base,
              color: theme.colors.textSecondary,
            }}
          >
            Loading performance data...
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
              Performance
            </Text>
            <Text
              style={{
                fontSize: isMobile ? theme.fontSize.sm : theme.fontSize.base,
                color: theme.colors.textSecondary,
              }}
            >
              Compare vehicle efficiency and costs
            </Text>
          </View>
          <View
            style={{
              padding: isMobile ? theme.spacing.md : theme.spacing.lg,
            }}
          >
            <EmptyAnalytics
              icon="alert-circle-outline"
              title="Error Loading Data"
              message="Failed to load vehicle performance data. Please try again."
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
              Performance
            </Text>
            <Text
              style={{
                fontSize: isMobile ? theme.fontSize.sm : theme.fontSize.base,
                color: theme.colors.textSecondary,
              }}
            >
              Compare vehicle efficiency and costs
            </Text>
          </View>
          <View
            style={{
              padding: isMobile ? theme.spacing.md : theme.spacing.lg,
            }}
          >
            <View
              style={{
                marginBottom: isMobile ? theme.spacing.md : theme.spacing.lg,
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
          </View>
          <EmptyAnalytics
            icon="car-outline"
            title="No Vehicle Data"
            message="Start logging data for your vehicles to see performance comparisons."
          />
        </ScrollView>
      </View>
    );
  }

  // Sort vehicles by total cost (descending)
  const sortedVehicles = [...vehicleComparison].sort(
    (a, b) => b.totalCost - a.totalCost,
  );

  // Find best and worst performers
  const mostEfficient = [...vehicleComparison].sort(
    (a, b) => a.fuelEfficiency - b.fuelEfficiency,
  )[0];
  const leastEfficient = [...vehicleComparison].sort(
    (a, b) => b.fuelEfficiency - a.fuelEfficiency,
  )[0];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
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
            paddingHorizontal: isMobile ? theme.spacing.lg : theme.spacing.xl,
            paddingVertical: isMobile ? theme.spacing.md : theme.spacing.lg,
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
            Performance
          </Text>
          <Text
            style={{
              fontSize: isMobile ? theme.fontSize.sm : theme.fontSize.base,
              color: theme.colors.textSecondary,
            }}
          >
            Compare vehicle efficiency and costs
          </Text>
        </View>

        <View
          style={{
            padding: isMobile ? theme.spacing.md : theme.spacing.lg,
          }}
        >
          {/* Filters */}
          <View
            style={{
              marginBottom: isMobile ? theme.spacing.md : theme.spacing.lg,
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

          {/* Highlights */}
          {vehicleComparison.length > 1 && (
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
                Highlights
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  gap: isMobile ? theme.spacing.sm : theme.spacing.md,
                  marginBottom: theme.spacing.md,
                }}
              >
                {/* Most Efficient */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.lg,
                    padding: isMobile ? theme.spacing.md : theme.spacing.lg,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      color: theme.colors.textSecondary,
                      fontWeight: theme.fontWeight.medium,
                      marginBottom: theme.spacing.xs,
                    }}
                  >
                    Most Efficient
                  </Text>
                  <Text
                    style={{
                      fontSize: isMobile ? 10 : theme.fontSize.sm,
                      color: theme.colors.text,
                      fontWeight: theme.fontWeight.bold,
                      marginBottom: theme.spacing.xs,
                      textAlign: "center",
                    }}
                    numberOfLines={1}
                  >
                    {mostEfficient.vehicleName}
                  </Text>
                  <Text
                    style={{
                      fontSize: isMobile
                        ? theme.fontSize.base
                        : theme.fontSize.xl,
                      color: theme.colors.primary,
                      fontWeight: theme.fontWeight.bold,
                    }}
                  >
                    {mostEfficient.fuelEfficiency.toFixed(1)} L/100km
                  </Text>
                </View>

                {/* Least Efficient */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.lg,
                    padding: isMobile ? theme.spacing.md : theme.spacing.lg,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      color: theme.colors.textSecondary,
                      fontWeight: theme.fontWeight.medium,
                      marginBottom: theme.spacing.xs,
                    }}
                  >
                    Least Efficient
                  </Text>
                  <Text
                    style={{
                      fontSize: isMobile ? 10 : theme.fontSize.sm,
                      color: theme.colors.text,
                      fontWeight: theme.fontWeight.bold,
                      marginBottom: theme.spacing.xs,
                      textAlign: "center",
                    }}
                    numberOfLines={1}
                  >
                    {leastEfficient.vehicleName}
                  </Text>
                  <Text
                    style={{
                      fontSize: isMobile
                        ? theme.fontSize.base
                        : theme.fontSize.xl,
                      color: theme.colors.primary,
                      fontWeight: theme.fontWeight.bold,
                    }}
                  >
                    {leastEfficient.fuelEfficiency.toFixed(1)} L/100km
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Vehicle Comparison Table */}
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
            Vehicle Comparison
          </Text>

          {sortedVehicles.map((vehicle, index) => (
            <View
              key={vehicle.vehicleId}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.lg,
                padding: isMobile ? theme.spacing.md : theme.spacing.lg,
                marginBottom: theme.spacing.md,
                borderLeftWidth: 4,
                borderLeftColor: theme.colors.primary,
              }}
            >
              {/* Vehicle Header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: isMobile ? theme.spacing.sm : theme.spacing.md,
                  gap: isMobile ? theme.spacing.sm : theme.spacing.md,
                }}
              >
                {/* Rank Badge */}
                <View
                  style={{
                    width: isMobile ? 32 : 40,
                    height: isMobile ? 32 : 40,
                    borderRadius: isMobile ? 16 : 20,
                    backgroundColor: theme.colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: isMobile
                        ? theme.fontSize.sm
                        : theme.fontSize.base,
                      fontWeight: theme.fontWeight.bold,
                      color: theme.colors.white,
                    }}
                  >
                    #{index + 1}
                  </Text>
                </View>

                {/* Vehicle Name */}
                <Text
                  style={{
                    flex: 1,
                    fontSize: isMobile
                      ? theme.fontSize.base
                      : theme.fontSize.lg,
                    fontWeight: theme.fontWeight.bold,
                    color: theme.colors.text,
                  }}
                  numberOfLines={1}
                >
                  {vehicle.vehicleName}
                </Text>
              </View>

              {/* Vehicle Metrics */}
              <View
                style={{
                  gap: theme.spacing.sm,
                  marginBottom: isMobile ? theme.spacing.sm : theme.spacing.md,
                }}
              >
                {/* Total Cost */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: isMobile ? 10 : theme.fontSize.sm,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    Total Cost
                  </Text>
                  <Text
                    style={{
                      fontSize: isMobile ? 10 : theme.fontSize.sm,
                      color: theme.colors.text,
                      fontWeight: theme.fontWeight.medium,
                    }}
                  >
                    RM{vehicle.totalCost.toFixed(2)}
                  </Text>
                </View>

                {/* Cost per km */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: isMobile ? 10 : theme.fontSize.sm,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    Cost per km
                  </Text>
                  <Text
                    style={{
                      fontSize: isMobile ? 10 : theme.fontSize.sm,
                      color: theme.colors.text,
                      fontWeight: theme.fontWeight.medium,
                    }}
                  >
                    RM{vehicle.costPerKm.toFixed(2)}
                  </Text>
                </View>

                {/* Fuel Efficiency */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: isMobile ? 10 : theme.fontSize.sm,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    Fuel Efficiency
                  </Text>
                  <Text
                    style={{
                      fontSize: isMobile ? 10 : theme.fontSize.sm,
                      color: theme.colors.text,
                      fontWeight: theme.fontWeight.medium,
                    }}
                  >
                    {vehicle.fuelEfficiency.toFixed(1)} L/100km
                  </Text>
                </View>

                {/* Distance Traveled */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: isMobile ? 10 : theme.fontSize.sm,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    Distance Traveled
                  </Text>
                  <Text
                    style={{
                      fontSize: isMobile ? 10 : theme.fontSize.sm,
                      color: theme.colors.text,
                      fontWeight: theme.fontWeight.medium,
                    }}
                  >
                    {vehicle.totalDistance.toFixed(0)} km
                  </Text>
                </View>

                {/* Services */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: isMobile ? 10 : theme.fontSize.sm,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    Services
                  </Text>
                  <Text
                    style={{
                      fontSize: isMobile ? 10 : theme.fontSize.sm,
                      color: theme.colors.text,
                      fontWeight: theme.fontWeight.medium,
                    }}
                  >
                    {vehicle.serviceCount} completed
                  </Text>
                </View>
              </View>

              {/* Cost Breakdown Progress Bar */}
              <View style={{ marginTop: theme.spacing.sm }}>
                <Text
                  style={{
                    fontSize: 10,
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Cost Breakdown
                </Text>
                <View
                  style={{
                    height: isMobile ? 6 : 8,
                    backgroundColor: theme.colors.border,
                    borderRadius: theme.borderRadius.sm,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${(vehicle.totalCost / sortedVehicles[0].totalCost) * 100}%`,
                      backgroundColor: theme.colors.analytics.cost,
                      borderRadius: theme.borderRadius.sm,
                    }}
                  />
                </View>
              </View>
            </View>
          ))}

          {/* Bottom spacing */}
          <View style={{ height: theme.spacing.xl }} />
        </View>
      </ScrollView>
    </View>
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
