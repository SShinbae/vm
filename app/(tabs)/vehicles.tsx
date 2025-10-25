import { useDialog } from "@/lib/contexts/DialogContext";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { VehicleService } from "../../lib/services/vehicleService";

import { ResponsiveGrid } from "@/components/layout/ResponsiveGrid";
import { WebLayout } from "@/components/layout/WebLayout";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useAuth } from "@/lib/contexts/AuthContext";
import supabase from "@/services/supabaseClient";
import { VehicleWithDetails } from "@/types/database-v2";

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
  const { styles, theme } = useStyles(stylesheet);
  const [allVehicles, setAllVehicles] = useState<VehicleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleWithDetails | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    avgMileage: 0,
    monthlyFuelCost: 0,
    upcomingServices: 0,
  });
  const layout = useResponsiveLayout();
  const dialog = useDialog();

  // Bottom Sheet Ref
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["50%", "90%"], []);

  // Handle opening bottom sheet
  const handleOpenBottomSheet = useCallback((vehicle: VehicleWithDetails) => {
    setSelectedVehicle(vehicle);
    bottomSheetRef.current?.expand();
  }, []);

  // Handle closing bottom sheet
  const handleCloseBottomSheet = useCallback(() => {
    bottomSheetRef.current?.close();
    setTimeout(() => setSelectedVehicle(null), 300);
  }, []);

  // Render backdrop
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    if (!user) return;

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
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={styles.statIconContainer}>
          <IconSymbol
            name={icon as any}
            size={24}
            color={theme.colors.primary}
          />
        </View>
      </View>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statTitle} numberOfLines={2}>
        {title}
      </Text>
    </View>
  );

  // Filter Chip Component
  const FilterChip = ({
    filter,
    label,
  }: {
    filter: FilterType;
    label: string;
  }) => {
    const isActive = activeFilter === filter;
    return (
      <TouchableOpacity
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={() => setActiveFilter(filter)}
      >
        <Text
          style={[
            styles.filterChipText,
            isActive && styles.filterChipTextActive,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

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

  // Vehicle Card Component with Modern Design
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
          style={styles.vehicleCard}
          onPress={() => handleOpenBottomSheet(vehicle)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {/* Hero Image */}
          <View style={styles.vehicleImageContainer}>
            {imageUrl && !imageError ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.vehicleHeroImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.vehiclePlaceholder}>
                <IconSymbol
                  name="car.fill"
                  size={40}
                  color={theme.colors.primary}
                />
              </View>
            )}

            {/* Service Status Badge */}
            {serviceStatus && (
              <View
                style={[
                  styles.serviceBadge,
                  { backgroundColor: serviceStatus.color },
                ]}
              >
                <Text style={styles.serviceBadgeText}>
                  {serviceStatus.label}
                </Text>
              </View>
            )}

            {/* Sharing Badge */}
            {(!vehicle.is_own_vehicle ||
              (vehicle.sharing_info?.is_shared &&
                vehicle.sharing_info.total_shares > 0)) && (
              <View style={styles.sharingBadge}>
                <IconSymbol
                  name="person.2.fill"
                  size={12}
                  color={theme.colors.white}
                />
                <Text style={styles.sharingBadgeText}>
                  {vehicle.sharing_info?.total_shares || "Shared"}
                </Text>
              </View>
            )}
          </View>

          {/* Vehicle Info */}
          <View style={styles.vehicleCardContent}>
            <Text style={styles.vehicleName} numberOfLines={1}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </Text>
            <Text style={styles.vehiclePlate}>{vehicle.license_plate}</Text>

            {/* Mileage and Color */}
            <View style={styles.vehicleMetaRow}>
              {vehicle.current_mileage && (
                <View style={styles.vehicleMeta}>
                  <IconSymbol
                    name="speedometer"
                    size={14}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={styles.vehicleMetaText}>
                    {vehicle.current_mileage.toLocaleString()} km
                  </Text>
                </View>
              )}
              {vehicle.color && (
                <View style={styles.vehicleMeta}>
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: vehicle.color },
                    ]}
                  />
                  <Text style={styles.vehicleMetaText}>{vehicle.color}</Text>
                </View>
              )}
            </View>

            {/* Owner Info for Shared Vehicles */}
            {!vehicle.is_own_vehicle && vehicle.owner_profile && (
              <View style={styles.ownerInfoContainer}>
                <IconSymbol
                  name="person.fill"
                  size={12}
                  color={theme.colors.primary}
                />
                <Text style={styles.ownerInfo}>
                  {vehicle.owner_profile.full_name ||
                    vehicle.owner_profile.email}
                </Text>
              </View>
            )}

            {/* Recent Activity Preview */}
            {(vehicle.logs?.latest_fuel || vehicle.logs?.latest_service) && (
              <View style={styles.recentActivityPreview}>
                {vehicle.logs.latest_fuel && (
                  <View style={styles.activityPreviewItem}>
                    <IconSymbol
                      name="fuelpump.fill"
                      size={12}
                      color={theme.colors.warning}
                    />
                    <Text style={styles.activityPreviewText}>
                      {new Date(
                        vehicle.logs.latest_fuel.date,
                      ).toLocaleDateString()}
                    </Text>
                  </View>
                )}
                {vehicle.logs.latest_service && (
                  <View style={styles.activityPreviewItem}>
                    <IconSymbol
                      name="wrench.fill"
                      size={12}
                      color={theme.colors.error}
                    />
                    <Text style={styles.activityPreviewText}>
                      {vehicle.logs.latest_service.service_type}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  // Skeleton Card Component
  const SkeletonCard = () => (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: "60%" }]} />
        <View style={[styles.skeletonLine, { width: "40%" }]} />
      </View>
    </View>
  );

  // FAB Component
  const FloatingActionButton = () => (
    <TouchableOpacity
      style={styles.fab}
      onPress={() => router.push("/vehicles/add")}
      accessibilityLabel="Add Vehicle"
    >
      <IconSymbol name="plus" size={24} color={theme.colors.white} />
    </TouchableOpacity>
  );

  // Loading state with skeletons
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <WebLayout>
          <View style={styles.header}>
            <Text style={styles.greeting}>Vehicles</Text>
            <Text style={styles.subtitle}>Loading your fleet...</Text>
          </View>
          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <View style={styles.statsGrid}>
                {[1, 2, 3, 4].map((i) => (
                  <View key={i} style={styles.skeletonStat} />
                ))}
              </View>
            </View>
            <View style={styles.section}>
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </View>
          </ScrollView>
        </WebLayout>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <WebLayout>
          <ScrollView
            style={styles.content}
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
              <Text style={styles.greeting}>Vehicles</Text>
              <Text style={styles.subtitle}>
                Manage your fleet and maintenance
              </Text>
            </View>

            {/* Statistics Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <View style={styles.statsGrid}>
                <StatCard
                  title="Total Vehicles"
                  value={stats.totalVehicles}
                  icon="car.fill"
                />
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
                <StatCard
                  title="Services Due"
                  value={stats.upcomingServices}
                  icon="wrench.fill"
                />
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.section}>
              <View style={styles.searchContainer}>
                <IconSymbol
                  name="magnifyingglass"
                  size={20}
                  color={theme.colors.textSecondary}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search vehicles by make, model, plate..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <IconSymbol
                      name="xmark.circle.fill"
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Filter Chips */}
            <View style={styles.section}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChipsContainer}
              >
                <FilterChip filter="all" label="All Vehicles" />
                <FilterChip filter="own" label="My Vehicles" />
                <FilterChip filter="shared" label="Shared" />
                <FilterChip filter="2020-2025" label="2020-2025" />
                <FilterChip filter="2015-2019" label="2015-2019" />
                <FilterChip filter="before-2015" label="Before 2015" />
              </ScrollView>
            </View>

            {/* Vehicles Grid */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {activeFilter === "all"
                    ? "All Vehicles"
                    : activeFilter === "own"
                      ? "My Vehicles"
                      : activeFilter === "shared"
                        ? "Shared Vehicles"
                        : `Vehicles ${activeFilter}`}
                </Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {filteredVehicles.length}
                  </Text>
                </View>
              </View>

              {filteredVehicles.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <IconSymbol
                      name="car.fill"
                      size={48}
                      color={theme.colors.primary}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>No Vehicles Yet</Text>
                  <Text style={styles.emptyDescription}>
                    Add your first vehicle to start tracking maintenance and
                    fuel logs
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => router.push("/vehicles/add")}
                  >
                    <IconSymbol
                      name="plus.circle.fill"
                      size={20}
                      color={theme.colors.white}
                    />
                    <Text style={styles.emptyButtonText}>Add Vehicle</Text>
                  </TouchableOpacity>
                </View>
              ) : layout.isDesktop ? (
                <ResponsiveGrid minItemWidth={300} spacing={16}>
                  {filteredVehicles.map((vehicle) => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                  ))}
                </ResponsiveGrid>
              ) : (
                <View style={styles.vehiclesList}>
                  {filteredVehicles.map((vehicle) => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Floating Action Button */}
          <FloatingActionButton />

          {/* Bottom Sheet Modal */}
          <BottomSheet
            ref={bottomSheetRef}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose
            backdropComponent={renderBackdrop}
            backgroundStyle={styles.bottomSheetBackground}
            handleIndicatorStyle={styles.bottomSheetIndicator}
          >
            {selectedVehicle && (
              <BottomSheetScrollView
                contentContainerStyle={styles.bottomSheetContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Header */}
                <View style={styles.bottomSheetHeader}>
                  <View style={styles.bottomSheetTitleContainer}>
                    <Text style={styles.bottomSheetTitle}>
                      {selectedVehicle.year} {selectedVehicle.make}{" "}
                      {selectedVehicle.model}
                    </Text>
                    <Text style={styles.bottomSheetSubtitle}>
                      {selectedVehicle.license_plate}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleCloseBottomSheet}
                    style={styles.bottomSheetCloseButton}
                  >
                    <IconSymbol
                      name="xmark"
                      size={20}
                      color={theme.colors.text}
                    />
                  </TouchableOpacity>
                </View>

                {/* Vehicle Image Carousel */}
                {selectedVehicle.main_image_url && (
                  <View style={styles.bottomSheetImageContainer}>
                    <Image
                      source={{ uri: selectedVehicle.main_image_url }}
                      style={styles.bottomSheetImage}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  </View>
                )}

                {/* Details Section */}
                <View style={styles.bottomSheetSection}>
                  <Text style={styles.bottomSheetSectionTitle}>Details</Text>
                  <View style={styles.detailsGrid}>
                    {selectedVehicle.vin && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>VIN</Text>
                        <Text style={styles.detailValue}>
                          {selectedVehicle.vin}
                        </Text>
                      </View>
                    )}
                    {selectedVehicle.color && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Color</Text>
                        <View style={styles.detailValueWithColor}>
                          <View
                            style={[
                              styles.colorDot,
                              { backgroundColor: selectedVehicle.color },
                            ]}
                          />
                          <Text style={styles.detailValue}>
                            {selectedVehicle.color}
                          </Text>
                        </View>
                      </View>
                    )}
                    {selectedVehicle.current_mileage && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Mileage</Text>
                        <Text style={styles.detailValue}>
                          {selectedVehicle.current_mileage.toLocaleString()} km
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Recent Activity Timeline */}
                {(selectedVehicle.logs?.latest_fuel ||
                  selectedVehicle.logs?.latest_service ||
                  selectedVehicle.logs?.latest_mileage) && (
                  <View style={styles.bottomSheetSection}>
                    <Text style={styles.bottomSheetSectionTitle}>
                      Recent Activity
                    </Text>
                    <View style={styles.timelineContainer}>
                      {selectedVehicle.logs.latest_fuel && (
                        <View style={styles.timelineItem}>
                          <View
                            style={[
                              styles.timelineIcon,
                              { backgroundColor: theme.colors.warning + "15" },
                            ]}
                          >
                            <IconSymbol
                              name="fuelpump.fill"
                              size={16}
                              color={theme.colors.warning}
                            />
                          </View>
                          <View style={styles.timelineContent}>
                            <Text style={styles.timelineTitle}>Fuel Log</Text>
                            <Text style={styles.timelineDescription}>
                              {selectedVehicle.logs.latest_fuel.liters_filled}L
                              • RM
                              {selectedVehicle.logs.latest_fuel.cost?.toFixed(
                                2,
                              )}
                            </Text>
                            <Text style={styles.timelineDate}>
                              {new Date(
                                selectedVehicle.logs.latest_fuel.date,
                              ).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>
                      )}
                      {selectedVehicle.logs.latest_service && (
                        <View style={styles.timelineItem}>
                          <View
                            style={[
                              styles.timelineIcon,
                              { backgroundColor: theme.colors.error + "15" },
                            ]}
                          >
                            <IconSymbol
                              name="wrench.fill"
                              size={16}
                              color={theme.colors.error}
                            />
                          </View>
                          <View style={styles.timelineContent}>
                            <Text style={styles.timelineTitle}>
                              Service Log
                            </Text>
                            <Text style={styles.timelineDescription}>
                              {selectedVehicle.logs.latest_service.service_type}{" "}
                              • RM
                              {selectedVehicle.logs.latest_service.cost?.toFixed(
                                2,
                              )}
                            </Text>
                            <Text style={styles.timelineDate}>
                              {new Date(
                                selectedVehicle.logs.latest_service.date,
                              ).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>
                      )}
                      {selectedVehicle.logs.latest_mileage && (
                        <View style={styles.timelineItem}>
                          <View
                            style={[
                              styles.timelineIcon,
                              { backgroundColor: theme.colors.primary + "15" },
                            ]}
                          >
                            <IconSymbol
                              name="speedometer"
                              size={16}
                              color={theme.colors.primary}
                            />
                          </View>
                          <View style={styles.timelineContent}>
                            <Text style={styles.timelineTitle}>
                              Mileage Log
                            </Text>
                            <Text style={styles.timelineDescription}>
                              {selectedVehicle.logs.latest_mileage.odometer_reading.toLocaleString()}{" "}
                              km
                            </Text>
                            <Text style={styles.timelineDate}>
                              {new Date(
                                selectedVehicle.logs.latest_mileage.date,
                              ).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Owner Info for Shared Vehicles */}
                {!selectedVehicle.is_own_vehicle &&
                  selectedVehicle.owner_profile && (
                    <View style={styles.bottomSheetSection}>
                      <Text style={styles.bottomSheetSectionTitle}>
                        Owner Information
                      </Text>
                      <View style={styles.ownerCard}>
                        <View style={styles.ownerAvatar}>
                          <IconSymbol
                            name="person.fill"
                            size={24}
                            color={theme.colors.primary}
                          />
                        </View>
                        <View style={styles.ownerDetails}>
                          <Text style={styles.ownerName}>
                            {selectedVehicle.owner_profile.full_name ||
                              selectedVehicle.owner_profile.email}
                          </Text>
                          <Text style={styles.ownerEmail}>
                            {selectedVehicle.owner_profile.email}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                {/* Action Buttons */}
                <View style={styles.bottomSheetActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonPrimary]}
                    onPress={() => {
                      handleCloseBottomSheet();
                      router.push(`/vehicles/${selectedVehicle.id}` as any);
                    }}
                  >
                    <IconSymbol
                      name="pencil"
                      size={18}
                      color={theme.colors.white}
                    />
                    <Text style={styles.actionButtonTextPrimary}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonSecondary]}
                    onPress={() => {
                      handleCloseBottomSheet();
                      // Add share functionality
                    }}
                  >
                    <IconSymbol
                      name="square.and.arrow.up"
                      size={18}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.actionButtonTextSecondary}>Share</Text>
                  </TouchableOpacity>
                </View>
              </BottomSheetScrollView>
            )}
          </BottomSheet>
        </WebLayout>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// Stylesheet using Unistyles
const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for FAB
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
  },
  countBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    minWidth: 32,
    alignItems: "center",
  },
  countBadgeText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },

  // Stats Grid
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statHeader: {
    marginBottom: theme.spacing.md,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
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

  // Search Bar
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
  },

  // Filter Chips
  filterChipsContainer: {
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  filterChip: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  filterChipTextActive: {
    color: theme.colors.white,
  },

  // Vehicle Card
  vehiclesList: {
    gap: theme.spacing.lg,
  },
  vehicleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  vehicleImageContainer: {
    position: "relative",
    width: "100%",
    height: 180,
  },
  vehicleHeroImage: {
    width: "100%",
    height: "100%",
  },
  vehiclePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: theme.colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  serviceBadge: {
    position: "absolute",
    top: theme.spacing.md,
    left: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  serviceBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  sharingBadge: {
    position: "absolute",
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  sharingBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  vehicleCardContent: {
    padding: theme.spacing.lg,
  },
  vehicleName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  vehiclePlate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  vehicleMetaRow: {
    flexDirection: "row",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  vehicleMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  vehicleMetaText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ownerInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  ownerInfo: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  recentActivityPreview: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  activityPreviewItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  activityPreviewText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: theme.spacing.xxxl,
    gap: theme.spacing.md,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
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

  // Skeleton Loading
  skeletonCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
    marginBottom: theme.spacing.lg,
  },
  skeletonImage: {
    width: "100%",
    height: 180,
    backgroundColor: theme.colors.disabled,
  },
  skeletonContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: theme.colors.disabled,
    borderRadius: theme.borderRadius.sm,
  },
  skeletonStat: {
    width: "47%",
    height: 120,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: theme.spacing.xl,
    right: theme.spacing.xl,
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // Bottom Sheet Styles
  bottomSheetBackground: {
    backgroundColor: theme.colors.background,
  },
  bottomSheetIndicator: {
    backgroundColor: theme.colors.border,
    width: 40,
  },
  bottomSheetContent: {
    paddingBottom: theme.spacing.xxxl,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  bottomSheetTitleContainer: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  bottomSheetTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  bottomSheetSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  bottomSheetCloseButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSheetImageContainer: {
    width: "100%",
    height: 200,
    marginBottom: theme.spacing.lg,
  },
  bottomSheetImage: {
    width: "100%",
    height: "100%",
  },
  bottomSheetSection: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  bottomSheetSectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  detailsGrid: {
    gap: theme.spacing.md,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
  },
  detailLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  detailValue: {
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  detailValueWithColor: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  timelineContainer: {
    gap: theme.spacing.lg,
  },
  timelineItem: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  timelineDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  timelineDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  ownerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  ownerAvatar: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  ownerDetails: {
    flex: 1,
  },
  ownerName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  ownerEmail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  bottomSheetActions: {
    flexDirection: "row",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  actionButtonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  actionButtonSecondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionButtonTextPrimary: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  actionButtonTextSecondary: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
}));
