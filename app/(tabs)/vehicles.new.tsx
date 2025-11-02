import { IconSymbol } from "@/components/ui/icon-symbol";
import { ListLayout } from "@/lib/design-system";
import { Card } from "@/lib/design-system/components/molecules/Card";
import { Text } from "@/lib/design-system/components/atoms/Text";
import { Chip } from "@/lib/design-system/components/molecules/Chip";
import { Spacer } from "@/lib/design-system/components/atoms/Spacer";
import { useDialog } from "@/lib/contexts/DialogContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { VehicleService } from "@/lib/services/vehicleService";
import { supabase } from "@/services/supabaseClient";
import { VehicleWithDetails } from "@/types/database-v2";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Animated,
  Pressable,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useStyles } from "react-native-unistyles";

// Types for statistics
interface DashboardStats {
  totalVehicles: number;
  avgMileage: number;
  monthlyFuelCost: number;
  upcomingServices: number;
}

// Filter types
type FilterType =
  | "all"
  | "own"
  | "shared"
  | "2020-2025"
  | "2015-2019"
  | "before-2015";

export default function VehiclesScreen() {
  const { user } = useAuth();
  const { theme } = useStyles();
  const dialog = useDialog();

  // State
  const [allVehicles, setAllVehicles] = useState<VehicleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    avgMileage: 0,
    monthlyFuelCost: 0,
    upcomingServices: 0,
  });

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    if (!user) return { monthlyFuelCost: 0, upcomingServices: 0 };

    try {
      // Get monthly fuel cost
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: fuelData } = await supabase
        .from("fuel_logs")
        .select("cost")
        .eq("user_id", user.id)
        .gte("date", startOfMonth.toISOString());

      const monthlyFuelCost =
        (fuelData as { cost: number | null }[] | null)?.reduce(
          (sum, f) => sum + (f.cost || 0),
          0,
        ) || 0;

      // Get upcoming services
      const now = new Date();
      const thirtyDaysLater = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000,
      );

      const { data: servicesData } = await supabase
        .from("service_logs")
        .select("next_service_due")
        .eq("user_id", user.id)
        .gte("next_service_due", now.toISOString())
        .lte("next_service_due", thirtyDaysLater.toISOString());

      const upcomingServices = servicesData?.length || 0;

      return { monthlyFuelCost, upcomingServices };
    } catch (err) {
      console.error("Error fetching stats:", err);
      return { monthlyFuelCost: 0, upcomingServices: 0 };
    }
  }, [user]);

  // Fetch vehicles
  const fetchData = useCallback(async () => {
    const vehiclesResult = await VehicleService.getVehiclesSeparated();

    if (vehiclesResult.error) {
      dialog.showError("Error", "Failed to load vehicles");
      console.error("Failed to fetch vehicles:", vehiclesResult.error);
    } else if (vehiclesResult.data) {
      const combinedVehicles = [
        ...vehiclesResult.data.ownVehicles,
        ...vehiclesResult.data.sharedVehicles,
      ];
      setAllVehicles(combinedVehicles);

      // Calculate stats
      const totalVehicles = combinedVehicles.length;
      const totalMileage = combinedVehicles.reduce(
        (sum, v) => sum + (v.current_mileage || 0),
        0,
      );
      const avgMileage = totalVehicles > 0 ? totalMileage / totalVehicles : 0;

      const additionalStats = await fetchStats();

      setStats({
        totalVehicles,
        avgMileage,
        monthlyFuelCost: additionalStats?.monthlyFuelCost || 0,
        upcomingServices: additionalStats?.upcomingServices || 0,
      });
    }

    setLoading(false);
  }, [dialog, fetchStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  // Filter and search vehicles
  const filteredVehicles = useMemo(() => {
    let filtered = allVehicles;

    // Apply filter
    if (activeFilter === "own") {
      filtered = filtered.filter((v) => v.is_own_vehicle);
    } else if (activeFilter === "shared") {
      filtered = filtered.filter((v) => !v.is_own_vehicle);
    } else if (activeFilter === "2020-2025") {
      filtered = filtered.filter((v) => v.year >= 2020 && v.year <= 2025);
    } else if (activeFilter === "2015-2019") {
      filtered = filtered.filter((v) => v.year >= 2015 && v.year <= 2019);
    } else if (activeFilter === "before-2015") {
      filtered = filtered.filter((v) => v.year < 2015);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.make.toLowerCase().includes(query) ||
          v.model.toLowerCase().includes(query) ||
          v.license_plate.toLowerCase().includes(query) ||
          v.year.toString().includes(query),
      );
    }

    return filtered;
  }, [allVehicles, activeFilter, searchQuery]);

  // Get active filter count for badge
  const activeFilters = activeFilter !== "all" ? 1 : 0;

  // Get service status
  const getServiceStatus = (vehicle: VehicleWithDetails) => {
    const latestService = vehicle.logs?.latest_service;
    if (!latestService?.next_service_due) return null;

    const dueDate = new Date(latestService.next_service_due);
    const now = new Date();
    const diffDays = Math.floor(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0) return { label: "Overdue", color: theme.colors.error };
    if (diffDays <= 30)
      return { label: "Due Soon", color: theme.colors.warning };
    return { label: "Up to Date", color: theme.colors.success };
  };

  // Stats Header Component
  const StatsHeader = () => (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
      <StatCard title="Total Vehicles" value={stats.totalVehicles} icon="car.fill" />
      <StatCard
        title="Avg Mileage"
        value={`${Math.round(stats.avgMileage).toLocaleString()} km`}
        icon="speedometer"
      />
      <StatCard
        title="Monthly Fuel"
        value={`RM${stats.monthlyFuelCost.toFixed(2)}`}
        icon="fuelpump.fill"
      />
      <StatCard title="Services Due" value={stats.upcomingServices} icon="wrench.fill" />
    </View>
  );

  // Stat Card Component
  const StatCard = ({
    title,
    value,
    icon,
  }: {
    title: string;
    value: string | number;
    icon: string;
  }) => (
    <View style={{ width: "47%" }}>
      <Card variant="elevated" padding="lg">
        <View style={{ marginBottom: theme.spacing.sm }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: theme.borderRadius.full,
              backgroundColor: theme.colors.primary + "15",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconSymbol name={icon as any} size={24} color={theme.colors.primary} />
          </View>
        </View>
        <Text variant="heading" size="xl" weight="bold" numberOfLines={1}>
          {typeof value === "number" ? value.toString() : value}
        </Text>
        <Spacer size="xs" />
        <Text variant="body" size="sm" color="secondary" numberOfLines={2}>
          {title}
        </Text>
      </Card>
    </View>
  );

  // Filter Chips Row Component
  const FilterChipsRow = () => (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
      <FilterChip filter="all" label="All Vehicles" />
      <FilterChip filter="own" label="My Vehicles" />
      <FilterChip filter="shared" label="Shared" />
      <FilterChip filter="2020-2025" label="2020-2025" />
      <FilterChip filter="2015-2019" label="2015-2019" />
      <FilterChip filter="before-2015" label="Before 2015" />
    </View>
  );

  // Filter Chip Component
  const FilterChip = ({ filter, label }: { filter: FilterType; label: string }) => {
    const isActive = activeFilter === filter;
    return (
      <Chip
        label={label}
        variant={isActive ? "filled" : "outlined"}
        onPress={() => setActiveFilter(filter)}
      />
    );
  };

  // Vehicle Card Component
  const VehicleCard = ({ vehicle }: { vehicle: VehicleWithDetails }) => {
    const [imageError, setImageError] = useState(false);
    const scaleAnim = useState(new Animated.Value(1))[0];
    const serviceStatus = getServiceStatus(vehicle);

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start();
    };

    const isValidImageUrl = (url: string | null) => {
      if (!url) return false;
      if (url.startsWith("file://")) return false;
      if (url.includes("undefined") || url.includes("null")) return false;
      return true;
    };

    const imageUrl =
      vehicle.main_image_url && isValidImageUrl(vehicle.main_image_url)
        ? vehicle.main_image_url
        : null;

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={() => router.push(`/vehicles/${vehicle.id}` as any)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View style={{ borderRadius: theme.borderRadius.xl, overflow: "hidden" }}>
            <Card variant="elevated">
              {/* Hero Image */}
              <View style={{ position: "relative", height: 160, overflow: "hidden", marginHorizontal: -theme.spacing.lg, marginTop: -theme.spacing.lg }}>
                {imageUrl && !imageError ? (
                  <Image
                    source={{ uri: imageUrl }}
                    style={{ width: "100%", height: 160 }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <View
                    style={{
                      width: "100%",
                      height: 160,
                      backgroundColor: theme.colors.primary + "15",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconSymbol name="car.fill" size={40} color={theme.colors.primary} />
                  </View>
                )}

              {/* Service Status Badge */}
              {serviceStatus && (
                <View
                  style={{
                    position: "absolute",
                    top: theme.spacing.sm,
                    left: theme.spacing.sm,
                    paddingHorizontal: theme.spacing.sm,
                    paddingVertical: theme.spacing.xs,
                    borderRadius: theme.borderRadius.sm,
                    backgroundColor: serviceStatus.color,
                  }}
                >
                  <Text variant="caption" size="xs" weight="semibold" style={{ color: theme.colors.white }}>
                    {serviceStatus.label}
                  </Text>
                </View>
              )}

              {/* Sharing Badge */}
              {(!vehicle.is_own_vehicle ||
                (vehicle.sharing_info?.is_shared && vehicle.sharing_info.total_shares > 0)) && (
                <View
                  style={{
                    position: "absolute",
                    top: theme.spacing.sm,
                    right: theme.spacing.sm,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: theme.spacing.xs,
                    paddingHorizontal: theme.spacing.sm,
                    paddingVertical: theme.spacing.xs,
                    borderRadius: theme.borderRadius.sm,
                    backgroundColor: theme.colors.primary,
                  }}
                >
                  <IconSymbol name="person.2.fill" size={12} color={theme.colors.white} />
                  <Text variant="caption" size="xs" weight="semibold" style={{ color: theme.colors.white }}>
                    {vehicle.sharing_info?.total_shares || "Shared"}
                  </Text>
                </View>
              )}
            </View>

            {/* Vehicle Info */}
            <View>
              <Text variant="heading" size="md" weight="semibold" numberOfLines={1}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Text>
              <Spacer size="xs" />
              <Text variant="body" size="sm" color="secondary">{vehicle.license_plate}</Text>

              {/* Mileage and Color */}
              <Spacer size="sm" />
              <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: theme.spacing.md }}>
                {vehicle.current_mileage && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}>
                    <IconSymbol name="speedometer" size={14} color={theme.colors.textSecondary} />
                    <Text variant="body" size="sm" color="secondary">
                      {vehicle.current_mileage.toLocaleString()} km
                    </Text>
                  </View>
                )}
                {vehicle.color && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}>
                    <View
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: theme.borderRadius.full,
                        backgroundColor: vehicle.color,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      }}
                    />
                    <Text variant="body" size="sm" color="secondary">{vehicle.color}</Text>
                  </View>
                )}
              </View>
            </View>
          </Card>
        </View>
        </Pressable>
      </Animated.View>
    );
  };

  // Empty State Component
  const EmptyStateComponent = () => (
    <Card variant="outlined" padding="xl">
      <View style={{ alignItems: "center", gap: theme.spacing.md, paddingVertical: theme.spacing.xl }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: theme.borderRadius.full,
            backgroundColor: theme.colors.primary + "15",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconSymbol name="car.fill" size={48} color={theme.colors.primary} />
        </View>
        <Text variant="heading" size="lg" weight="semibold" align="center">
          No Vehicles Yet
        </Text>
        <Text variant="body" size="sm" color="secondary" align="center" style={{ maxWidth: 300 }}>
          Add your first vehicle to start tracking maintenance and fuel logs
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
          onPress={() => router.push("/vehicles/add")}
        >
          <IconSymbol name="plus.circle.fill" size={20} color={theme.colors.white} />
          <Text variant="body" size="md" weight="semibold" style={{ color: theme.colors.white }}>
            Add Vehicle
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  // Loading state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Spacer size="md" />
        <Text variant="body" size="md" color="secondary">Loading vehicles...</Text>
      </View>
    );
  }

  return (
    <ListLayout
      header={{
        title: "Vehicles",
        subtitle: "Manage your fleet and maintenance",
        showBack: false,
        actions: [
          {
            icon: "add",
            onPress: () => router.push("/vehicles/add"),
            label: "Add Vehicle",
          },
        ],
      }}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onFilterPress={() => {}} // Filter handled by chips
      activeFilters={activeFilters}
      data={filteredVehicles}
      renderItem={({ item }) => <VehicleCard vehicle={item} />}
      keyExtractor={(item) => item.id}
      emptyComponent={<EmptyStateComponent />}
      listHeader={
        <View>
          <StatsHeader />
          <FilterChipsRow />
        </View>
      }
      refreshable
      onRefresh={onRefresh}
      refreshing={refreshing}
      loading={false}
    />
  );
}
