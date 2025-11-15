import { IconSymbol } from "@/components/ui/icon-symbol";
import { VehicleWithDetails } from "@/types/database-v2";
import { Image } from "expo-image";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

type VehicleOptionProps = {
  vehicle: VehicleWithDetails;
  isSelected: boolean;
  onPress: () => void;
};

// This component now has its own styles and logic
export function VehicleOption({
  vehicle,
  isSelected,
  onPress,
}: VehicleOptionProps) {
  const { styles, theme } = useStyles(stylesheet);
  const [imageError, setImageError] = useState(false);

  // Use the 'warning' color as the tint
  const selectedStyles = isSelected && {
    borderColor: theme.colors.warning,
    backgroundColor: theme.colors.warning + "15",
  };

  return (
    <TouchableOpacity
      style={[styles.vehicleOption, selectedStyles]}
      onPress={onPress}
    >
      {vehicle.main_image_url && !imageError ? (
        <Image
          source={{ uri: vehicle.main_image_url }}
          style={styles.vehicleIcon}
          contentFit="cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={[styles.vehicleIcon, styles.vehicleIconPlaceholder]}>
          <IconSymbol name="car.fill" size={16} color={theme.colors.warning} />
        </View>
      )}
      <Text
        style={[styles.vehicleOptionText, isSelected && styles.selectedText]}
        numberOfLines={1}
      >
        {vehicle.year} {vehicle.make}
      </Text>
      <Text
        style={[styles.vehiclePlateText, isSelected && styles.selectedText]}
      >
        {vehicle.license_plate}
      </Text>
    </TouchableOpacity>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  vehicleOption: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    minWidth: 120,
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  vehicleIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
  },
  vehicleIconPlaceholder: {
    backgroundColor: theme.colors.warning + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleOptionText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: "center",
  },
  vehiclePlateText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  selectedText: {
    color: theme.colors.warning,
  },
}));
