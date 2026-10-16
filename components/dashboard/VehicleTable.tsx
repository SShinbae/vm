import { storageImageUrl } from "@/lib/utils/storagePath";
import { withOpacity, spacing } from "@/src/design-system";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { VehicleWithShares } from "@/hooks/useDashboardDataQuery";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

export type VehicleTableItem = Pick<
  VehicleWithShares,
  | "id"
  | "year"
  | "make"
  | "model"
  | "main_image_url"
  | "license_plate"
  | "current_mileage"
  | "isSharedWithMe"
  | "shareCount"
>;
type VehicleTableProps = {
  vehicles: VehicleTableItem[];
  onView?: (id: string) => void;
};

function VehicleTableRow({
  vehicle,
  onView,
}: {
  vehicle: VehicleTableItem;
  onView?: (id: string) => void;
}) {
  const { styles, theme } = useStyles(stylesheet);
  const [imageError, setImageError] = useState(false);

  const parts = [vehicle.year, vehicle.make, vehicle.model]
    .filter((val) => val != null && val !== "")
    .map(String);
  const vehicleName = parts.length > 0 ? parts.join(" ") : "Unknown Vehicle";
  const handleView = () =>
    onView ? onView(vehicle.id) : router.push(`/vehicles/${vehicle.id}` as any);

  return (
    <View style={styles.row}>
      {/* Vehicle Column */}
      <TouchableOpacity
        style={styles.vehicleColumn}
        onPress={handleView}
        accessibilityRole="link"
        accessibilityLabel={`Open ${vehicleName}`}
      >
        {vehicle.main_image_url && !imageError ? (
          <Image
            source={{
              uri: storageImageUrl("vehicle-images", vehicle.main_image_url),
            }}
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
            {[vehicle.make, vehicle.model].filter(Boolean).join(" ") ||
              "Vehicle"}
          </Text>
        </View>
      </TouchableOpacity>

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
            <IconSymbol
              name="person.2.fill"
              size={14}
              color={theme.colors.warning}
            />
            <Text style={[styles.badgeText, styles.sharedWithMeText]}>
              Shared with me
            </Text>
          </View>
        ) : vehicle.shareCount > 0 ? (
          <View style={styles.sharedBadge}>
            <IconSymbol
              name="person.2.fill"
              size={14}
              color={theme.colors.primary}
            />
            <Text style={[styles.badgeText, styles.sharedText]}>Shared</Text>
          </View>
        ) : (
          <View style={styles.activeBadge}>
            <IconSymbol
              name="checkmark.circle.fill"
              size={14}
              color={theme.colors.success}
            />
            <Text style={[styles.badgeText, styles.activeText]}>Active</Text>
          </View>
        )}
      </View>

      {/* Actions Column */}
      <View style={styles.actionsColumn}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={handleView}
          accessibilityLabel={`View details for ${vehicleName}`}
        >
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function VehicleTable({ vehicles, onView }: VehicleTableProps) {
  const { styles } = useStyles(stylesheet);
  const [width, setWidth] = useState(0);

  return (
    <View
      style={styles.container}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={{ width: Math.max(width - 2, 760) }}>
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
            <VehicleTableRow
              key={vehicle.id}
              vehicle={vehicle}
              onView={onView}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: withOpacity(theme.colors.textSecondary, 0.06),
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
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: withOpacity(theme.colors.textSecondary, 0.12),
  },
  vehicleColumn: {
    flex: 31,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.sm,
  },
  plateColumn: {
    flex: 14,
    paddingRight: theme.spacing.sm,
  },
  mileageColumn: {
    flex: 15,
    paddingRight: theme.spacing.sm,
  },
  statusColumn: {
    flex: 22,
    paddingRight: theme.spacing.sm,
  },
  actionsColumn: {
    flex: 18,
    alignItems: "flex-end",
  },
  vehicleImage: {
    width: 52,
    height: 52,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.disabled,
  },
  vehiclePlaceholder: {
    width: 52,
    height: 52,
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
    backgroundColor: withOpacity(theme.colors.primary, 0.1),
    borderWidth: 1,
    borderColor: withOpacity(theme.colors.primary, 0.35),
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  activeBadge: {
    backgroundColor: withOpacity(theme.colors.success, 0.1),
    borderWidth: 1,
    borderColor: withOpacity(theme.colors.success, 0.35),
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  sharedWithMeBadge: {
    backgroundColor: withOpacity(theme.colors.warning, 0.1),
    borderWidth: 1,
    borderColor: withOpacity(theme.colors.warning, 0.55),
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  badgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  sharedWithMeText: { color: theme.colors.warning },
  sharedText: { color: theme.colors.primary },
  activeText: { color: theme.colors.success },
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
