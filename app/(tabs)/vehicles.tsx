import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { RefreshControl, ScrollView, Text, View, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { createStyleSheet, useStyles } from "react-native-unistyles";

import { WebLayout } from "@/components/layout/WebLayout";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { SkeletonVehicleList } from "@/components/ui/Skeleton";
import { VehicleFilters } from "@/components/vehicles/VehicleFilters";
import { VehicleList } from "@/components/vehicles/VehicleList";
import { VehicleSearchBar } from "@/components/vehicles/VehicleSearchBar";
import { VehicleStatsGrid } from "@/components/vehicles/VehicleStatsGrid";

import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useVehicleFilters } from "@/hooks/useVehicleFilters";
import { useVehicles } from "@/hooks/useVehicles";
import { useVehicleStats } from "@/hooks/useVehicleStats";

import { VehicleWithDetails } from "@/types/database-v2";

// Conditionally import BottomSheet components only on native platforms
// This prevents react-native-reanimated web compatibility issues
let VehicleDetailsBottomSheet: any;
if (Platform.OS !== "web") {
  VehicleDetailsBottomSheet =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@/components/vehicles/VehicleDetailsBottomSheet").VehicleDetailsBottomSheet;
}

/**
 * VehiclesScreen - Redesigned for scalability
 *
 * Architecture improvements:
 * - Isolated UI components in components/vehicles/
 * - Custom hooks for state management (useVehicles, useVehicleStats, useVehicleFilters)
 * - Service layer for all data operations (VehicleService)
 * - Memoized filtering and search
 * - Ready for virtualization/pagination
 */
export default function VehiclesScreen() {
  const { styles, theme } = useStyles(stylesheet);
  const layout = useResponsiveLayout();

  // Custom hooks for state management
  const { allVehicles, loading, refreshing, onRefresh } = useVehicles();
  const stats = useVehicleStats(allVehicles);
  const {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    filteredVehicles,
    filterLabel,
  } = useVehicleFilters(allVehicles);

  // Bottom sheet state
  const bottomSheetRef = useRef<any>(null);
  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleWithDetails | null>(null);

  // Handle opening bottom sheet
  const handleOpenBottomSheet = useCallback((vehicle: VehicleWithDetails) => {
    setSelectedVehicle(vehicle);
    if (Platform.OS !== "web") {
      bottomSheetRef.current?.expand();
    } else {
      // On web, navigate directly to vehicle details
      router.push(`/vehicles/${vehicle.id}` as any);
    }
  }, []);

  // Handle closing bottom sheet
  const handleCloseBottomSheet = useCallback(() => {
    if (Platform.OS !== "web") {
      bottomSheetRef.current?.close();
      setTimeout(() => setSelectedVehicle(null), 300);
    }
  }, []);

  // Loading state with skeletons
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <WebLayout>
          <View style={[styles.header, layout.isMobile && styles.headerMobile]}>
            <Text
              style={[
                styles.greeting,
                layout.isMobile && styles.greetingMobile,
                layout.isTablet && styles.greetingTablet,
              ]}
            >
              Vehicles
            </Text>
            <Text
              style={[
                styles.subtitle,
                layout.isMobile && styles.subtitleMobile,
              ]}
            >
              Loading your fleet...
            </Text>
          </View>
          <SkeletonVehicleList itemCount={4} />
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
            <View
              style={[styles.header, layout.isMobile && styles.headerMobile]}
            >
              <Text
                style={[
                  styles.greeting,
                  layout.isMobile && styles.greetingMobile,
                  layout.isTablet && styles.greetingTablet,
                ]}
              >
                Vehicles
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  layout.isMobile && styles.subtitleMobile,
                ]}
              >
                Manage your fleet and maintenance
              </Text>
            </View>

            {/* Statistics Summary */}
            <View
              style={[styles.section, layout.isMobile && styles.sectionMobile]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  layout.isMobile && styles.sectionTitleMobile,
                  layout.isTablet && styles.sectionTitleTablet,
                ]}
              >
                Overview
              </Text>
              <VehicleStatsGrid stats={stats} />
            </View>

            {/* Search Bar */}
            <View
              style={[styles.section, layout.isMobile && styles.sectionMobile]}
            >
              <VehicleSearchBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </View>

            {/* Filter Chips */}
            <View
              style={[styles.section, layout.isMobile && styles.sectionMobile]}
            >
              <VehicleFilters
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
              />
            </View>

            {/* Vehicles Grid/List */}
            <View
              style={[styles.section, layout.isMobile && styles.sectionMobile]}
            >
              <VehicleList
                vehicles={filteredVehicles}
                filterLabel={filterLabel}
                onVehiclePress={handleOpenBottomSheet}
                isDesktop={layout.isDesktop}
              />
            </View>
          </ScrollView>

          {/* Floating Action Button */}
          <FloatingActionButton
            onPress={() => router.push("/vehicles/add")}
            icon="plus"
          />

          {/* Bottom Sheet Modal - Native only */}
          {Platform.OS !== "web" && VehicleDetailsBottomSheet && (
            <VehicleDetailsBottomSheet
              ref={bottomSheetRef}
              vehicle={selectedVehicle}
              onClose={handleCloseBottomSheet}
            />
          )}
        </WebLayout>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// Minimal stylesheet - most styles moved to components
const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  headerMobile: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  greeting: {
    fontSize: theme.fontSize["3xl"],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  greetingMobile: {
    fontSize: theme.fontSize["2xl"],
  },
  greetingTablet: {
    fontSize: theme.fontSize["2xl"],
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
  },
  subtitleMobile: {
    fontSize: theme.fontSize.sm,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxxl,
  },
  section: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  sectionMobile: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  sectionTitleMobile: {
    fontSize: theme.fontSize.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitleTablet: {
    fontSize: theme.fontSize.lg,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  skeletonStat: {
    width: "47%",
    height: 120,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
  },
}));
