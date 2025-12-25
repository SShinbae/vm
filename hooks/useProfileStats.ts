import { useAuth } from "@/lib/contexts/AuthContext";
import { supabase } from "@/services/supabaseClient";
import { useCallback, useEffect, useState } from "react";

export interface ProfileStats {
  totalLogs: number;
  activeGroups: number;
  daysActive: number;
}

export function useProfileStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProfileStats>({
    totalLogs: 0,
    activeGroups: 0,
    daysActive: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // OPTIMIZATION: Fetch vehicles, groups, and memberships in parallel
      const [
        { data: ownVehicles },
        { data: groupMemberships },
        { data: ownedGroups },
      ] = await Promise.all([
        supabase.from("vehicles").select("id").eq("user_id", user.id),
        supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", user.id),
        supabase
          .from("groups")
          .select("id", { count: "exact" })
          .eq("owner_id", user.id),
      ]);

      const vehicleIds =
        (ownVehicles as { id: string }[] | null)?.map((v) => v.id) || [];

      // Get shared vehicle IDs
      let sharedVehicleIds: string[] = [];
      if (groupMemberships && groupMemberships.length > 0) {
        const groupIds = (groupMemberships as { group_id: string }[]).map(
          (gm) => gm.group_id,
        );
        const { data: sharedVehicles } = await supabase
          .from("vehicle_group_shares")
          .select("vehicle_id")
          .in("group_id", groupIds);

        if (sharedVehicles) {
          sharedVehicleIds = (sharedVehicles as { vehicle_id: string }[]).map(
            (sv) => sv.vehicle_id,
          );
        }
      }

      const allVehicleIds = [...new Set([...vehicleIds, ...sharedVehicleIds])];

      // Count total logs across all types in parallel
      const [mileageResult, fuelResult, serviceResult] = await Promise.all([
        supabase
          .from("mileage_logs")
          .select("id", { count: "exact", head: true })
          .in("vehicle_id", allVehicleIds),
        supabase
          .from("fuel_logs")
          .select("id", { count: "exact", head: true })
          .in("vehicle_id", allVehicleIds),
        supabase
          .from("service_logs")
          .select("id", { count: "exact", head: true })
          .in("vehicle_id", allVehicleIds),
      ]);

      const totalLogs =
        (mileageResult.count || 0) +
        (fuelResult.count || 0) +
        (serviceResult.count || 0);

      // Count active groups (owned + member of)
      const activeGroups =
        (ownedGroups?.length || 0) + (groupMemberships?.length || 0);

      // Calculate days active (from account creation to now)
      const createdAt = new Date(user.profile?.created_at || Date.now());
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdAt.getTime());
      const daysActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      setStats({
        totalLogs,
        activeGroups,
        daysActive,
      });
    } catch (error) {
      console.error("Error fetching profile stats:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}
