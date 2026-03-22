import { IconSymbol } from "@/components/ui/icon-symbol";
import { SkeletonDashboard } from "@/components/ui/Skeleton";
import { router } from "expo-router";
import React from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createStyleSheet, useStyles } from "react-native-unistyles";

import { ActivityTimelineItem } from "@/components/dashboard/ActivityTimelineItem";
import { QuickActionButton } from "@/components/dashboard/QuickActionButton";
import { StatCard } from "@/components/dashboard/StatCard";
import { VehicleCard } from "@/components/dashboard/VehicleCard";
import { VehicleTable } from "@/components/dashboard/VehicleTable";
import { useDashboardDataQuery } from "@/hooks/useDashboardDataQuery";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { MaxWidthContainer } from "@/components/layout/MaxWidthContainer";
import { ResponsiveGrid } from "@/components/layout/ResponsiveGrid";

export default function DashboardScreen() {
  const { styles, theme } = useStyles(stylesheet);
  const layout = useResponsiveLayout();
  const {
    stats,
    vehicles,
    recentActivity,
    loading,
    refreshing,
    error,
    user,
    onRefresh,
  } = useDashboardDataQuery();

  // Show skeleton only on initial load, not on refetch
  // This prevents full-page re-renders and improves perceived performance
  const isInitialLoading = loading && !vehicles.length && !stats.totalVehicles;

  // Error state - only show if we have no cached data
  if (error && vehicles.length === 0 && !isInitialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <MaxWidthContainer>
          {/* Header - rendered immediately for fast LCP */}
          <View style={styles.header}>
            <Text style={styles.greeting}>
              Hi, Welcome {user?.profile?.full_name?.split(" ")[0] || "back"}
            </Text>
            <Text style={styles.subtitle}>
              {user?.lastSignInAt
                ? `Last login: ${new Date(user.lastSignInAt).toLocaleString("en-GB")}`
                : "Welcome to your dashboard"}
            </Text>
          </View>
          <View style={styles.errorContainer}>
            <IconSymbol
              name="exclamationmark.triangle"
              size={48}
              color={theme.colors.error}
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </MaxWidthContainer>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <MaxWidthContainer>
        {/* Header - rendered immediately for fast LCP */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hi, Welcome {user?.profile?.full_name?.split(" ")[0] || "back"}
          </Text>
          <Text style={styles.subtitle}>
            {user?.lastSignInAt
              ? `Last login: ${new Date(user.lastSignInAt).toLocaleString("en-GB")}`
              : "Welcome to your dashboard"}
          </Text>
        </View>

        {isInitialLoading ? (
          <SkeletonDashboard />
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {/* Stats Grid Section */}
            <View style={styles.section}>
              <ResponsiveGrid
                columns={{ mobile: 2, tablet: 2, desktop: 4, largeDesktop: 4 }}
                spacing={16}
              >
                <StatCard
                  title="Active Vehicles"
                  value={stats.totalVehicles}
                  icon="car.fill"
                  iconColor={theme.colors.error}
                  trend={stats.totalVehiclesTrend}
                />
                <StatCard
                  title="Monthly Fuel Cost"
                  value={`RM${stats.monthlyFuelCost.toFixed(2)}`}
                  icon="fuelpump.fill"
                  iconColor={theme.colors.error}
                  trend={stats.monthlyFuelCostTrend}
                />
                <StatCard
                  title="Pending Services"
                  value={stats.upcomingServices}
                  icon="wrench.fill"
                  iconColor={theme.colors.error}
                  alertCount={
                    stats.upcomingServices > 0
                      ? stats.upcomingServices
                      : undefined
                  }
                />
                <StatCard
                  title="Total Distance"
                  value={`${stats.totalMileage.toLocaleString()} km`}
                  icon="exclamationmark.triangle.fill"
                  iconColor={theme.colors.warning}
                  trend={stats.totalMileageTrend}
                />
              </ResponsiveGrid>
            </View>

            {/* Quick Actions Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <ResponsiveGrid
                columns={{ mobile: 2, tablet: 4, desktop: 4, largeDesktop: 4 }}
                spacing={12}
              >
                <QuickActionButton
                  title="Add Fuel"
                  icon="fuelpump.fill"
                  color={theme.colors.warning}
                  onPress={() => router.push("/logs/fuel/add" as any)}
                />
                <QuickActionButton
                  title="Log Service"
                  icon="wrench.fill"
                  color={theme.colors.error}
                  onPress={() => router.push("/logs/service/add" as any)}
                />
                <QuickActionButton
                  title="Update Mileage"
                  icon="speedometer"
                  color={theme.colors.primary}
                  onPress={() => router.push("/logs/mileage/add" as any)}
                />
                <QuickActionButton
                  title="Add Vehicle"
                  icon="plus.circle.fill"
                  color={theme.colors.success}
                  onPress={() => router.push("/vehicles/add" as any)}
                />
              </ResponsiveGrid>
            </View>

            {/* Two-Column Layout: Vehicles + Activity */}
            <View style={styles.twoColumnContainer}>
              {/* Vehicles Section */}
              <View style={[styles.section, styles.vehiclesColumn]}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>My Vehicles</Text>
                  {vehicles.length > 0 && (
                    <TouchableOpacity
                      onPress={() => router.push("/vehicles" as any)}
                    >
                      <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {vehicles.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>🚗</Text>
                    <Text style={styles.emptyTitle}>No vehicles yet</Text>
                    <Text style={styles.emptyDescription}>
                      Add your first vehicle to start tracking
                    </Text>
                    <TouchableOpacity
                      style={styles.emptyButton}
                      onPress={() => router.push("/vehicles/add" as any)}
                    >
                      <IconSymbol
                        name="plus"
                        size={18}
                        color={theme.colors.white}
                      />
                      <Text style={styles.emptyButtonText}>Add Vehicle</Text>
                    </TouchableOpacity>
                  </View>
                ) : layout.isDesktop ? (
                  <VehicleTable vehicles={vehicles} />
                ) : (
                  <View style={styles.vehiclesList}>
                    {vehicles.slice(0, 3).map((vehicle) => (
                      <VehicleCard key={vehicle.id} vehicle={vehicle} />
                    ))}
                  </View>
                )}
              </View>

              {/* Recent Activity */}
              {recentActivity.length > 0 && (
                <View style={[styles.section, styles.activityColumn]}>
                  <View style={styles.activityCard}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    <View style={styles.activityTimeline}>
                      {recentActivity.slice(0, 4).map((item) => (
                        <ActivityTimelineItem key={item.id} item={item} />
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </MaxWidthContainer>
    </SafeAreaView>
  );
}

// Stylesheet is now much smaller!
// It only contains styles for the screen layout itself.
const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.error,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  greeting: {
    fontSize: theme.fontSize["3xl"],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
  },
  section: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  viewAllText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  quickActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  twoColumnContainer: {
    flexDirection: {
      xs: "column" as const,
      lg: "row" as const,
    },
    gap: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
  },
  vehiclesColumn: {
    flex: {
      xs: undefined,
      lg: 2,
    },
    paddingHorizontal: 0,
  },
  activityColumn: {
    flex: {
      xs: undefined,
      lg: 1,
    },
    paddingHorizontal: 0,
  },
  activityCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
  },
  vehiclesList: {
    gap: theme.spacing.md,
  },
  activityTimeline: {
    gap: theme.spacing.md,
  },
  // Empty state styles
  emptyState: {
    alignItems: "center",
    paddingVertical: theme.spacing.xxxl,
    gap: theme.spacing.md,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  emptyDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: "center",
    maxWidth: 300,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.md,
  },
  emptyButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
}));
