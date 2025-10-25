import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Database } from "@/types/database";
import supabase from "@/services/supabaseClient";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createStyleSheet, useStyles } from "react-native-unistyles";

// Type definitions
type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type MileageLog = Database["public"]["Tables"]["mileage_logs"]["Row"];
type FuelLog = Database["public"]["Tables"]["fuel_logs"]["Row"];
type ServiceLog = Database["public"]["Tables"]["service_logs"]["Row"];

interface VehicleWithShares extends Vehicle {
  shareCount: number;
}

interface DashboardStats {
  totalVehicles: number;
  totalMileage: number;
  monthlyFuelCost: number;
  upcomingServices: number;
  totalVehiclesTrend: number;
  totalMileageTrend: number;
  monthlyFuelCostTrend: number;
  upcomingServicesTrend: number;
}

interface ActivityItem {
  id: string;
  type: "mileage" | "fuel" | "service";
  date: string;
  vehicleName: string;
  primaryValue: string;
  icon: string;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { styles, theme } = useStyles(stylesheet);

  // State management
  const [vehicles, setVehicles] = useState<VehicleWithShares[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    totalMileage: 0,
    monthlyFuelCost: 0,
    upcomingServices: 0,
    totalVehiclesTrend: 0,
    totalMileageTrend: 0,
    monthlyFuelCostTrend: 0,
    upcomingServicesTrend: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      // Get total vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("current_mileage")
        .eq("user_id", user.id);

      if (vehiclesError) throw vehiclesError;

      const totalVehicles = vehiclesData?.length || 0;
      const totalMileage =
        vehiclesData?.reduce(
          (sum, v) => sum + ((v as any).current_mileage || 0),
          0,
        ) || 0;

      // Get monthly fuel cost (current month)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: fuelData, error: fuelError } = await supabase
        .from("fuel_logs")
        .select("cost")
        .eq("user_id", user.id)
        .gte("date", startOfMonth.toISOString());

      if (fuelError) throw fuelError;

      const monthlyFuelCost =
        fuelData?.reduce((sum, f) => sum + ((f as any).cost || 0), 0) || 0;

      // Get upcoming services (services due in next 30 days)
      const now = new Date();
      const thirtyDaysLater = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000,
      );

      const { data: servicesData, error: servicesError } = await supabase
        .from("service_logs")
        .select("next_service_due")
        .eq("user_id", user.id)
        .gte("next_service_due", now.toISOString())
        .lte("next_service_due", thirtyDaysLater.toISOString());

      if (servicesError) throw servicesError;

      const upcomingServices = servicesData?.length || 0;

