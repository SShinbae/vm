import { useAuth } from "@/lib/contexts/AuthContext";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/services/supabaseClient";
import { Database } from "@/types/database";
import { fetchAccessibleVehicles } from "@/lib/services/vehicleAccess";

// Import types from original hook
type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
export interface VehicleWithShares extends Vehicle {
  shareCount: number;
  isSharedWithMe: boolean;
  ownerName: string | null;
}

async function fetchVehicles(userId: string): Promise<VehicleWithShares[]> {
  // Use the same RPC as stats to get both owned and shared vehicles
  const { data: allVehiclesData, error: rpcError } =
    await fetchAccessibleVehicles(userId);

  if (rpcError) throw rpcError;
  if (!allVehiclesData || allVehiclesData.length === 0) return [];

  const vehicleIds = allVehiclesData.map((v: any) => v.vehicle_id);

  // Fetch mileage logs for accurate mileage readings
  const { data: mileageLogs } = await supabase
    .from("mileage_logs")
    .select("vehicle_id, odometer_reading")
    .in("vehicle_id", vehicleIds);

  // Build a map of vehicle_id -> max odometer reading
  const maxMileageByVehicle: Record<string, number> = {};
  mileageLogs?.forEach((log: any) => {
    const current = maxMileageByVehicle[log.vehicle_id] || 0;
    if (log.odometer_reading > current) {
      maxMileageByVehicle[log.vehicle_id] = log.odometer_reading;
    }
  });

  return allVehiclesData.map((v: any) => {
    const logMileage = maxMileageByVehicle[v.vehicle_id] || 0;
    const effectiveMileage = Math.max(v.current_mileage || 0, logMileage);
    const isOwn = v.is_own_vehicle === true;

    return {
      id: v.vehicle_id,
      user_id: v.owner_id,
      make: v.make,
      model: v.model,
      year: v.year,
      license_plate: v.license_plate,
      current_mileage: effectiveMileage,
      main_image_url: v.main_image_url,
      created_at: v.created_at,
      updated_at: v.updated_at ?? v.created_at,
      vin: v.vin ?? null,
      color: v.color ?? null,
      shared_with_groups: (v.shared_groups?.length || 0) > 0,
      shareCount: isOwn ? v.shared_groups?.length || 0 : 0,
      isSharedWithMe: !isOwn,
      ownerName: v.owner_name ?? null,
    } as VehicleWithShares;
  });
}

export function accessibleVehicleQueryOptions(userId?: string) {
  return queryOptions({
    queryKey: ["dashboard", "vehicles", userId],
    queryFn: () => fetchVehicles(userId!),
    enabled: !!userId,
    staleTime: 3 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useAccessibleVehiclesQuery() {
  const { user } = useAuth();
  return useQuery(accessibleVehicleQueryOptions(user?.id));
}
