import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { VehicleService } from "@/lib/services/vehicleService";
import { VehicleWithDetails } from "@/types/database-v2";
import { toast } from "@/hooks/useToast";

export function useVehicles() {
  const [allVehicles, setAllVehicles] = useState<VehicleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const focused = useRef(false);
  const requestId = useRef(0);
  const hasLoaded = useRef(false);

  const fetchVehicles = useCallback(async () => {
    const empty = { ownVehicles: [], sharedVehicles: [] };
    if (!focused.current) return empty;
    const request = ++requestId.current;
    try {
      const result = await VehicleService.getVehiclesSeparated();
      if (!focused.current || request !== requestId.current) return empty;
      if (result.error || !result.data)
        throw new Error(result.error || "No vehicle data");
      setAllVehicles([
        ...result.data.ownVehicles,
        ...result.data.sharedVehicles,
      ]);
      hasLoaded.current = true;
      setError(null);
      return result.data;
    } catch {
      if (focused.current && request === requestId.current) {
        setError("Failed to load vehicles");
        toast.error("Failed to load vehicles");
      }
      return empty;
    } finally {
      if (focused.current && request === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVehicles();
  }, [fetchVehicles]);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      setLoading(!hasLoaded.current);
      setRefreshing(hasLoaded.current);
      void fetchVehicles();
      return () => {
        focused.current = false;
        requestId.current++;
      };
    }, [fetchVehicles]),
  );

  return {
    allVehicles,
    loading,
    refreshing,
    error,
    onRefresh,
    refetch: fetchVehicles,
  };
}
