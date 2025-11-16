import React from "react";
import { View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { FilterChip } from "./FilterChip";
import { FilterType } from "@/hooks/useVehicleFilters";

interface VehicleFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

/**
 * VehicleFilters Component
 * Displays a row of filter chips for vehicle filtering
 * Isolated component for easier filter management and customization
 */
export function VehicleFilters({
  activeFilter,
  onFilterChange,
}: VehicleFiltersProps) {
  const { styles } = useStyles(stylesheet);

  const filters: { filter: FilterType; label: string }[] = [
    { filter: "all", label: "All Vehicles" },
    { filter: "own", label: "My Vehicles" },
    { filter: "shared", label: "Shared" },
    { filter: "2020-2025", label: "2020-2025" },
    { filter: "2015-2019", label: "2015-2019" },
    { filter: "before-2015", label: "Before 2015" },
  ];

  return (
    <View style={styles.filterChipsWrapper}>
      {filters.map(({ filter, label }) => (
        <FilterChip
          key={filter}
          filter={filter}
          label={label}
          activeFilter={activeFilter}
          onPress={onFilterChange}
        />
      ))}
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  filterChipsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
}));
