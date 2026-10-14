import { IconSymbol } from "@/components/ui/icon-symbol";
import { SkeletonDashboard } from "@/components/ui/Skeleton";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Image } from "expo-image";
import React, { useCallback, useRef, useState } from "react";
import {
  Modal,
  Pressable,
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
import { ServiceAttentionPanel } from "@/components/dashboard/ServiceAttentionPanel";
import { useDashboardDataQuery } from "@/hooks/useDashboardDataQuery";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { MaxWidthContainer } from "@/components/layout/MaxWidthContainer";
import { ResponsiveGrid } from "@/components/layout/ResponsiveGrid";
import { HomeVehicleSearch } from "@/components/dashboard/HomeVehicleSearch";
import { HomeFuelTrend } from "@/components/dashboard/HomeFuelTrend";
import { useNotifications } from "@/lib/contexts/NotificationContext";
import { NotificationPopup } from "@/components/ui/NotificationPopup";
import { SidebarBadge } from "@/components/ui/SidebarBadge";
import { profileInitials } from "@/lib/utils/profileInitials";

export default function DashboardScreen() {
  const { styles, theme } = useStyles(stylesheet);
  const layout = useResponsiveLayout();
  const queryClient = useQueryClient();
  const { unreadCount } = useNotifications();
  const notificationButtonRef =
    useRef<React.ElementRef<typeof TouchableOpacity>>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const profileButtonRef =
    useRef<React.ElementRef<typeof TouchableOpacity>>(null);
  const [profileAnchor, setProfileAnchor] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [fuelTrendMonths, setFuelTrendMonths] = useState<6 | 12>(6);
  const [avatarError, setAvatarError] = useState(false);
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
  const avatarUrl = user?.profile?.avatar_url;
  const profileName =
    user?.profile?.full_name?.trim() ||
    user?.profile?.username ||
    user?.email?.split("@")[0] ||
    "User";

  React.useEffect(() => setAvatarError(false), [avatarUrl]);

  useFocusEffect(
    useCallback(() => {
      if (hasFocused.current) {
        void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      } else {
        hasFocused.current = true;
      }
    }, [queryClient]),
  );

  // Show skeleton only on initial load, not on refetch
  // This prevents full-page re-renders and improves perceived performance
  const isInitialLoading = loading && !vehicles.length;

  // Error state - only show if we have no cached data
  if (error && vehicles.length === 0 && !isInitialLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <MaxWidthContainer fullWidth style={styles.pageWidth}>
          {/* Header - rendered immediately for fast LCP */}
          <View style={styles.header}>
            <Text style={styles.greeting}>
              Welcome back{firstName ? `, ${firstName}` : ""}
            </Text>
            <Text style={styles.subtitle}>Your vehicles at a glance</Text>
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <MaxWidthContainer fullWidth style={styles.pageWidth}>
        {/* Header - rendered immediately for fast LCP */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>
                Welcome back{firstName ? `, ${firstName}` : ""}
              </Text>
              <Text style={styles.subtitle}>Your vehicles at a glance</Text>
            </View>
            {layout.isDesktop && (
              <View style={styles.headerControls}>
                {!!vehicles.length && (
                  <View style={styles.desktopSearch}>
                    <HomeVehicleSearch vehicles={vehicles} />
                  </View>
                )}
                <TouchableOpacity
                  ref={notificationButtonRef}
                  style={styles.headerIconButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
                  accessibilityState={{ expanded: notificationAnchor !== null }}
                  onPress={() =>
                    notificationButtonRef.current?.measureInWindow(
                      (x, y, width, height) =>
                        setNotificationAnchor({
                          top: y + height + 8,
                          left: x + width - 360,
                        }),
                    )
                  }
                >
                  <IconSymbol
                    name="bell.fill"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                  {unreadCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <SidebarBadge count={unreadCount} />
                    </View>
                  )}
                </TouchableOpacity>
                {notificationAnchor && (
                  <NotificationPopup
                    visible
                    anchorPosition={notificationAnchor}
                    onClose={() => setNotificationAnchor(null)}
                  />
                )}
                <TouchableOpacity
                  ref={profileButtonRef}
                  style={styles.profileButton}
                  accessibilityRole="button"
                  accessibilityLabel="Profile menu"
                  accessibilityState={{ expanded: profileAnchor !== null }}
                  onPress={() =>
                    profileButtonRef.current?.measureInWindow(
                      (x, y, width, height) =>
                        setProfileAnchor({
                          top: y + height + 8,
                          left: Math.max(
                            12,
                            Math.min(x + width - 280, layout.screenWidth - 292),
                          ),
                        }),
                    )
                  }
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarInitials}>
                      {profileInitials(profileName)}
                    </Text>
                    {avatarUrl && !avatarError && (
                      <Image
                        source={{ uri: avatarUrl }}
                        style={styles.avatarImage}
                        contentFit="cover"
                        onError={() => setAvatarError(true)}
                      />
                    )}
                  </View>
                </TouchableOpacity>
                <Modal
                  visible={profileAnchor !== null}
                  transparent
                  animationType="none"
                  onRequestClose={() => setProfileAnchor(null)}
                >
                  <Pressable
                    style={styles.menuOverlay}
                    onPress={() => setProfileAnchor(null)}
                  >
                    <Pressable
                      style={[
                        styles.profileMenu,
                        profileAnchor && {
                          top: profileAnchor.top,
                          left: profileAnchor.left,
                        },
                      ]}
                      onPress={(event) => event.stopPropagation()}
                    >
                      <View style={styles.profileMenuIdentity}>
                        <Text style={styles.profileMenuText}>
                          {profileName}
                        </Text>
                        <Text style={styles.profileMenuEmail}>
                          {user?.email}
                        </Text>
                      </View>
                      {(["Profile", "Settings"] as const).map((tab) => (
                        <TouchableOpacity
                          key={tab}
                          style={styles.profileMenuItem}
                          accessibilityRole="button"
                          accessibilityLabel={tab}
                          onPress={() => {
                            setProfileAnchor(null);
                            router.push({
                              pathname: "/profile",
                              params: { tab },
                            });
                          }}
                        >
                          <Text style={styles.profileMenuText}>{tab}</Text>
                        </TouchableOpacity>
                      ))}
                    </Pressable>
                  </Pressable>
                </Modal>
              </View>
            )}
          </View>
          {!layout.isDesktop && !!vehicles.length && (
            <View style={styles.mobileSearch}>
              <HomeVehicleSearch vehicles={vehicles} />
            </View>
          )}
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
            {vehicles.length === 0 ? (
              <View style={styles.section}>
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
                    <View style={styles.section}>
                      <ServiceAttentionPanel reminders={serviceReminders} />
                    </View>
                  )}

                <View style={styles.section}>
                  <ResponsiveGrid
                    columns={{
                      mobile: 2,
                      tablet: 2,
                      desktop: 4,
                      largeDesktop: 4,
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

                <View style={[styles.section, styles.featureRow]}>
                  <View style={styles.chartColumn}>
                    <HomeFuelTrend
                      points={fuelCostTrend}
                      months={fuelTrendMonths}
                      onMonthsChange={setFuelTrendMonths}
                      loading={fuelTrendLoading}
                      error={fuelTrendError}
                    />
                  </View>
                  <View style={styles.actionsColumn}>
                    <View
                      style={[
                        styles.actionsCard,
                        layout.isDesktop && styles.actionsCardFill,
                      ]}
                    >
                      <View style={styles.cardHeading}>
                        <View>
                          <Text style={styles.cardTitle}>Quick Actions</Text>
                          {layout.isDesktop && (
                            <Text style={styles.cardSubtitle}>
                              Common tasks for your vehicles
                            </Text>
                          )}
                        </View>
                      </View>
                      <ResponsiveGrid
                        columns={{
                          mobile: 2,
                          tablet: 2,
                          desktop: 2,
                          largeDesktop: 2,
                        }}
                        spacing={12}
                      >
                        <QuickActionButton
                          title="Add Fuel"
                          icon="fuelpump.fill"
                          color={theme.colors.warning}
                          description={
                            layout.isDesktop
                              ? "Record fuel purchase"
                              : undefined
                          }
                          onPress={() => router.push("/logs/fuel/add" as any)}
                        />
                        <QuickActionButton
                          title="Log Service"
                          icon="wrench.fill"
                          color={theme.colors.error}
                          description={
                            layout.isDesktop ? "Record maintenance" : undefined
                          }
                          onPress={() =>
                            router.push("/logs/service/add" as any)
                          }
                        />
                        <QuickActionButton
                          title="Update Mileage"
                          icon="speedometer"
                          color={theme.colors.primary}
                          description={
                            layout.isDesktop ? "Add current mileage" : undefined
                          }
                          onPress={() =>
                            router.push("/logs/mileage/add" as any)
                          }
                        />
                        <QuickActionButton
                          title="Add Vehicle"
                          icon="plus.circle.fill"
                          color={theme.colors.success}
                          description={
                            layout.isDesktop ? "Register a vehicle" : undefined
                          }
                          onPress={() => router.push("/vehicles/add" as any)}
                        />
                      </ResponsiveGrid>
                    </View>
                  </View>
                </View>

                <View style={styles.twoColumnContainer}>
                  {/* Vehicles Section */}
                  <View
                    style={[
                      styles.section,
                      styles.vehiclesColumn,
                      layout.isDesktop && styles.vehiclesPanel,
                    ]}
                  >
                    <View style={styles.sectionHeader}>
                      <View
                        style={[styles.cardHeading, styles.vehiclesHeading]}
                      >
                        <View>
                          <Text
                            style={[
                              styles.sectionTitle,
                              layout.isDesktop && styles.cardTitle,
                            ]}
                          >
                            My Vehicles
                          </Text>
                          {layout.isDesktop && (
                            <Text style={styles.cardSubtitle}>
                              Manage and view all your vehicles
                            </Text>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity
                        accessibilityRole="button"
                        style={layout.isDesktop && styles.viewAllButton}
                        onPress={() => router.push("/vehicles" as any)}
                      >
                        <Text style={styles.viewAllText}>View All</Text>
                        {layout.isDesktop && (
                          <IconSymbol
                            name="chevron.right"
                            size={14}
                            color={theme.colors.primary}
                          />
                        )}
                      </TouchableOpacity>
                    </View>

                    {layout.isDesktop ? (
                      <VehicleTable vehicles={vehicles.slice(0, 3)} />
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
                          {recentActivity.slice(0, 5).map((item) => (
                            <ActivityTimelineItem key={item.id} item={item} />
                          ))}
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        )}
      </MaxWidthContainer>
    </SafeAreaView>
  );
}

// Stylesheet is now much smaller!
// It only contains styles for the screen layout itself.
const stylesheet = createStyleSheet((theme) => ({
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
  headerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  desktopSearch: { width: 290 },
  mobileSearch: { marginTop: theme.spacing.md },
  headerIconButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },
  notificationBadge: {
    position: "absolute",
    top: -5,
    right: -5,
  },
  profileButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  menuOverlay: { flex: 1 },
  profileMenu: {
    position: "absolute",
    width: 280,
    padding: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
  },
  profileMenuItem: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  profileMenuText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  profileMenuIdentity: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.xs,
  },
  profileMenuEmail: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.xs,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { position: "absolute", width: "100%", height: "100%" },
  avatarInitials: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
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
