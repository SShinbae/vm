// @ts-nocheck - Demo file with known unistyles type incompatibilities
/**
 * Demo Dashboard Page
 *
 * Displays the main dashboard with demo data matching the real dashboard design
 * Uses Malaysian context (MYR currency, Malaysian plates, etc.)
 */

import React from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { createStyleSheet, useStyles } from "react-native-unistyles";

// Import real dashboard components
import { ActivityTimelineItem } from "@/components/dashboard/ActivityTimelineItem";
import { QuickActionButton } from "@/components/dashboard/QuickActionButton";
import { StatCard } from "@/components/dashboard/StatCard";
import { MaxWidthContainer } from "@/components/layout/MaxWidthContainer";
import { ResponsiveGrid } from "@/components/layout/ResponsiveGrid";
import { ActivityItem, VehicleWithShares } from "@/hooks/useDashboardData";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { IconSymbol } from "@/components/ui/icon-symbol";

// Import demo data
import {
  DEMO_USER,
  DEMO_VEHICLES,
  DEMO_DASHBOARD_STATS,
  DEMO_FUEL_LOGS,
  DEMO_SERVICE_LOGS,
  DEMO_MILEAGE_LOGS,
} from "@/lib/demo/mockData";

export default function DemoDashboardPage() {
  const { styles, theme } = useStyles(stylesheet);
  const [refreshing, setRefreshing] = React.useState(false);

  // Transform demo data into the format expected by components
  const stats = {
    totalVehicles: DEMO_DASHBOARD_STATS.totalVehicles,
    totalVehiclesTrend: undefined,
    monthlyFuelCost: DEMO_DASHBOARD_STATS.totalCosts.fuel,
    monthlyFuelCostTrend: undefined,
  };

  // Add shareCount and shared_with_groups to vehicles
  const vehicles: VehicleWithShares[] = DEMO_VEHICLES.map((v) => ({
    ...v,
    shared_with_groups: false,
    shareCount: 0,
  }));

  // Create recent activity matching ActivityItem type
  const recentActivity: ActivityItem[] = [
    ...DEMO_MILEAGE_LOGS.slice(0, 2).map((log) => {
      const vehicle = DEMO_VEHICLES.find((v) => v.id === log.vehicle_id);
      return {
        id: log.id,
        type: "mileage" as const,
        date: log.date,
        vehicleName: vehicle
          ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
          : "Unknown Vehicle",
        primaryValue: `${log.odometer_reading.toLocaleString()} km`,
        icon: "speedometer",
      };
    }),
    ...DEMO_FUEL_LOGS.slice(0, 2).map((log) => {
      const vehicle = DEMO_VEHICLES.find((v) => v.id === log.vehicle_id);
      return {
        id: log.id,
        type: "fuel" as const,
        date: log.date,
        vehicleName: vehicle
          ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
          : "Unknown Vehicle",
        primaryValue: `RM${(log.cost || 0).toFixed(2)} • ${log.liters_filled}L`,
        icon: "fuelpump.fill",
      };
    }),
    ...DEMO_SERVICE_LOGS.slice(0, 2).map((log) => {
      const vehicle = DEMO_VEHICLES.find((v) => v.id === log.vehicle_id);
      return {
        id: log.id,
        type: "service" as const,
        date: log.date,
        vehicleName: vehicle
          ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
          : "Unknown Vehicle",
        primaryValue: `${log.service_type} • RM${(log.cost || 0).toFixed(2)}`,
        icon: "wrench.fill",
      };
    }),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <MaxWidthContainer>
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
              Selamat Datang
              {DEMO_USER.full_name
                ? `, ${DEMO_USER.full_name.split(" ")[0]}`
                : ""}
              !
            </Text>
            <Text style={styles.subtitle}>
              Jejaki dan uruskan kenderaan anda
            </Text>
          </View>

          {/* Stats Grid Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gambaran Keseluruhan</Text>
            <ResponsiveGrid
              columns={{ mobile: 2, tablet: 2, desktop: 2, largeDesktop: 4 }}
              spacing={16}
            >
              <StatCard
                title="Jumlah Kenderaan"
                value={stats.totalVehicles}
                icon="🚗"
                trend={stats.totalVehiclesTrend}
              />
              <StatCard
                title="Kos Minyak Bulanan"
                value={`RM${stats.monthlyFuelCost.toFixed(2)}`}
                icon="⛽"
                trend={stats.monthlyFuelCostTrend}
              />
              <StatCard
                title="Purata Penggunaan"
                value={`${DEMO_DASHBOARD_STATS.averageFuelEconomy} km/L`}
                icon="📊"
              />
              <StatCard
                title="Jumlah Kos"
                value={`RM${DEMO_DASHBOARD_STATS.totalCosts.total.toFixed(2)}`}
                icon="💰"
              />
            </ResponsiveGrid>
          </View>

          {/* Quick Actions Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tindakan Pantas</Text>
            <ResponsiveGrid
              columns={{ mobile: 2, tablet: 4, desktop: 4, largeDesktop: 4 }}
              spacing={12}
            >
              <QuickActionButton
                title="Tambah Minyak"
                icon="fuelpump.fill"
                color={theme.colors.warning}
                onPress={() => {
                  // Demo mode - show alert
                  alert("Demo Mode: Fungsi ini tidak tersedia dalam mod demo");
                }}
              />
              <QuickActionButton
                title="Log Servis"
                icon="wrench.fill"
                color={theme.colors.error}
                onPress={() => {
                  alert("Demo Mode: Fungsi ini tidak tersedia dalam mod demo");
                }}
              />
              <QuickActionButton
                title="Kemas Kini Perbatuan"
                icon="speedometer"
                color={theme.colors.primary}
                onPress={() => {
                  alert("Demo Mode: Fungsi ini tidak tersedia dalam mod demo");
                }}
              />
              <QuickActionButton
                title="Tambah Kenderaan"
                icon="plus.circle.fill"
                color={theme.colors.success}
                onPress={() => {
                  alert("Demo Mode: Fungsi ini tidak tersedia dalam mod demo");
                }}
              />
            </ResponsiveGrid>
          </View>

          {/* Vehicles Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Kenderaan Saya</Text>
              {vehicles.length > 0 && (
                <TouchableOpacity
                  onPress={() => router.push("/demo/vehicles-list" as any)}
                >
                  <Text style={styles.viewAllText}>Lihat Semua</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.vehiclesList}>
              {vehicles.slice(0, 3).map((vehicle) => (
                <View key={vehicle.id} style={styles.vehicleCardContainer}>
                  <TouchableOpacity
                    style={styles.vehicleCard}
                    onPress={() =>
                      router.push(`/demo/vehicles/${vehicle.id}` as any)
                    }
                  >
                    <View style={styles.vehiclePlaceholder}>
                      <IconSymbol
                        name="car.fill"
                        size={24}
                        color={theme.colors.primary}
                      />
                    </View>
                    <View style={styles.vehicleInfo}>
                      <Text style={styles.vehicleName} numberOfLines={1}>
                        {`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      </Text>
                      <Text style={styles.vehicleDetail}>
                        {vehicle.license_plate || "N/A"}
                      </Text>
                      <Text style={styles.vehicleDetail}>
                        {vehicle.current_mileage?.toLocaleString() || 0} km
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <ActionMenu
                    items={[
                      {
                        icon: "pencil",
                        label: "Kemaskini",
                        onPress: () => {
                          Alert.alert(
                            "Mod Demo",
                            "Kemaskini kenderaan tidak tersedia dalam mod demo. Sila cipta akaun untuk menggunakan ciri ini.",
                            [{ text: "OK" }],
                          );
                        },
                      },
                      {
                        icon: "trash",
                        label: "Padam",
                        onPress: () => {
                          Alert.alert(
                            "Mod Demo",
                            "Padam kenderaan tidak tersedia dalam mod demo. Sila cipta akaun untuk menggunakan ciri ini.",
                            [{ text: "OK" }],
                          );
                        },
                        variant: "danger",
                      },
                    ]}
                  />
                </View>
              ))}
            </View>
          </View>

          {/* Recent Activity Timeline */}
          {recentActivity.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Aktiviti Terkini</Text>
              <View style={styles.activityTimeline}>
                {recentActivity.slice(0, 4).map((item) => (
                  <ActivityTimelineItem key={item.id} item={item} />
                ))}
              </View>
            </View>
          )}

          {/* Demo Notice */}
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              💡 Anda melihat data demo. Perubahan yang anda buat tidak akan
              disimpan. Untuk menyimpan data anda, cipta akaun percuma!
            </Text>
            <TouchableOpacity
              style={styles.noticeButton}
              onPress={() => router.push("/(auth)/register" as any)}
            >
              <Text style={styles.noticeButtonText}>Cipta Akaun</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </MaxWidthContainer>
    </SafeAreaView>
  );
}

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
  vehiclesList: {
    gap: theme.spacing.md,
  },
  vehicleCardContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    paddingRight: theme.spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  vehicleCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
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
  activityTimeline: {
    gap: theme.spacing.md,
  },
  notice: {
    marginHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.info || "#E3F2FD",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  noticeText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  noticeButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
  },
  noticeButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: "#FFFFFF",
  },
}));
