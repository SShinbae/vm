import { IconSymbol } from "@/components/ui/icon-symbol";
import { DashboardLayout } from "@/lib/design-system";
import { Card } from "@/lib/design-system/components/molecules/Card";
import { Text } from "@/lib/design-system/components/atoms/Text";
import { Spacer } from "@/lib/design-system/components/atoms/Spacer";
import { useAuth } from "@/lib/contexts/AuthContext";
import { supabase } from "@/services/supabaseClient";
import { Database } from "@/types/database";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useStyles } from "react-native-unistyles";

// Type definitions
type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];

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
  const { theme } = useStyles();

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

  // Metrics Section Component
  const MetricsSection = () => (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md }}>
      <StatCard
        title="Total Vehicles"
        value={stats.totalVehicles.toString()}
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
        value={stats.upcomingServices.toString()}
        icon="🔧"
        trend={stats.upcomingServicesTrend}
      />
    </View>
  );

  // Quick Actions Section Component
  const QuickActionsSection = () => (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md }}>
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
  );

  // Recent Activity Section Component
  const RecentActivitySection = () => (
    <View style={{ gap: theme.spacing.md }}>
      {recentActivity.map((item) => (
        <ActivityTimelineItem key={item.id} item={item} />
      ))}
    </View>
  );

  // Stat Card Component
  const StatCard = ({
    title,
    value,
    icon,
    trend,
  }: {
    title: string;
    value: string;
    icon: string;
    trend?: number;
  }) => (
    <View style={{ width: "47%" }}>
      <Card
        variant="elevated"
        padding="lg"
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.sm }}>
          <Text variant="display" size="lg">{icon}</Text>
          {trend !== undefined && trend !== 0 && (
            <View
              style={{
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: theme.spacing.xs,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: trend > 0 ? theme.colors.success + "20" : theme.colors.error + "20",
              }}
            >
              <Text
                variant="caption"
                size="xs"
                weight="semibold"
                style={{
                  color: trend > 0 ? theme.colors.success : theme.colors.error,
                }}
              >
                {trend > 0 ? "+" : ""}
                {trend.toFixed(1)}%
              </Text>
            </View>
          )}
        </View>
        <Text variant="heading" size="xl" weight="bold">{value}</Text>
        <Spacer size="xs" />
        <Text variant="body" size="sm" color="secondary">{title}</Text>
      </Card>
    </View>
  );

  // Vehicle Card Component
  const VehicleCard = ({ vehicle }: { vehicle: VehicleWithShares }) => {
    const [imageError, setImageError] = useState(false);

    return (
      <TouchableOpacity
        onPress={() => router.push(`/vehicles/${vehicle.id}` as any)}
        accessibilityLabel={`View details for ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
      >
        <Card variant="elevated" padding="lg">
          <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
            {vehicle.main_image_url && !imageError ? (
              <Image
                source={{ uri: vehicle.main_image_url }}
                style={{ width: 60, height: 60, borderRadius: theme.borderRadius.md }}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
                onError={() => setImageError(true)}
              />
            ) : (
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: theme.colors.primary + "15",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconSymbol name="car.fill" size={24} color={theme.colors.primary} />
              </View>
            )}
            <View style={{ flex: 1, gap: theme.spacing.xs }}>
              <Text variant="body" size="md" weight="semibold" numberOfLines={1}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Text>
              <Text variant="body" size="sm" color="secondary">{vehicle.license_plate}</Text>
              {vehicle.current_mileage && (
                <Text variant="body" size="sm" color="secondary">
                  {vehicle.current_mileage.toLocaleString()} km
                </Text>
              )}
            </View>
            {vehicle.shareCount > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: theme.spacing.xs,
                  backgroundColor: theme.colors.primary,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  borderRadius: theme.borderRadius.sm,
                }}
              >
                <IconSymbol name="person.2.fill" size={12} color={theme.colors.white} />
                <Text variant="caption" size="xs" weight="semibold" style={{ color: theme.colors.white }}>
                  Shared
                </Text>
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  // Activity Timeline Item Component
  const ActivityTimelineItem = ({ item }: { item: ActivityItem }) => {
    const color = getActivityColor(item.type);

    return (
      <Card variant="elevated" padding="lg">
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.md }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: theme.borderRadius.full,
              backgroundColor: color + "15",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconSymbol name={item.icon as any} size={20} color={color} />
          </View>
          <View style={{ flex: 1, gap: theme.spacing.xs }}>
            <Text variant="body" size="sm" weight="semibold" numberOfLines={1}>
              {item.vehicleName}
            </Text>
            <Text variant="body" size="sm">{item.primaryValue}</Text>
            <Text variant="caption" size="xs" color="secondary">
              {formatRelativeTime(item.date)}
            </Text>
          </View>
        </View>
      </Card>
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
      style={{ width: "47%", alignItems: "center", gap: theme.spacing.md }}
      onPress={onPress}
      accessibilityLabel={title}
      accessibilityRole="button"
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: theme.borderRadius.full,
          backgroundColor: color + "15",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconSymbol name={icon as any} size={24} color={color} />
      </View>
      <Text variant="body" size="sm" weight="semibold" align="center" numberOfLines={2}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  // My Vehicles Section
  const MyVehiclesSection = () => {
    if (vehicles.length === 0) {
      return (
        <Card variant="outlined" padding="xl">
          <View style={{ alignItems: "center", gap: theme.spacing.md }}>
            <Text variant="display" size="xl">🚗</Text>
            <Text variant="heading" size="lg" weight="semibold" align="center">
              No vehicles yet
            </Text>
            <Text variant="body" size="sm" color="secondary" align="center" style={{ maxWidth: 300 }}>
              Add your first vehicle to start tracking mileage, fuel, and maintenance
            </Text>
            <Spacer size="md" />
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.sm,
                backgroundColor: theme.colors.primary,
                paddingHorizontal: theme.spacing.xl,
                paddingVertical: theme.spacing.md,
                borderRadius: theme.borderRadius.lg,
              }}
              onPress={() => router.push("/vehicles/add" as any)}
            >
              <IconSymbol name="plus" size={18} color={theme.colors.white} />
              <Text variant="body" size="md" weight="semibold" style={{ color: theme.colors.white }}>
                Add Vehicle
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      );
    }

    return (
      <View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.md }}>
          <Text variant="heading" size="lg" weight="semibold">
            My Vehicles
          </Text>
          <TouchableOpacity onPress={() => router.push("/vehicles" as any)}>
            <Text variant="body" size="sm" weight="medium" style={{ color: theme.colors.primary }}>
              View All
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ gap: theme.spacing.md }}>
          {vehicles.slice(0, 3).map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </View>
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Spacer size="md" />
        <Text variant="body" size="md" color="secondary">Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <DashboardLayout
      header={{
        title: `Welcome${user?.profile?.full_name ? `, ${user.profile.full_name.split(" ")[0]}` : ""}!`,
        subtitle: "Track and manage your vehicles",
        showBack: false,
      }}
      metrics={<MetricsSection />}
      quickActions={<QuickActionsSection />}
      customSections={[
        <MyVehiclesSection key="vehicles" />,
        recentActivity.length > 0 ? (
          <View key="activity">
            <Text variant="heading" size="lg" weight="semibold" style={{ marginBottom: theme.spacing.md }}>
              Recent Activity
            </Text>
            <RecentActivitySection />
          </View>
        ) : null,
      ]}
      refreshable
      onRefresh={onRefresh}
      refreshing={refreshing}
    />
  );
}
