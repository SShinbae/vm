import { IconSymbol } from "@/components/ui/icon-symbol";
import { VehicleWithShares } from "@/hooks/useDashboardData"; // Import the type
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

type VehicleCardProps = {
  vehicle: VehicleWithShares;
};

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const { styles, theme } = useStyles(stylesheet);
  const [imageError, setImageError] = useState(false);

  const parts = [vehicle.year, vehicle.make, vehicle.model]
    .filter((val) => val != null && val !== "")
    .map(String);
  const vehicleName = parts.length > 0 ? parts.join(" ") : "Unknown Vehicle";

  return (
    <TouchableOpacity
      style={styles.vehicleCard}
      onPress={() => router.push(`/vehicles/${vehicle.id}` as any)}
      accessibilityLabel={`View details for ${vehicleName}`}
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
          <IconSymbol name="car.fill" size={24} color={theme.colors.primary} />
        </View>
      )}
      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleName} numberOfLines={1}>
          {String(vehicleName)}
        </Text>
        <Text style={styles.vehicleDetail}>
          {vehicle.license_plate ? String(vehicle.license_plate) : "N/A"}
        </Text>
        <Text style={styles.vehicleDetail}>
          {vehicle.current_mileage != null
            ? `${Number(vehicle.current_mileage).toLocaleString()} km`
            : "0 km"}
        </Text>
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
}

const stylesheet = createStyleSheet((theme) => ({
  vehicleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
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
  sharedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    alignSelf: "flex-start", // Align to top
  },
  sharedBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
}));
