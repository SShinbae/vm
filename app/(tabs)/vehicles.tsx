import { MobilePageHeader } from "@/components/layout/MobilePageHeader";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  View,
  Platform,
  Keyboard,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { createStyleSheet, useStyles } from "react-native-unistyles";

import { MaxWidthContainer } from "@/components/layout/MaxWidthContainer";
import { webPageStyles } from "@/components/layout/webPageStyles";
import { VehicleTable } from "@/components/dashboard/VehicleTable";
import { Button } from "@/components/ui/Button";
import { useFocusEffect } from "@react-navigation/native";
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
  const queryClient = useQueryClient();
  const layout = useResponsiveLayout();
  const isWebPage = layout.isWeb && !layout.isMobile;
  const isCompact = !isWebPage;
  const { styles: web } = useStyles(webPageStyles);

  // Custom hooks for state management
  const { allVehicles, loading, refreshing, error, onRefresh } = useVehicles();
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
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleWithDetails | null>(null);

  // Handle opening bottom sheet
  const handleOpenBottomSheet = useCallback((vehicle: VehicleWithDetails) => {
    Keyboard.dismiss();
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setSelectedVehicle(vehicle);
    if (Platform.OS !== "web") {
      bottomSheetRef.current?.expand();
    } else {
      // On web, navigate directly to vehicle details
      router.push({
        pathname: "/vehicles/[id]",
        params: { id: vehicle.id, returnTo: "vehicles" },
      });
    }
  }, []);

  // Handle closing bottom sheet
  const handleCloseBottomSheet = useCallback(() => {
    if (Platform.OS !== "web") {
      bottomSheetRef.current?.close();
      if (closeTimer.current) clearTimeout(closeTimer.current);
      closeTimer.current = setTimeout(() => setSelectedVehicle(null), 300);
    }
  }, []);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );
  useFocusEffect(
    useCallback(
      () => () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        bottomSheetRef.current?.close();
      },
      [],
    ),
  );

  const clearFilters = () => {
    setSearchQuery("");
    setActiveFilter("all");
  };
  const mobileHeader = (
    <View style={{ paddingHorizontal: 16 }}>
      <MobilePageHeader
        title="Vehicles"
        subtitle={
          loading
            ? "Loading your fleet..."
            : "Manage your fleet and maintenance"
        }
        action={
          <Button
            title="Add Vehicle"
            icon="plus"
            style={{ minHeight: 48 }}
            onPress={() => router.push("/vehicles/add")}
          />
        }
      />
    </View>
  );

  const overview = (
    <>
      {/* Statistics Summary */}
      <View
        style={[
          styles.section,
          isCompact && styles.sectionMobile,
          isWebPage && web.section,
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            isCompact && styles.sectionTitleMobile,
            layout.isTablet && styles.sectionTitleTablet,
          ]}
        >
          Overview
        </Text>
        <VehicleStatsGrid stats={stats} />
      </View>
    </>
  );
  // Loading state with skeletons
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <MaxWidthContainer
          fullWidth={isWebPage}
          style={isWebPage ? web.frame : undefined}
        >
          {isCompact && mobileHeader}
          <SkeletonVehicleList itemCount={4} />
        </MaxWidthContainer>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <MaxWidthContainer
          fullWidth={isWebPage}
          style={isWebPage ? web.frame : undefined}
        >
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => {
                  await onRefresh();
                  if (isWebPage)
                    await queryClient.invalidateQueries({
                      queryKey: ["dashboard", "vehicles"],
                    });
                }}
                tintColor={theme.colors.primary}
              />
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            {isCompact && mobileHeader}

            {!isCompact && (!error || allVehicles.length > 0) && overview}

            <View
              style={
                isWebPage
                  ? web.toolbar
                  : [styles.section, isCompact && styles.sectionMobile]
              }
            >
              <View
                style={
                  isWebPage
                    ? { flex: 1, maxWidth: 560, minWidth: 220 }
                    : undefined
                }
              >
                <VehicleSearchBar
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              </View>
              {isWebPage && (
                <Button
                  title="Add Vehicle"
                  icon="plus"
                  onPress={() => router.push("/vehicles/add")}
                />
              )}
            </View>

            {error && (
              <View
                style={[
                  styles.section,
                  isCompact && styles.sectionMobile,
                  isWebPage && web.section,
                ]}
              >
                <Text style={styles.errorText}>{error}</Text>
                <Button
                  title="Retry"
                  variant="outline"
                  loading={refreshing}
                  onPress={onRefresh}
                />
              </View>
            )}

            {/* Filter Chips */}
            <View
              style={[
                styles.section,
                isCompact && styles.sectionMobile,
                isWebPage && web.section,
              ]}
            >
              <VehicleFilters
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
              />
            </View>

            {isCompact && (!error || allVehicles.length > 0) && overview}

            {/* Vehicles Grid/List */}
            <View
              style={[
                styles.section,
                isCompact && styles.sectionMobile,
                isWebPage && web.section,
              ]}
            >
              {error && allVehicles.length === 0 ? null : isWebPage &&
                layout.isDesktop &&
                filteredVehicles.length > 0 ? (
                <View style={web.panel}>
                  <Text style={web.heading}>
                    {filterLabel} ({filteredVehicles.length})
                  </Text>
                  <VehicleTable
                    onView={(id) =>
                      router.push({
                        pathname: "/vehicles/[id]",
                        params: { id, returnTo: "vehicles" },
                      })
                    }
                    vehicles={filteredVehicles.map((vehicle) => ({
                      ...vehicle,
                      isSharedWithMe: !vehicle.is_own_vehicle,
                      shareCount:
                        vehicle.sharing_info?.total_shares ??
                        vehicle.shared_groups?.length ??
                        0,
                    }))}
                  />
                </View>
              ) : isWebPage &&
                allVehicles.length > 0 &&
                filteredVehicles.length === 0 ? (
                <View style={web.panel}>
                  <Text style={web.heading}>No matching vehicles</Text>
                  <Button
                    title="Clear filters"
                    variant="outline"
                    onPress={() => {
                      setSearchQuery("");
                      setActiveFilter("all");
                    }}
                  />
                </View>
              ) : (
                <VehicleList
                  vehicles={filteredVehicles}
                  filterLabel={filterLabel}
                  onVehiclePress={handleOpenBottomSheet}
                  isDesktop={isWebPage && layout.isDesktop}
                  onClearFilters={
                    allVehicles.length > 0 ? clearFilters : undefined
                  }
                />
              )}
            </View>
          </ScrollView>

          {/* Bottom Sheet Modal - Native only */}
          {Platform.OS !== "web" && VehicleDetailsBottomSheet && (
            <VehicleDetailsBottomSheet
              ref={bottomSheetRef}
              vehicle={selectedVehicle}
              onClose={handleCloseBottomSheet}
            />
          )}
        </MaxWidthContainer>
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
  headerTitleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
  },
  headerTitleGroup: { flex: 1, minWidth: 160 },
  errorText: { color: theme.colors.error, marginBottom: theme.spacing.md },
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
