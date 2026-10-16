import { IconSymbol } from "@/components/ui/icon-symbol";
import { SkeletonDashboard } from "@/components/ui/Skeleton";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { createStyleSheet, useStyles } from "react-native-unistyles";

import { ActivityTimelineItem } from "@/components/dashboard/ActivityTimelineItem";
import { QuickActionButton } from "@/components/dashboard/QuickActionButton";
import { StatCard } from "@/components/dashboard/StatCard";
import { VehicleCard } from "@/components/dashboard/VehicleCard";
import { VehicleTable } from "@/components/dashboard/VehicleTable";
import { ServiceAttentionPanel } from "@/components/dashboard/ServiceAttentionPanel";
import { useDashboardDataQuery } from "@/hooks/useDashboardDataQuery";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { webPageStyles } from "@/components/layout/webPageStyles";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { NotificationPopup } from "@/components/ui/NotificationPopup";
import { MaxWidthContainer } from "@/components/layout/MaxWidthContainer";
import { ResponsiveGrid } from "@/components/layout/ResponsiveGrid";
import { HomeVehicleSearch } from "@/components/dashboard/HomeVehicleSearch";
import { HomeFuelTrend } from "@/components/dashboard/HomeFuelTrend";

export default function DashboardScreen() {
  const { styles, theme } = useStyles(stylesheet);
  const { styles: web } = useStyles(webPageStyles);
  const layout = useResponsiveLayout();
  const isWebPage = layout.isWeb && !layout.isMobile;
  const isMobileLayout = !layout.isWeb || layout.isMobile;
  const isDesktopWeb = layout.isWeb && layout.isDesktop;
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const mobileColumns =
    width - insets.left - insets.right - 32 < 328 || fontScale >= 1.3 ? 1 : 2;
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  useEffect(() => {
    if (!isMobileLayout) setNotificationsVisible(false);
  }, [isMobileLayout]);
  const queryClient = useQueryClient();
  const [fuelTrendMonths, setFuelTrendMonths] = useState<6 | 12>(6);
  const hasFocused = useRef(false);
  const {
    stats,
    vehicles,
    recentActivity,
    serviceReminders,
    remindersLoading,
    remindersError,
    fuelCostTrend,
    fuelTrendLoading,
    fuelTrendError,
    loading,
    refreshing,
    error,
    user,
    onRefresh,
  } = useDashboardDataQuery(fuelTrendMonths);
  const firstName = user?.profile?.full_name?.split(" ")[0];
  useFocusEffect(
    useCallback(() => {
      if (hasFocused.current) {
        void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      } else {
        hasFocused.current = true;
      }
      return () => setNotificationsVisible(false);
    }, [queryClient]),
  );

  // Show skeleton only on initial load, not on refetch
  // This prevents full-page re-renders and improves perceived performance
  const isInitialLoading = loading && !vehicles.length;

  const homeHeader = (
    <View style={[styles.header, isMobileLayout && styles.mobileHeader]}>
      <View style={styles.headerRow}>
        <View style={isMobileLayout && styles.mobileGreeting}>
          <Text style={styles.greeting}>
            Welcome back{firstName ? `, ${firstName}` : ""}
          </Text>
          <Text style={styles.subtitle}>Your vehicles at a glance</Text>
        </View>
        {isMobileLayout && (
          <NotificationBell onPress={() => setNotificationsVisible(true)} />
        )}
      </View>
      {!!vehicles.length && (
        <View style={styles.mobileSearch}>
          <HomeVehicleSearch vehicles={vehicles} />
        </View>
      )}
    </View>
  );
  const quickActions = (
    <View
      style={[
        styles.actionsCard,
        isWebPage && web.panel,
        isMobileLayout && styles.mobileActionsCard,
        isDesktopWeb && styles.actionsCardFill,
      ]}
    >
      <View style={styles.cardHeading}>
        <View>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          {isDesktopWeb && (
            <Text style={styles.cardSubtitle}>
              Common tasks for your vehicles
            </Text>
          )}
        </View>
      </View>
      <ResponsiveGrid
        columns={{
          mobile: isMobileLayout ? mobileColumns : 2,
          tablet: isMobileLayout ? mobileColumns : 2,
          desktop: isMobileLayout ? mobileColumns : 2,
          largeDesktop: isMobileLayout ? mobileColumns : 2,
        }}
        spacing={12}
      >
        <QuickActionButton
          title="Add Fuel"
          icon="fuelpump.fill"
          color={theme.colors.warning}
          description={isDesktopWeb ? "Record fuel purchase" : undefined}
          onPress={() => router.push("/logs/fuel/add" as any)}
        />
        <QuickActionButton
          title="Log Service"
          icon="wrench.fill"
          color={theme.colors.error}
          description={isDesktopWeb ? "Record maintenance" : undefined}
          onPress={() => router.push("/logs/service/add" as any)}
        />
        <QuickActionButton
          title="Update Mileage"
          icon="speedometer"
          color={theme.colors.primary}
          description={isDesktopWeb ? "Add current mileage" : undefined}
          onPress={() => router.push("/logs/mileage/add" as any)}
        />
        <QuickActionButton
          title="Add Vehicle"
          icon="plus.circle.fill"
          color={theme.colors.success}
          description={isDesktopWeb ? "Register a vehicle" : undefined}
          onPress={() => router.push("/vehicles/add" as any)}
        />
      </ResponsiveGrid>
    </View>
  );
  const vehiclesSection = (
    <View
      style={[
        styles.section,
        styles.vehiclesColumn,
        isDesktopWeb && styles.vehiclesPanel,
        isWebPage && web.panel,
        isMobileLayout && styles.mobileSection,
      ]}
    >
      <View
        style={[
          styles.sectionHeader,
          isMobileLayout && { flexWrap: "wrap", gap: 8 },
        ]}
      >
        <View style={[styles.cardHeading, styles.vehiclesHeading]}>
          <View>
            <Text
              style={[
                styles.sectionTitle,
                isDesktopWeb && styles.cardTitle,
                isMobileLayout && { marginBottom: 0 },
              ]}
            >
              My Vehicles
            </Text>
            {isDesktopWeb && (
              <Text style={styles.cardSubtitle}>
                Manage and view all your vehicles
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          style={[
            isDesktopWeb && styles.viewAllButton,
            isMobileLayout && {
              minHeight: 48,
              minWidth: 48,
              justifyContent: "center",
            },
          ]}
          onPress={() => router.push("/vehicles" as any)}
        >
          <Text style={styles.viewAllText}>View All</Text>
          {isDesktopWeb && (
            <IconSymbol
              name="chevron.right"
              size={14}
              color={theme.colors.primary}
            />
          )}
        </TouchableOpacity>
      </View>

      {isDesktopWeb ? (
        <VehicleTable vehicles={vehicles.slice(0, 5)} />
      ) : (
        <View style={styles.vehiclesList}>
          {vehicles.slice(0, 3).map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </View>
      )}
    </View>
  );
  const fuelTrend = (
    <HomeFuelTrend
      points={fuelCostTrend}
      months={fuelTrendMonths}
      onMonthsChange={setFuelTrendMonths}
      loading={fuelTrendLoading}
      error={fuelTrendError}
    />
  );
  const activitySection = recentActivity.length > 0 && (
    <View
      style={[
        styles.section,
        styles.activityColumn,
        isMobileLayout && styles.mobileSection,
      ]}
    >
      <View style={[styles.activityCard, isWebPage && web.panel]}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityTimeline}>
          {recentActivity.slice(0, 5).map((item) => (
            <ActivityTimelineItem key={item.id} item={item} />
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={styles.container}
      edges={isMobileLayout ? ["top", "left", "right"] : ["top"]}
    >
      <MaxWidthContainer
        fullWidth
        style={isWebPage ? web.frame : styles.pageWidth}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isMobileLayout && styles.mobileScrollContent,
          ]}
          keyboardShouldPersistTaps={isMobileLayout ? "handled" : undefined}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {isMobileLayout && homeHeader}
          {isInitialLoading ? (
            <SkeletonDashboard />
          ) : error && vehicles.length === 0 ? (
            <View style={styles.errorContainer}>
              <IconSymbol
                name="exclamationmark.triangle"
                size={48}
                color={theme.colors.error}
              />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.retryButton}
                onPress={onRefresh}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : vehicles.length === 0 ? (
            <View
              style={[
                styles.section,
                isWebPage && web.section,
                isMobileLayout && styles.mobileSection,
              ]}
            >
              <View style={styles.emptyState}>
                <IconSymbol
                  name="car.fill"
                  size={48}
                  color={theme.colors.primary}
                />
                <Text style={styles.emptyTitle}>
                  Start with your first vehicle
                </Text>
                <Text style={styles.emptyDescription}>
                  Add a vehicle to see its costs, activity, and service
                  reminders here.
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push("/vehicles/add" as any)}
                  accessibilityRole="button"
                >
                  <IconSymbol
                    name="plus"
                    size={18}
                    color={theme.colors.white}
                  />
                  <Text style={styles.emptyButtonText}>Add Vehicle</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              {!remindersLoading &&
                !remindersError &&
                serviceReminders.length > 0 && (
                  <View
                    style={[
                      styles.section,
                      isWebPage && web.section,
                      isMobileLayout && styles.mobileSection,
                    ]}
                  >
                    <ServiceAttentionPanel reminders={serviceReminders} />
                  </View>
                )}

              <View
                style={[
                  styles.section,
                  isWebPage && web.section,
                  isMobileLayout && styles.mobileSection,
                ]}
              >
                <ResponsiveGrid
                  columns={{
                    mobile: isMobileLayout ? mobileColumns : 2,
                    tablet: isMobileLayout ? mobileColumns : 2,
                    desktop: isMobileLayout ? mobileColumns : 4,
                    largeDesktop: isMobileLayout ? mobileColumns : 4,
                  }}
                  spacing={12}
                >
                  <StatCard
                    title="Active Vehicles"
                    value={vehicles.length}
                    icon="car.fill"
                    iconColor={theme.colors.primary}
                  />
                  <StatCard
                    title="Monthly Fuel Cost"
                    value={`RM${stats.monthlyFuelCost.toFixed(2)}`}
                    icon="fuelpump.fill"
                    iconColor={theme.colors.warning}
                  />
                  <StatCard
                    title="Services Due"
                    value={
                      remindersLoading || remindersError
                        ? "—"
                        : serviceReminders.length
                    }
                    icon="wrench.fill"
                    iconColor={theme.colors.error}
                  />
                  <StatCard
                    title="Total Recorded Mileage"
                    value={`${stats.totalMileage.toLocaleString()} km`}
                    icon="speedometer"
                    iconColor={theme.colors.primary}
                  />
                </ResponsiveGrid>
              </View>

              {isMobileLayout ? (
                <>
                  <View style={[styles.section, styles.mobileSection]}>
                    {quickActions}
                  </View>
                  {vehiclesSection}
                  <View style={[styles.section, styles.mobileSection]}>
                    {fuelTrend}
                  </View>
                  {activitySection}
                </>
              ) : (
                <>
                  <View style={[styles.section, styles.featureRow]}>
                    <View style={styles.chartColumn}>{fuelTrend}</View>
                    <View style={styles.actionsColumn}>{quickActions}</View>
                  </View>
                  <View style={styles.twoColumnContainer}>
                    {vehiclesSection}
                    {activitySection}
                  </View>
                </>
              )}
            </>
          )}
        </ScrollView>
      </MaxWidthContainer>
      {isMobileLayout && (
        <NotificationPopup
          visible={notificationsVisible}
          onClose={() => setNotificationsVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  mobileHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  mobileGreeting: { flex: 1, minWidth: 0 },
  mobileSection: { paddingHorizontal: 16, marginBottom: 24, flex: undefined },
  mobileScrollContent: { flexGrow: 1, paddingBottom: 24 },
  mobileActionsCard: {
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
  },
  pageWidth: { width: "100%", maxWidth: 1480, alignSelf: "center" },
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
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    zIndex: 30,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
  },
  mobileSearch: { marginTop: theme.spacing.md },
  featureRow: {
    flexDirection: { xs: "column" as const, lg: "row" as const },
    gap: theme.spacing.md,
  },
  chartColumn: { flex: { xs: undefined, lg: 1.5 }, minWidth: 0 },
  actionsColumn: { flex: { xs: undefined, lg: 1 }, minWidth: 0 },
  actionsCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
  },
  actionsCardFill: { flex: 1 },
  cardHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  vehiclesHeading: { marginBottom: 0 },
  cardTitle: {
    marginBottom: 0,
    color: theme.colors.text,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
  },
  cardSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    marginTop: 2,
  },
  greeting: {
    fontSize: theme.fontSize["2xl"],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
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
  viewAllButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
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
  vehiclesPanel: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
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
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
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
