import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Ionicons } from "@expo/vector-icons";
import { Vehicle } from "../../types";

interface VehicleFilterProps {
  vehicles: Vehicle[];
  selectedVehicleIds: string[];
  onToggleVehicle: (vehicleId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export function VehicleFilter({
  vehicles,
  selectedVehicleIds,
  onToggleVehicle,
  onSelectAll,
  onClearAll,
}: VehicleFilterProps) {
  const { styles, theme } = useStyles(stylesheet);

  const isAllSelected = selectedVehicleIds.length === 0;

  const isVehicleSelected = (vehicleId: string) => {
    return isAllSelected || selectedVehicleIds.includes(vehicleId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons
            name="car-outline"
            size={20}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.title}>Filter by Vehicle</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={onSelectAll}>
            <Text style={styles.actionText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClearAll}>
            <Text style={styles.actionTextSecondary}>None</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {vehicles.map((vehicle) => {
          const isSelected = isVehicleSelected(vehicle.id);
          return (
            <TouchableOpacity
              key={vehicle.id}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onToggleVehicle(vehicle.id)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  actionText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
  },
  actionTextSecondary: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  chipsContainer: {
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.lg,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
  },
  chipText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  chipTextSelected: {
    color: theme.colors.white,
  },
}));
