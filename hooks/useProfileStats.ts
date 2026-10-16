import { useAuth } from "@/lib/contexts/AuthContext";
import { supabase } from "@/services/supabaseClient";
import { useCallback, useEffect, useRef, useState } from "react";

export interface ProfileStats {
  totalLogs: number;
  activeGroups: number;
  daysActive: number;
}

const EMPTY_STATS: ProfileStats = {
  totalLogs: 0,
  activeGroups: 0,
  daysActive: 0,
};

export function useProfileStats() {
  const { user } = useAuth();
  const userId = user?.id;
  const createdAtValue = user?.profile?.created_at;
  const request = useRef(0);
  const [statsUser, setStatsUser] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    totalLogs: 0,
    activeGroups: 0,
    daysActive: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const id = ++request.current;
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // OPTIMIZATION: Fetch vehicles, groups, and memberships in parallel
      const results = await Promise.all([
        supabase.from("vehicles").select("id").eq("user_id", userId),
        supabase.from("group_members").select("group_id").eq("user_id", userId),
        supabase
          .from("groups")
          .select("id", { count: "exact" })
          .eq("owner_id", userId),
      ]);

      if (id !== request.current) return;
      if (results.some((result) => result.error))
        throw new Error("Profile counts unavailable");
      const [
        { data: ownVehicles },
        { data: groupMemberships },
        { data: ownedGroups },
      ] = results;

      const vehicleIds =
        (ownVehicles as { id: string }[] | null)?.map((v) => v.id) || [];

      // Get shared vehicle IDs
      let sharedVehicleIds: string[] = [];
      if (groupMemberships && groupMemberships.length > 0) {
        const groupIds = (groupMemberships as { group_id: string }[]).map(
          (gm) => gm.group_id,
        );
        const { data: sharedVehicles, error: sharesError } = await supabase
          .from("vehicle_group_shares")
          .select("vehicle_id")
          .in("group_id", groupIds);

        if (sharesError) throw sharesError;
        if (id !== request.current) return;
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

      if (id !== request.current) return;
      if (
        [mileageResult, fuelResult, serviceResult].some(
          (result) => result.error,
        )
      )
        throw new Error("Profile counts unavailable");
      const totalLogs =
        (mileageResult.count || 0) +
        (fuelResult.count || 0) +
        (serviceResult.count || 0);

      // Owners also have membership rows; count each group once.
      const activeGroups = new Set([
        ...((ownedGroups as { id: string }[] | null)?.map(
          (group) => group.id,
        ) || []),
        ...((groupMemberships as { group_id: string }[] | null)?.map(
          (member) => member.group_id,
        ) || []),
      ]).size;

      // Calculate days active (from account creation to now)
      const createdAt = new Date(createdAtValue || Date.now());
      const now = new Date();
      const diffTime = Math.max(0, now.getTime() - createdAt.getTime());
      const daysActive = Number.isFinite(diffTime)
        ? Math.ceil(diffTime / 86400000)
        : 0;

      setStatsUser(userId);
      setStats({
        totalLogs,
        activeGroups,
        daysActive,
      });
    } catch {
      if (id === request.current) setError("Couldn't load profile statistics");
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, [userId, createdAtValue]);

  useEffect(() => {
    const generation = request;
    void fetchStats();
    return () => {
      generation.current++;
    };
  }, [fetchStats]);

  return {
    stats: statsUser === userId ? stats : EMPTY_STATS,
    loading,
    error,
    hasData: !!userId && statsUser === userId,
    refetch: fetchStats,
  };
}
