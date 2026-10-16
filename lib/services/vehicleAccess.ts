import { supabase } from "@/services/supabaseClient";
import type { Database } from "@/types/database-v2";

type VehicleSharingRow =
  Database["public"]["Functions"]["get_user_vehicles_with_sharing"]["Returns"][number];

export async function fetchAccessibleVehicles(userId: string) {
  const { data, error } = await (supabase as any).rpc(
    "get_user_vehicles_with_sharing",
    { user_uuid: userId },
  );
  const rows = data as VehicleSharingRow[] | null;

  // The sharing join can return the same vehicle once per accessible group.
  return {
    data: rows
      ? Array.from(new Map(rows.map((row) => [row.vehicle_id, row])).values())
      : null,
    error,
  };
}
