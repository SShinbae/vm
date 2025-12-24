import {
  EmptyAnalytics,
  MetricCard,
  PeriodSelector,
  TrendLineChart,
  UpcomingServiceCard,
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
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useStyles } from "react-native-unistyles";

export default function ServiceTab() {
  const { theme } = useStyles();
  const { isMobile, isTablet } = useResponsiveLayout();
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

  // Debug logging
  React.useEffect(() => {
    console.log("Service Analytics Debug:", {
      loading,
      error: error?.message,
      hasServiceMetrics: !!serviceMetrics,
      totalServices: serviceMetrics?.totalServices,
      servicesByType: serviceMetrics?.servicesByType,
      filters,
    });
  }, [loading, error, serviceMetrics, filters]);

  const hasData = serviceMetrics && serviceMetrics.totalServices > 0;

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
            Loading service analytics...
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
              Service Analytics
            </Text>
            <Text
              style={{
                fontSize: isMobile ? theme.fontSize.sm : theme.fontSize.base,
                color: theme.colors.textSecondary,
              }}
            >
              Track maintenance and service costs
            </Text>
          </View>
          <View
            style={{ padding: isMobile ? theme.spacing.md : theme.spacing.lg }}
          >
            <EmptyAnalytics
              icon="alert-circle-outline"
              title="Error Loading Data"
              message="Failed to load service analytics. Please try again."
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
              Service Analytics
            </Text>
            <Text
              style={{
                fontSize: isMobile ? theme.fontSize.sm : theme.fontSize.base,
                color: theme.colors.textSecondary,
              }}
            >
              Track maintenance and service costs
            </Text>
          </View>
          <View
            style={{ padding: isMobile ? theme.spacing.md : theme.spacing.lg }}
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
            icon="build-outline"
            title="No Service Data"
            message="Start logging your vehicle services to see analytics here."
          />
        </ScrollView>
      </View>
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
            Service Analytics
          </Text>
          <Text
            style={{
              fontSize: isMobile ? theme.fontSize.sm : theme.fontSize.base,
              color: theme.colors.textSecondary,
            }}
          >
            Track maintenance and service costs
          </Text>
        </View>

        <View
          style={{ padding: isMobile ? theme.spacing.md : theme.spacing.lg }}
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

          {/* Service Overview */}
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
            Service Overview
          </Text>

          {/* First Row: Total Services & Total Cost */}
          <View
            style={{
              flexDirection: "row",
              gap: isMobile ? theme.spacing.sm : theme.spacing.md,
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
              flexDirection: "row",
              gap: isMobile ? theme.spacing.sm : theme.spacing.md,
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
            Most Frequent Services
          </Text>

          <View
            style={{
              gap: isMobile ? theme.spacing.sm : theme.spacing.md,
              marginBottom: theme.spacing.md,
            }}
          >
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
                    padding: isMobile ? theme.spacing.md : theme.spacing.lg,
                    borderLeftWidth: 4,
                    borderLeftColor: theme.colors.analytics.service,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: theme.spacing.xs,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: isMobile
                          ? theme.fontSize.sm
                          : theme.fontSize.base,
                        fontWeight: theme.fontWeight.bold,
                        color: theme.colors.text,
                      }}
                    >
                      {formatServiceType(type)}
                    </Text>
                    <Text
                      style={{
                        fontSize: isMobile
                          ? theme.fontSize.base
                          : theme.fontSize.lg,
                        fontWeight: theme.fontWeight.bold,
                        color: theme.colors.analytics.service,
                      }}
                    >
                      {count}x
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: isMobile ? 10 : theme.fontSize.sm,
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
    </View>
  );
}
