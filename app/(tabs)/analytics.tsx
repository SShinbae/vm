import React, { useState, useEffect, useCallback, Suspense, lazy } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ResponsiveGrid } from "@/components/layout/ResponsiveGrid";
import { WebLayout } from "@/components/layout/WebLayout";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { MetricCard } from "@/components/ui/MetricCard";
import { TrendCard } from "@/components/ui/TrendCard";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  AnalyticsService,
  AnalyticsData,
} from "@/lib/services/analyticsService";
import { withTimeout } from "@/lib/utils/networkUtils";
import {
  safeFormatCurrency,
  safeGetExpenseAmount,
  safeNumericValue,
} from "@/lib/utils/formatUtils";

// Lazy load chart components for better performance
const LineChart = lazy(() =>
  import("@/components/charts/LineChart").then((m) => ({
    default: m.LineChart,
  })),
);
const BarChart = lazy(() =>
  import("@/components/charts/BarChart").then((m) => ({ default: m.BarChart })),
);
const PieChart = lazy(() =>
  import("@/components/charts/PieChart").then((m) => ({ default: m.PieChart })),
);

export default function AnalyticsScreen() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "last3months" | "last6months" | "lastyear" | "alltime"
  >("last6months");

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const layout = useResponsiveLayout();

  const fetchAnalytics = useCallback(async () => {
    try {
      // Use network utility with timeout protection
      const data = await withTimeout(
        AnalyticsService.getAnalytics(selectedPeriod),
        10000,
      );
      setAnalyticsData(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      // Set empty/default data on error to prevent infinite loading
      setAnalyticsData({
        monthlyTrends: [],
        expenseBreakdown: [],
        vehicleAnalytics: [],
        totalExpenses: 0,
        fuelTrend: 0,
        serviceTrend: 0,
        period: selectedPeriod,
      });
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  }, [fetchAnalytics]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    header: {
      backgroundColor: colors.background,
      paddingHorizontal: 24,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    greeting: {
      fontSize: 32,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    headerContent: {
      flexDirection: layout.isMobile ? "column" : "row",
      justifyContent: "space-between",
      alignItems: layout.isMobile ? "flex-start" : "center",
      gap: layout.isMobile ? 16 : 0,
      marginTop: 16,
    },
    periodSelector: {
      flexDirection: "row",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      padding: 4,
      gap: 4,
    },
    periodButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    periodButtonActive: {
      backgroundColor: colors.tint,
    },
    periodButtonText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.textSecondary,
    },
    periodButtonTextActive: {
      color: "white",
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 20,
    },
    section: {
      padding: 24,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 20,
    },
    metricsRow: {
      flexDirection: layout.isDesktop ? "row" : "column",
      gap: 16,
      marginBottom: 24,
    },
    metricCard: {
      flex: 1,
    },
    chartsSection: {
      gap: 16,
    },
    chartLoader: {
      height: 200,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 40,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.backgroundSecondary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
      textAlign: "center",
    },
    emptyDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
  });

  const PeriodSelector = () => (
    <View style={styles.periodSelector}>
      {[
        { key: "last3months", label: "3 Months" },
        { key: "last6months", label: "6 Months" },
        { key: "lastyear", label: "1 Year" },
        { key: "alltime", label: "All Time" },
      ].map((period) => (
        <TouchableOpacity
          key={period.key}
          style={[
            styles.periodButton,
            selectedPeriod === period.key && styles.periodButtonActive,
          ]}
          onPress={() => setSelectedPeriod(period.key as any)}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === period.key && styles.periodButtonTextActive,
            ]}
          >
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <WebLayout>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        </WebLayout>
      </SafeAreaView>
    );
  }

  if (!analyticsData || analyticsData.totalExpenses === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <WebLayout>
          <View style={styles.header}>
            <Text style={styles.greeting}>Analytics</Text>
            <Text style={styles.subtitle}>
              Track your vehicle expenses and trends
            </Text>
            <View style={styles.headerContent}>
              <View />
              <PeriodSelector />
            </View>
          </View>
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <IconSymbol
                name="chart.line.uptrend.xyaxis"
                size={32}
                color={colors.textSecondary}
              />
            </View>
            <Text style={styles.emptyTitle}>No analytics data</Text>
            <Text style={styles.emptyDescription}>
              Start logging fuel and service expenses to see your analytics and
              spending trends.
            </Text>
          </View>
        </WebLayout>
      </SafeAreaView>
    );
  }

  // Prepare chart data
  const monthlyTrendData = AnalyticsService.formatForLineChart(
    analyticsData.monthlyTrends,
    "total",
  );
  const fuelTrendData = AnalyticsService.formatForLineChart(
    analyticsData.monthlyTrends,
    "fuel",
  );
  const serviceTrendData = AnalyticsService.formatForLineChart(
    analyticsData.monthlyTrends,
    "service",
  );
  const expenseBreakdownData = AnalyticsService.formatForPieChart(
    analyticsData.expenseBreakdown,
  );
  const vehicleComparisonData = AnalyticsService.formatForBarChart(
    analyticsData.vehicleAnalytics,
  );

  return (
    <SafeAreaView style={styles.container}>
      <WebLayout>
        <View style={styles.header}>
          <Text style={styles.greeting}>Analytics</Text>
          <Text style={styles.subtitle}>
            Track your vehicle expenses and trends
          </Text>
          <View style={styles.headerContent}>
            <View />
            <PeriodSelector />
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Overview Cards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <TrendCard
                  title="Total Expenses"
                  value={safeFormatCurrency(analyticsData.totalExpenses)}
                  trend={
                    (safeNumericValue(analyticsData, "fuelTrend") +
                      safeNumericValue(analyticsData, "serviceTrend")) /
                    2
                  }
                  icon="dollarsign.circle.fill"
                  gradientColors={colors.gradients.primary}
                />
              </View>
              {layout.isDesktop && (
                <>
                  <View style={styles.metricCard}>
                    <MetricCard
                      title="Fuel Costs"
                      value={safeGetExpenseAmount(
                        analyticsData?.expenseBreakdown,
                        "Fuel",
                      )}
                      trend={safeNumericValue(analyticsData, "fuelTrend")}
                      icon="fuelpump.fill"
                      color={colors.chart.fuel}
                      size="medium"
                    />
                  </View>
                  <View style={styles.metricCard}>
                    <MetricCard
                      title="Service Costs"
                      value={safeGetExpenseAmount(
                        analyticsData?.expenseBreakdown,
                        "Service",
                      )}
                      trend={safeNumericValue(analyticsData, "serviceTrend")}
                      icon="wrench.fill"
                      color={colors.chart.service}
                      size="medium"
                    />
                  </View>
                </>
              )}
            </View>

            {layout.isMobile && (
              <ResponsiveGrid minItemWidth={160} spacing={16}>
                <MetricCard
                  title="Fuel Costs"
                  value={safeGetExpenseAmount(
                    analyticsData?.expenseBreakdown,
                    "Fuel",
                  )}
                  trend={safeNumericValue(analyticsData, "fuelTrend")}
                  icon="fuelpump.fill"
                  color={colors.chart.fuel}
                  size="small"
                />
                <MetricCard
                  title="Service Costs"
                  value={safeGetExpenseAmount(
                    analyticsData?.expenseBreakdown,
                    "Service",
                  )}
                  trend={safeNumericValue(analyticsData, "serviceTrend")}
                  icon="wrench.fill"
                  color={colors.chart.service}
                  size="small"
                />
              </ResponsiveGrid>
            )}
          </View>

          {/* Charts Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trends & Analysis</Text>
            <View style={styles.chartsSection}>
              <Suspense
                fallback={
                  <View style={styles.chartLoader}>
                    <ActivityIndicator size="large" color={colors.tint} />
                  </View>
                }
              >
                <LineChart
                  data={monthlyTrendData}
                  title="Total Expenses Over Time"
                  color={colors.chart.primary}
                  showArea={true}
                />
              </Suspense>

              {layout.isDesktop ? (
                <ResponsiveGrid minItemWidth={400} spacing={16}>
                  <Suspense
                    fallback={
                      <View style={styles.chartLoader}>
                        <ActivityIndicator color={colors.tint} />
                      </View>
                    }
                  >
                    <LineChart
                      data={fuelTrendData}
                      title="Fuel Expenses"
                      color={colors.chart.fuel}
                      height={180}
                    />
                  </Suspense>
                  <Suspense
                    fallback={
                      <View style={styles.chartLoader}>
                        <ActivityIndicator color={colors.tint} />
                      </View>
                    }
                  >
                    <LineChart
                      data={serviceTrendData}
                      title="Service Expenses"
                      color={colors.chart.service}
                      height={180}
                    />
                  </Suspense>
                </ResponsiveGrid>
              ) : (
                <>
                  <Suspense
                    fallback={
                      <View style={styles.chartLoader}>
                        <ActivityIndicator color={colors.tint} />
                      </View>
                    }
                  >
                    <LineChart
                      data={fuelTrendData}
                      title="Fuel Expenses"
                      color={colors.chart.fuel}
                      height={180}
                    />
                  </Suspense>
                  <Suspense
                    fallback={
                      <View style={styles.chartLoader}>
                        <ActivityIndicator color={colors.tint} />
                      </View>
                    }
                  >
                    <LineChart
                      data={serviceTrendData}
                      title="Service Expenses"
                      color={colors.chart.service}
                      height={180}
                    />
                  </Suspense>
                </>
              )}

              {layout.isDesktop ? (
                <ResponsiveGrid minItemWidth={400} spacing={16}>
                  <Suspense
                    fallback={
                      <View style={styles.chartLoader}>
                        <ActivityIndicator color={colors.tint} />
                      </View>
                    }
                  >
                    <PieChart
                      data={expenseBreakdownData}
                      title="Expense Breakdown"
                      height={250}
                    />
                  </Suspense>
                  {vehicleComparisonData.length > 0 && (
                    <Suspense
                      fallback={
                        <View style={styles.chartLoader}>
                          <ActivityIndicator color={colors.tint} />
                        </View>
                      }
                    >
                      <BarChart
                        data={vehicleComparisonData}
                        title="Expenses by Vehicle"
                        color={colors.chart.primary}
                        height={250}
                      />
                    </Suspense>
                  )}
                </ResponsiveGrid>
              ) : (
                <>
                  <Suspense
                    fallback={
                      <View style={styles.chartLoader}>
                        <ActivityIndicator color={colors.tint} />
                      </View>
                    }
                  >
                    <PieChart
                      data={expenseBreakdownData}
                      title="Expense Breakdown"
                      height={250}
                    />
                  </Suspense>
                  {vehicleComparisonData.length > 0 && (
                    <Suspense
                      fallback={
                        <View style={styles.chartLoader}>
                          <ActivityIndicator color={colors.tint} />
                        </View>
                      }
                    >
                      <BarChart
                        data={vehicleComparisonData}
                        title="Expenses by Vehicle"
                        color={colors.chart.primary}
                        height={250}
                      />
                    </Suspense>
                  )}
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </WebLayout>
    </SafeAreaView>
  );
}
