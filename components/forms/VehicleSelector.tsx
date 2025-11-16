import { IconSymbol } from "@/components/ui/icon-symbol";
import { VehicleWithDetails } from "@/types/database-v2";
import { Image } from "expo-image";
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { VehicleOption } from "./VehicleOption";

type VehicleSelectorProps = {
  vehicles: VehicleWithDetails[];
  selectedVehicleId: string;
  onSelectVehicle: (id: string) => void;
  isLocked: boolean;
};

export function VehicleSelector({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  isLocked,
}: VehicleSelectorProps) {
  const { styles, theme } = useStyles(stylesheet);
  const [imageError, setImageError] = useState(false);
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  // --- Locked State ---
  if (isLocked && selectedVehicle) {
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Vehicle <Text style={styles.requiredLabel}>*</Text>
        </Text>
        <View style={styles.lockedVehicleContainer}>
          <View style={styles.lockedVehicle}>
            {selectedVehicle.main_image_url && !imageError ? (
              <Image
                source={{ uri: selectedVehicle.main_image_url }}
                style={styles.vehicleIcon}
                contentFit="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={[styles.vehicleIcon, styles.vehicleIconPlaceholder]}>
                <IconSymbol
                  name="car.fill"
                  size={16}
                  color={theme.colors.primary}
                />
              </View>
            )}
            <View style={styles.lockedVehicleInfo}>
              <Text style={styles.lockedVehicleText} numberOfLines={1}>
                {selectedVehicle.year} {selectedVehicle.make}{" "}
                {selectedVehicle.model}
              </Text>
              <Text style={styles.lockedVehiclePlate}>
                {selectedVehicle.license_plate}
              </Text>
            </View>
            <View style={styles.lockIcon}>
              <IconSymbol
                name="lock.fill"
                size={14}
                color={theme.colors.textSecondary}
              />
            </View>
          </View>
          <Text style={styles.lockedHelpText}>
            Adding fuel log for this vehicle
          </Text>
        </View>
      </View>
    );
  }

  // --- Selectable State ---
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        Vehicle <Text style={styles.requiredLabel}>*</Text>
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.vehicleSelectorContent}
      >
        {vehicles.map((vehicle) => (
          <VehicleOption
            key={vehicle.id}
            vehicle={vehicle}
            isSelected={selectedVehicleId === vehicle.id}
            onPress={() => onSelectVehicle(vehicle.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  requiredLabel: {
    color: theme.colors.error,
  },
  // Selector Styles
  vehicleSelectorContent: {
    gap: theme.spacing.md,
  },
  // Locked Styles
  lockedVehicleContainer: {
    gap: theme.spacing.sm,
  },
  lockedVehicle: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border, // Use warning if you want it to stand out
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  vehicleIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
  },
  vehicleIconPlaceholder: {
    backgroundColor: theme.colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  lockedVehicleInfo: {
    flex: 1,
  },
  lockedVehicleText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  lockedVehiclePlate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  lockIcon: {
    padding: theme.spacing.xs,
  },
  lockedHelpText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontStyle: "italic",
    paddingLeft: theme.spacing.xs,
  },
}));
