import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { FilterType } from "@/hooks/useVehicleFilters";

interface FilterChipProps {
  filter: FilterType;
  label: string;
  activeFilter: FilterType;
  onPress: (filter: FilterType) => void;
}

/**
 * FilterChip Component
 * A chip-style button for filtering vehicles
 * Isolated component for easier testing and reusability
 */
export function FilterChip({
  filter,
  label,
  activeFilter,
  onPress,
}: FilterChipProps) {
  const { styles } = useStyles(stylesheet);
  const isActive = activeFilter === filter;

  return (
    <TouchableOpacity
      style={[styles.filterChip, isActive && styles.filterChipActive]}
      onPress={() => onPress(filter)}
    >
      <Text
        style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  filterChip: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: "30%", // Ensures 3 items per row on mobile
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  filterChipTextActive: {
    color: theme.colors.white,
  },
}));
