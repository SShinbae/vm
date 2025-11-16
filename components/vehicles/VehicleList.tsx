import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { ResponsiveGrid } from "@/components/layout/ResponsiveGrid";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { VehicleCard } from "./VehicleCard";
import { VehicleWithDetails } from "@/types/database-v2";

interface VehicleListProps {
  vehicles: VehicleWithDetails[];
  filterLabel: string;
  onVehiclePress: (vehicle: VehicleWithDetails) => void;
  isDesktop?: boolean;
}

/**
 * VehicleList Component
 * Displays a list or grid of vehicles with empty state
 * Supports responsive layout for desktop/mobile
 * Ready for future virtualization/lazy loading
 */
export function VehicleList({
  vehicles,
  filterLabel,
  onVehiclePress,
  isDesktop = false,
}: VehicleListProps) {
  const { styles, theme } = useStyles(stylesheet);

  // Empty state
  if (vehicles.length === 0) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconContainer}>
          <IconSymbol name="car.fill" size={48} color={theme.colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>No Vehicles Yet</Text>
        <Text style={styles.emptyDescription}>
          Add your first vehicle to start tracking maintenance and fuel logs
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
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{filterLabel}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{vehicles.length}</Text>
        </View>
      </View>

      {isDesktop ? (
        <ResponsiveGrid minItemWidth={300} spacing={16}>
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onPress={onVehiclePress}
            />
          ))}
        </ResponsiveGrid>
      ) : (
        <View style={styles.vehiclesList}>
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onPress={onVehiclePress}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    gap: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  vehiclesList: {
    gap: theme.spacing.lg,
  },
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
}));
