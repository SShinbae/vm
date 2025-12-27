import { useAuth } from "@/lib/contexts/AuthContext";
import { useQueries } from "@tanstack/react-query";
import { supabase } from "@/services/supabaseClient";
import { Database } from "@/types/database";

// Import types from original hook
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

// Default stats
const defaultStats: DashboardStats = {
  totalVehicles: 0,
  totalMileage: 0,
  monthlyFuelCost: 0,
  upcomingServices: 0,
  totalVehiclesTrend: 0,
  totalMileageTrend: 0,
  monthlyFuelCostTrend: 0,
  upcomingServicesTrend: 0,
};

/**
 * Process activity logs into unified feed
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
      icon: "speedometer-outline",
    });
  });

  fuelLogs?.forEach((log) => {
    activities.push({
      id: log.id,
      type: "fuel",
      date: log.date,
      vehicleName: `${log.vehicles?.year} ${log.vehicles?.make} ${log.vehicles?.model}`,
      primaryValue: `RM${log.cost.toFixed(2)}`,
      icon: "water-outline",
    });
  });

  serviceLogs?.forEach((log) => {
    activities.push({
      id: log.id,
      type: "service",
      date: log.service_date,
      vehicleName: `${log.vehicles?.year} ${log.vehicles?.make} ${log.vehicles?.model}`,
      primaryValue: `RM${log.cost.toFixed(2)}`,
      icon: "build-outline",
    });
  });

  return activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);
};

/**
 * Fetch dashboard statistics
 */
async function fetchStats(userId: string): Promise<DashboardStats> {
  // Get vehicles
  const { data: allVehiclesData } = await (supabase as any).rpc(
    "get_user_vehicles_with_sharing",
    { user_uuid: userId },
  );

  const vehicleIds = allVehiclesData?.map((v: any) => v.vehicle_id) || [];
  const totalVehicles = vehicleIds.length;
  const totalMileage =
    allVehiclesData?.reduce(
      (sum: number, v: any) => sum + (v.current_mileage || 0),
      0,
    ) || 0;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Fetch fuel and service data in parallel
  const [fuelResult, servicesResult] = await Promise.all([
    supabase
      .from("fuel_logs")
      .select("cost, date")
      .in("vehicle_id", vehicleIds)
      .gte("date", startOfMonth.toISOString()),
    supabase
      .from("service_logs")
      .select("next_service_due")
      .in("vehicle_id", vehicleIds)
      .gte("next_service_due", now.toISOString())
      .lte("next_service_due", thirtyDaysLater.toISOString()),
  ]);

  const monthlyFuelCost =
    fuelResult.data?.reduce((sum, f: any) => sum + (f.cost || 0), 0) || 0;
  const upcomingServices = servicesResult.data?.length || 0;

  return {
    totalVehicles,
    totalMileage,
    monthlyFuelCost,
    upcomingServices,
    totalVehiclesTrend: 0,
    totalMileageTrend: 5.2,
    monthlyFuelCostTrend: -3.1,
    upcomingServicesTrend: 0,
  };
}

/**
 * Fetch vehicles with share counts and accurate mileage
 */
async function fetchVehicles(userId: string): Promise<VehicleWithShares[]> {
  // Fetch vehicles directly with mileage logs to get accurate mileage
  // This approach is more reliable than the RPC function
  const { data: vehiclesData, error: vehiclesError } = await supabase
    .from("vehicles")
    .select("*, vehicle_group_shares(count), mileage_logs(odometer_reading)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (vehiclesError) throw vehiclesError;

  return (vehiclesData || []).map((v: any) => {
    // Find maximum mileage from logs if available
    const maxLogMileage =
      v.mileage_logs?.reduce(
        (max: number, log: any) =>
          log.odometer_reading > max ? log.odometer_reading : max,
        0,
      ) || 0;

    // Use the greater of current_mileage or maxLogMileage
    const effectiveMileage = Math.max(v.current_mileage || 0, maxLogMileage);

    return {
      ...v,
      current_mileage: effectiveMileage,
      shareCount: v.vehicle_group_shares?.[0]?.count || 0,
    };
  });
}

/**
 * Fetch recent activity
 */
async function fetchRecentActivity(userId: string): Promise<ActivityItem[]> {
  const [mileagePromise, fuelPromise, servicePromise] = await Promise.all([
    supabase
      .from("mileage_logs")
      .select("*, vehicles(year, make, model)")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(10),
    supabase
      .from("fuel_logs")
      .select("*, vehicles(year, make, model)")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(10),
    supabase
      .from("service_logs")
      .select("*, vehicles(year, make, model)")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(10),
  ]);

  return processActivityLogs(
    mileagePromise.data || [],
    fuelPromise.data || [],
    servicePromise.data || [],
  );
}

/**
 * React Query-powered dashboard hook with caching and automatic refetching
 *
 * Benefits:
 * - Automatic caching (30s stale time, 5min cache time)
 * - Request deduplication (no duplicate API calls)
 * - Background refetching on mount/reconnect
 * - Instant navigation when data is cached
 * - Optimistic updates support
 */
export const useDashboardDataQuery = () => {
  const { user } = useAuth();

  const queries = useQueries({
    queries: [
      {
        queryKey: ["dashboard", "stats", user?.id],
        queryFn: () => fetchStats(user!.id),
        enabled: !!user,
        staleTime: 30000, // 30s - stats change relatively slowly
        gcTime: 300000, // 5min cache
      },
      {
        queryKey: ["dashboard", "vehicles", user?.id],
        queryFn: () => fetchVehicles(user!.id),
        enabled: !!user,
        staleTime: 60000, // 1min - vehicles change less frequently
        gcTime: 600000, // 10min cache
      },
      {
        queryKey: ["dashboard", "activity", user?.id],
        queryFn: () => fetchRecentActivity(user!.id),
        enabled: !!user,
        staleTime: 15000, // 15s - activity updates more frequently
        gcTime: 180000, // 3min cache
      },
    ],
  });

  const [statsQuery, vehiclesQuery, activityQuery] = queries;

  // Combined loading state
  const loading = queries.some((q) => q.isLoading);
  const refreshing = queries.some((q) => q.isFetching && !q.isLoading);

  // Get error from any query
  const error = queries.find((q) => q.error)?.error;

  // Manual refresh function
  const onRefresh = async () => {
    await Promise.all(queries.map((q) => q.refetch()));
  };

  return {
    stats: statsQuery.data || defaultStats,
    vehicles: vehiclesQuery.data || [],
    recentActivity: activityQuery.data || [],
    loading,
    refreshing,
    error: error ? String(error) : null,
    user,
    onRefresh,
  };
};
