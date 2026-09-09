import { withOpacity, spacing } from "@/src/design-system";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { VehicleWithShares } from "@/hooks/useDashboardDataQuery";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

type VehicleTableProps = {
  vehicles: VehicleWithShares[];
};

function VehicleTableRow({ vehicle }: { vehicle: VehicleWithShares }) {
  const { styles, theme } = useStyles(stylesheet);
  const [imageError, setImageError] = useState(false);

  const parts = [vehicle.year, vehicle.make, vehicle.model]
    .filter((val) => val != null && val !== "")
    .map(String);
  const vehicleName = parts.length > 0 ? parts.join(" ") : "Unknown Vehicle";

  return (
    <View style={styles.row}>
      {/* Vehicle Column */}
      <View style={styles.vehicleColumn}>
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
              size={20}
              color={theme.colors.primary}
            />
          </View>
        )}
        <View style={styles.vehicleNameContainer}>
          <Text style={styles.vehicleNameText} numberOfLines={1}>
            {String(vehicleName)}
          </Text>
          <Text style={styles.vehicleSubText} numberOfLines={1}>
            {vehicle.license_plate ? String(vehicle.license_plate) : "N/A"}
          </Text>
        </View>
      </View>

      {/* Plate Number Column */}
      <View style={styles.plateColumn}>
        <Text style={styles.cellText} numberOfLines={1}>
          {vehicle.license_plate ? String(vehicle.license_plate) : "N/A"}
        </Text>
      </View>

      {/* Mileage Column */}
      <View style={styles.mileageColumn}>
        <Text style={styles.cellText} numberOfLines={1}>
          {vehicle.current_mileage != null
            ? `${Number(vehicle.current_mileage).toLocaleString()} km`
            : "0 km"}
        </Text>
      </View>

      {/* Status Column */}
      <View style={styles.statusColumn}>
        {vehicle.isSharedWithMe ? (
          <View style={styles.sharedWithMeBadge}>
            <Text style={styles.badgeText}>Shared with me</Text>
          </View>
        ) : vehicle.shareCount > 0 ? (
          <View style={styles.sharedBadge}>
            <Text style={styles.badgeText}>Shared</Text>
          </View>
        ) : (
          <View style={styles.activeBadge}>
            <Text style={styles.badgeText}>Active</Text>
          </View>
        )}
      </View>

      {/* Actions Column */}
      <View style={styles.actionsColumn}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => router.push(`/vehicles/${vehicle.id}` as any)}
          accessibilityLabel={`View details for ${vehicleName}`}
        >
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function VehicleTable({ vehicles }: VehicleTableProps) {
  const { styles } = useStyles(stylesheet);

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.vehicleColumn}>
          <Text style={styles.headerText}>Vehicle</Text>
        </View>
        <View style={styles.plateColumn}>
          <Text style={styles.headerText}>Plate Number</Text>
        </View>
        <View style={styles.mileageColumn}>
          <Text style={styles.headerText}>Mileage</Text>
        </View>
        <View style={styles.statusColumn}>
          <Text style={styles.headerText}>Status</Text>
        </View>
        <View style={styles.actionsColumn}>
          <Text style={styles.headerText}>Actions</Text>
        </View>
      </View>

      {/* Data Rows */}
      {vehicles.map((vehicle) => (
        <VehicleTableRow key={vehicle.id} vehicle={vehicle} />
      ))}
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  headerText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: withOpacity(theme.colors.textSecondary, 0.12),
  },
  vehicleColumn: {
    flex: 35,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.sm,
  },
  plateColumn: {
    flex: 15,
    paddingRight: theme.spacing.sm,
  },
  mileageColumn: {
    flex: 15,
    paddingRight: theme.spacing.sm,
  },
  statusColumn: {
    flex: 15,
    paddingRight: theme.spacing.sm,
  },
  actionsColumn: {
    flex: 20,
    alignItems: "flex-end",
  },
  vehicleImage: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.disabled,
  },
  vehiclePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: withOpacity(theme.colors.primary, 0.08),
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleNameContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  vehicleNameText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  vehicleSubText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  cellText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  sharedBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    alignSelf: "flex-start",
  },
  activeBadge: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    alignSelf: "flex-start",
  },
  sharedWithMeBadge: {
    backgroundColor: theme.colors.warning,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  viewButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  viewButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
}));
