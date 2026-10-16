import { supabase } from "@/services/supabaseClient";
import { canUserAccessVehicle } from "@/lib/utils/serviceUtils";
import { ApiResponse, FuelLog, MileageLog, ServiceLog } from "@/types";

// Use one database page so owned and shared histories cannot interleave out of order.
export async function getLogHistory<
  T extends FuelLog | MileageLog | ServiceLog,
>(
  table: "fuel_logs" | "mileage_logs" | "service_logs",
  vehicleId?: string,
  options?: { limit?: number; offset?: number; ascending?: boolean },
): Promise<ApiResponse<T[]>> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user)
      return { data: null, error: "User not authenticated", loading: false };

    let vehicleIds: string[];
    if (vehicleId) {
      if (!(await canUserAccessVehicle(vehicleId, user.id))) {
        return {
          data: null,
          error: "Vehicle not found or access denied",
          loading: false,
        };
      }
      vehicleIds = [vehicleId];
    } else {
      const [owned, memberships] = await Promise.all([
        supabase.from("vehicles").select("id").eq("user_id", user.id),
        supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", user.id),
      ]);
      if (owned.error) throw owned.error;
      if (memberships.error) throw memberships.error;
      const groupIds = (memberships.data || []).map(
        (group: { group_id: string }) => group.group_id,
      );
      const shares = groupIds.length
        ? await supabase
            .from("vehicle_group_shares")
            .select("vehicle_id")
            .in("group_id", groupIds)
        : { data: [], error: null };
      if (shares.error) throw shares.error;
      vehicleIds = [
        ...new Set([
          ...(owned.data || []).map((vehicle: { id: string }) => vehicle.id),
          ...(shares.data || []).map(
            (share: { vehicle_id: string }) => share.vehicle_id,
          ),
        ]),
      ];
    }
    if (!vehicleIds.length) return { data: [], error: null, loading: false };

    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 20;
    const ascending = options?.ascending ?? false;
    const { data, error } = await supabase
      .from(table)
      .select(
        "*, vehicles!inner(make, model, year, license_plate, user_id, main_image_url)",
      )
      .in("vehicle_id", vehicleIds)
      .order("date", { ascending })
      .order("id", { ascending })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return {
      data: (data || []).map((log: T & { vehicles: { user_id: string } }) => ({
        ...log,
        is_shared_vehicle: log.vehicles.user_id !== user.id,
      })),
      error: null,
      loading: false,
    };
  } catch {
    return {
      data: null,
      error: "Couldn't load log history. Please try again.",
      loading: false,
    };
  }
}
