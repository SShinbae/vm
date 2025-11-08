import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { VehicleService } from "@/lib/services/vehicleService";
import { VehicleWithDetails } from "@/types/database-v2";
import { useDialog } from "@/lib/contexts/DialogContext";

/**
 * Custom hook for managing vehicle data fetching and state
 * Provides centralized vehicle data management with automatic refresh on screen focus
 */
export function useVehicles() {
  const [allVehicles, setAllVehicles] = useState<VehicleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const dialog = useDialog();

  /**
   * Fetch all vehicles (own and shared)
   */
  const fetchVehicles = useCallback(async () => {
    const vehiclesResult = await VehicleService.getVehiclesSeparated();

    if (vehiclesResult.error) {
      dialog.showError("Error", "Failed to load vehicles");
      console.error("Failed to fetch vehicles:", vehiclesResult.error);
      return { ownVehicles: [], sharedVehicles: [] };
    } else if (vehiclesResult.data) {
      const combinedVehicles = [
        ...vehiclesResult.data.ownVehicles,
        ...vehiclesResult.data.sharedVehicles,
      ];
      setAllVehicles(combinedVehicles);
      return vehiclesResult.data;
    }

    return { ownVehicles: [], sharedVehicles: [] };
  }, [dialog]);

  /**
   * Initial fetch with loading state
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    await fetchVehicles();
    setLoading(false);
  }, [fetchVehicles]);

  /**
   * Refresh handler for pull-to-refresh
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVehicles();
    setRefreshing(false);
  }, [fetchVehicles]);

  /**
   * Auto-refresh on screen focus
   */
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  return {
    allVehicles,
    loading,
    refreshing,
    onRefresh,
    refetch: fetchVehicles,
  };
}
