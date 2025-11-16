import { useMemo, useState } from "react";
import { VehicleWithDetails } from "@/types/database-v2";

export type FilterType =
  | "all"
  | "own"
  | "shared"
  | "2020-2025"
  | "2015-2019"
  | "before-2015";

/**
 * Custom hook for filtering and searching vehicles
 * Provides memoized filtering logic to prevent unnecessary re-renders
 */
export function useVehicleFilters(vehicles: VehicleWithDetails[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  /**
   * Apply filters and search to vehicles list
   * Memoized to only recalculate when dependencies change
   */
  const filteredVehicles = useMemo(() => {
    let filtered = vehicles;

    // Apply ownership filter
    if (activeFilter === "own") {
      filtered = filtered.filter((v) => v.is_own_vehicle);
    } else if (activeFilter === "shared") {
      filtered = filtered.filter((v) => !v.is_own_vehicle);
    }
    // Apply year range filters
    else if (activeFilter === "2020-2025") {
      filtered = filtered.filter((v) => v.year >= 2020 && v.year <= 2025);
    } else if (activeFilter === "2015-2019") {
      filtered = filtered.filter((v) => v.year >= 2015 && v.year <= 2019);
    } else if (activeFilter === "before-2015") {
      filtered = filtered.filter((v) => v.year < 2015);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.make.toLowerCase().includes(query) ||
          v.model.toLowerCase().includes(query) ||
          v.license_plate.toLowerCase().includes(query) ||
          v.year.toString().includes(query),
      );
    }

    return filtered;
  }, [vehicles, activeFilter, searchQuery]);

  /**
   * Get filter label for display
   */
  const getFilterLabel = (): string => {
    switch (activeFilter) {
      case "all":
        return "All Vehicles";
      case "own":
        return "My Vehicles";
      case "shared":
        return "Shared Vehicles";
      default:
        return `Vehicles ${activeFilter}`;
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    filteredVehicles,
    filterLabel: getFilterLabel(),
  };
}
