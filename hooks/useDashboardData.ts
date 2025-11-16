import { useAuth } from "@/lib/contexts/AuthContext";
import { supabase } from "@/services/supabaseClient";
import { Database } from "@/types/database";
import { useCallback, useEffect, useState } from "react";

// --- Types (Could be in a separate types.ts file) ---
type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
export interface VehicleWithShares extends Vehicle {
  shareCount: number;
}

export interface DashboardStats {
  totalVehicles: number;
  totalMileage: number;
  monthlyFuelCost: number;
  upcomingServices: number;
  totalVehiclesTrend: number;
  totalMileageTrend: number;
  monthlyFuelCostTrend: number;
  upcomingServicesTrend: number;
}

export interface ActivityItem {
  id: string;
  type: "mileage" | "fuel" | "service";
  date: string;
  vehicleName: string;
  primaryValue: string;
  icon: string;
}

// --- Helper Functions (Could be in a utils file) ---

/**
 * Combines, sorts, and transforms raw logs into a unified activity feed.
 */
const processActivityLogs = (
  mileageLogs: any[],
  fuelLogs: any[],
  serviceLogs: any[],
): ActivityItem[] => {
  const activities: ActivityItem[] = [];

  mileageLogs?.forEach((log) => {
    activities.push({
      id: log.id,
      type: "mileage",
      date: log.date,
      vehicleName: `${log.vehicles?.year} ${log.vehicles?.make} ${log.vehicles?.model}`,
      primaryValue: `${log.odometer_reading.toLocaleString()} km`,
      icon: "speedometer",
    });
  });

  fuelLogs?.forEach((log) => {
    activities.push({
      id: log.id,
      type: "fuel",
      date: log.date,
      vehicleName: `${log.vehicles?.year} ${log.vehicles?.make} ${log.vehicles?.model}`,
      primaryValue: `RM${log.cost?.toFixed(2) || "0.00"} • ${log.liters_filled}L`,
      icon: "fuelpump.fill",
    });
  });

  serviceLogs?.forEach((log) => {
    activities.push({
      id: log.id,
      type: "service",
      date: log.date,
      vehicleName: `${log.vehicles?.year} ${log.vehicles?.make} ${log.vehicles?.model}`,
      primaryValue: `${log.service_type} • RM${log.cost?.toFixed(2) || "0.00"}`,
      icon: "wrench.fill",
    });
  });

  // Sort by date and take top 5
  return activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
};

// --- The Custom Hook ---
export const useDashboardData = () => {
  const { user } = useAuth();

  const [vehicles, setVehicles] = useState<VehicleWithShares[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    totalMileage: 0,
    monthlyFuelCost: 0,
    upcomingServices: 0,
    totalVehiclesTrend: 0,
    totalMileageTrend: 0,
    monthlyFuelCostTrend: 0,
    upcomingServicesTrend: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      // Get ALL vehicles (owned + shared) using the database function
      const { data: allVehiclesData, error: vehiclesError } = await (
        supabase as any
      ).rpc("get_user_vehicles_with_sharing", { user_uuid: user.id });
      if (vehiclesError) throw vehiclesError;

      // Extract vehicle IDs and calculate stats
      const vehicleIds = allVehiclesData?.map((v: any) => v.vehicle_id) || [];
      const totalVehicles = vehicleIds.length;
      const totalMileage =
        allVehiclesData?.reduce(
          (sum: number, v: any) => sum + (v.current_mileage || 0),
          0,
        ) || 0;

      // Get monthly fuel cost (current month)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: currentMonthFuelData, error: fuelError } = await supabase
        .from("fuel_logs")
        .select("cost, date")
        .in("vehicle_id", vehicleIds)
        .gte("date", startOfMonth.toISOString());
      if (fuelError) throw fuelError;

      let monthlyFuelCost =
        currentMonthFuelData?.reduce((sum, f: any) => sum + (f.cost || 0), 0) ||
        0;
      console.log(
        `📊 Dashboard - Monthly fuel cost for ${vehicleIds.length} vehicles: RM${monthlyFuelCost.toFixed(2)}`,
      );

      // Get upcoming services (services due in next 30 days) for ALL vehicles
      const thirtyDaysLater = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000,
      );

      const { data: servicesData, error: servicesError } = await supabase
        .from("service_logs")
        .select("next_service_due")
        .in("vehicle_id", vehicleIds)
        .gte("next_service_due", now.toISOString())
        .lte("next_service_due", thirtyDaysLater.toISOString());
      if (servicesError) throw servicesError;

      const upcomingServices = servicesData?.length || 0;

      setStats({
        totalVehicles,
        totalMileage,
        monthlyFuelCost,
        upcomingServices,
        totalVehiclesTrend: 0, // Mock trends
        totalMileageTrend: 5.2,
        monthlyFuelCostTrend: -3.1,
        upcomingServicesTrend: 0,
      });
    } catch (err: any) {
      console.error("Error fetching stats:", err);
      setError("Failed to load dashboard statistics");
      throw err; // Re-throw to be caught by Promise.all
    }
  }, [user]);

  const fetchVehicles = useCallback(async () => {
    if (!user) return;
    try {
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("*, vehicle_group_shares(count)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (vehiclesError) throw vehiclesError;

      const vehiclesWithShares: VehicleWithShares[] =
        vehiclesData?.map((v: any) => ({
          ...v,
          shareCount: v.vehicle_group_shares?.[0]?.count || 0,
        })) || [];

      setVehicles(vehiclesWithShares);
    } catch (err: any) {
      console.error("Error fetching vehicles:", err);
      setError("Failed to load vehicles");
      throw err;
    }
  }, [user]);

  const fetchRecentActivity = useCallback(async () => {
    if (!user) return;
    try {
      // *** IMPROVEMENT: Fetch all logs in parallel ***
      const [mileagePromise, fuelPromise, servicePromise] = await Promise.all([
        supabase
          .from("mileage_logs")
          .select("id, date, odometer_reading, vehicles(make, model, year)")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(5),
        supabase
          .from("fuel_logs")
          .select("id, date, cost, liters_filled, vehicles(make, model, year)")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(5),
        supabase
          .from("service_logs")
          .select("id, date, service_type, cost, vehicles(make, model, year)")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(5),
      ]);

      if (mileagePromise.error) throw mileagePromise.error;
      if (fuelPromise.error) throw fuelPromise.error;
      if (servicePromise.error) throw servicePromise.error;

      const combined = processActivityLogs(
        mileagePromise.data,
        fuelPromise.data,
        servicePromise.data,
      );
      setRecentActivity(combined);
    } catch (err: any) {
      console.error("Error fetching recent activity:", err);
      // Don't set a hard error for this, as it's less critical
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      await Promise.all([fetchStats(), fetchVehicles(), fetchRecentActivity()]);
    } catch (err) {
      // Error is already set by the individual functions
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchStats, fetchVehicles, fetchRecentActivity]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  return {
    stats,
    vehicles,
    recentActivity,
    loading,
    refreshing,
    error,
    user,
    onRefresh,
  };
};