      // Calculate trends (mock for now - can be enhanced with historical data)
      setStats({
        totalVehicles,
        totalMileage,
        monthlyFuelCost,
        upcomingServices,
        totalVehiclesTrend: 0,
        totalMileageTrend: 5.2,
        monthlyFuelCostTrend: -3.1,
        upcomingServicesTrend: 0,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("Failed to load dashboard statistics");
    }
  }, [user]);

  // Fetch vehicles with share information
  const fetchVehicles = useCallback(async () => {
    if (!user) return;

    try {
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from("vehicles")
        .select(
          `
          *,
          vehicle_group_shares(count)
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (vehiclesError) throw vehiclesError;

      // Transform data to include share count
      const vehiclesWithShares: VehicleWithShares[] =
        vehiclesData?.map((v: any) => ({
          ...v,
          shareCount: v.vehicle_group_shares?.[0]?.count || 0,
        })) || [];

      setVehicles(vehiclesWithShares);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      setError("Failed to load vehicles");
    }
  }, [user]);

  // Fetch recent activity timeline
  const fetchRecentActivity = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch recent mileage logs
      const { data: mileageLogs } = await supabase
        .from("mileage_logs")
        .select(
          `
          id,
          date,
          odometer_reading,
          vehicle_id,
          vehicles(make, model, year)
        `,
        )
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(5);

      // Fetch recent fuel logs
      const { data: fuelLogs } = await supabase
        .from("fuel_logs")
        .select(
          `
          id,
          date,
          cost,
          liters_filled,
          vehicle_id,
          vehicles(make, model, year)
        `,
        )
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(5);

      // Fetch recent service logs
      const { data: serviceLogs } = await supabase
        .from("service_logs")
        .select(
          `
          id,
          date,
          service_type,
          cost,
          vehicle_id,
          vehicles(make, model, year)
        `,
        )
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(5);

      // Combine and sort all activities
      const activities: ActivityItem[] = [];

      mileageLogs?.forEach((log: any) => {
        activities.push({
          id: log.id,
          type: "mileage",
          date: log.date,
          vehicleName: `${log.vehicles?.year} ${log.vehicles?.make} ${log.vehicles?.model}`,
          primaryValue: `${log.odometer_reading.toLocaleString()} km`,
          icon: "speedometer",
        });
      });

      fuelLogs?.forEach((log: any) => {
        activities.push({
          id: log.id,
          type: "fuel",
          date: log.date,
          vehicleName: `${log.vehicles?.year} ${log.vehicles?.make} ${log.vehicles?.model}`,
          primaryValue: `RM${log.cost?.toFixed(2) || "0.00"} • ${log.liters_filled}L`,
          icon: "fuelpump.fill",
        });
      });

      serviceLogs?.forEach((log: any) => {
        activities.push({
          id: log.id,
          type: "service",
          date: log.date,
          vehicleName: `${log.vehicles?.year} ${log.vehicles?.make} ${log.vehicles?.model}`,
          primaryValue: `${log.service_type} • RM${log.cost?.toFixed(2) || "0.00"}`,
          icon: "wrench.fill",
        });
      });

      // Sort by date and take top 5
      activities.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      setRecentActivity(activities.slice(0, 5));
    } catch (err) {
      console.error("Error fetching recent activity:", err);
    }
  }, [user]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setError(null);
    await Promise.all([fetchStats(), fetchVehicles(), fetchRecentActivity()]);
    setLoading(false);
  }, [fetchStats, fetchVehicles, fetchRecentActivity]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Format relative time
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get activity color
  const getActivityColor = (type: ActivityItem["type"]): string => {
    switch (type) {
      case "fuel":
        return theme.colors.warning;
      case "service":
        return theme.colors.error;
      case "mileage":
        return theme.colors.primary;
      default:
        return theme.colors.primary;
    }
  };

  // Stat Card Component
  const StatCard = ({
    title,
    value,
    icon,
    trend,
  }: {
    title: string;
    value: string | number;
    icon: string;
    trend?: number;
  }) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Text style={styles.statIcon}>{icon}</Text>
        {trend !== undefined && trend !== 0 && (
          <View
            style={[
              styles.trendBadge,
              {
                backgroundColor:
                  trend > 0 ? theme.colors.success : theme.colors.error + "20",
              },
            ]}
          >
            <Text
              style={[
                styles.trendText,
                {
                  color: trend > 0 ? theme.colors.success : theme.colors.error,
                },
              ]}
            >
              {trend > 0 ? "+" : ""}
              {trend.toFixed(1)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  // Vehicle Card Component
  const VehicleCard = ({ vehicle }: { vehicle: VehicleWithShares }) => {
    const [imageError, setImageError] = useState(false);

    return (
      <TouchableOpacity
        style={styles.vehicleCard}
        onPress={() => router.push(`/vehicles/${vehicle.id}` as any)}
        accessibilityLabel={`View details for ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
      >
        {vehicle.main_image_url && !imageError ? (
          <Image
            source={{ uri: vehicle.main_image_url }}
            style={styles.vehicleImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.vehiclePlaceholder}>
            <IconSymbol
              name="car.fill"
              size={24}
              color={theme.colors.primary}
            />
          </View>
        )}
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName} numberOfLines={1}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </Text>
          <Text style={styles.vehicleDetail}>{vehicle.license_plate}</Text>
          {vehicle.current_mileage && (
            <Text style={styles.vehicleDetail}>
              {vehicle.current_mileage.toLocaleString()} km
            </Text>
          )}
          {vehicle.color && (
            <View style={styles.vehicleColorContainer}>
              <View
                style={[
                  styles.vehicleColorDot,
                  { backgroundColor: vehicle.color },
                ]}
              />
              <Text style={styles.vehicleDetail}>{vehicle.color}</Text>
            </View>
          )}
        </View>
        {vehicle.shareCount > 0 && (
          <View style={styles.sharedBadge}>
            <IconSymbol
              name="person.2.fill"
              size={12}
              color={theme.colors.white}
            />
            <Text style={styles.sharedBadgeText}>Shared</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Activity Timeline Item Component
  const ActivityTimelineItem = ({ item }: { item: ActivityItem }) => {
    const color = getActivityColor(item.type);

    return (
      <View style={styles.activityItem}>
        <View style={[styles.activityIcon, { backgroundColor: color + "15" }]}>
          <IconSymbol name={item.icon as any} size={20} color={color} />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityVehicle} numberOfLines={1}>
            {item.vehicleName}
          </Text>
          <Text style={styles.activityValue}>{item.primaryValue}</Text>
          <Text style={styles.activityTime}>
            {formatRelativeTime(item.date)}
          </Text>
        </View>
      </View>
    );
  };

  // Quick Action Button Component
  const QuickActionButton = ({
    title,
    icon,
    color,
    onPress,
  }: {
    title: string;
    icon: string;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={styles.quickAction}
      onPress={onPress}
      accessibilityLabel={title}
      accessibilityRole="button"
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color + "15" }]}>
        <IconSymbol name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.quickActionTitle} numberOfLines={2}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && vehicles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <IconSymbol
            name="exclamationmark.triangle"
            size={48}
            color={theme.colors.error}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Welcome
            {user?.profile?.full_name
              ? `, ${user.profile.full_name.split(" ")[0]}`
              : ""}
            !
          </Text>
          <Text style={styles.subtitle}>Track and manage your vehicles</Text>
        </View>

        {/* Stats Grid Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Vehicles"
              value={stats.totalVehicles}
              icon="🚗"
              trend={stats.totalVehiclesTrend}
            />
            <StatCard
              title="Total Mileage"
              value={`${stats.totalMileage.toLocaleString()} km`}
              icon="📊"
              trend={stats.totalMileageTrend}
            />
            <StatCard
              title="Monthly Fuel Cost"
              value={`RM${stats.monthlyFuelCost.toFixed(2)}`}
              icon="⛽"
              trend={stats.monthlyFuelCostTrend}
            />
            <StatCard
              title="Upcoming Services"
              value={stats.upcomingServices}
              icon="🔧"
              trend={stats.upcomingServicesTrend}
            />
          </View>
        </View>

        {/* Quick Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
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
          </View>
        </View>

        {/* Vehicles Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Vehicles</Text>
            {vehicles.length > 0 && (
              <TouchableOpacity onPress={() => router.push("/vehicles" as any)}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {vehicles.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🚗</Text>
              <Text style={styles.emptyTitle}>No vehicles yet</Text>
              <Text style={styles.emptyDescription}>
                Add your first vehicle to start tracking mileage, fuel, and
                maintenance
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push("/vehicles/add" as any)}
              >
                <IconSymbol name="plus" size={18} color={theme.colors.white} />
                <Text style={styles.emptyButtonText}>Add Vehicle</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.vehiclesList}>
              {vehicles.slice(0, 3).map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </View>
          )}
        </View>

        {/* Recent Activity Timeline */}
        {recentActivity.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.activityTimeline}>
              {recentActivity.map((item) => (
                <ActivityTimelineItem key={item.id} item={item} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Stylesheet using Unistyles
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
    gap: theme.spacing.md,
  },
  statCard: {
    width: "47%",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  statIcon: {
    fontSize: 24,
  },
  trendBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  trendText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  statValue: {
    fontSize: theme.fontSize["2xl"],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  quickActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  quickAction: {
    width: "47%",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: "center",
  },
  vehiclesList: {
    gap: theme.spacing.md,
  },
  vehicleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  vehicleImage: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.disabled,
  },
  vehiclePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  vehicleName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  vehicleDetail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  vehicleColorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  vehicleColorDot: {
    width: 12,
    height: 12,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sharedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  sharedBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  activityTimeline: {
    gap: theme.spacing.md,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  activityContent: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  activityVehicle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  activityValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  activityTime: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
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
