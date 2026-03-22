import { useAuth } from "@/lib/contexts/AuthContext";
import { useQueries } from "@tanstack/react-query";
import { supabase } from "@/services/supabaseClient";
import { Database } from "@/types/database";

// Import types from original hook
type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
export interface VehicleWithShares extends Vehicle {
  shareCount: number;
  isSharedWithMe: boolean;
  ownerName: string | null;
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
  icon: "speedometer" | "fuelpump.fill" | "wrench.and.screwdriver.fill";
  addedBy: string;
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
      icon: "speedometer",
      addedBy: log.profiles?.full_name ?? "Unknown",
    });
  });

  fuelLogs?.forEach((log) => {
    activities.push({
      id: log.id,
      type: "fuel",
      date: log.date,
      vehicleName: `${log.vehicles?.year} ${log.vehicles?.make} ${log.vehicles?.model}`,
      primaryValue: `RM${log.cost.toFixed(2)}`,
      icon: "fuelpump.fill",
      addedBy: log.profiles?.full_name ?? "Unknown",
    });
  });

  serviceLogs?.forEach((log) => {
    activities.push({
      id: log.id,
      type: "service",
      date: log.service_date,
      vehicleName: `${log.vehicles?.year} ${log.vehicles?.make} ${log.vehicles?.model}`,
      primaryValue: `RM${log.cost.toFixed(2)}`,
      icon: "wrench.and.screwdriver.fill",
      addedBy: log.profiles?.full_name ?? "Unknown",
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

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Fetch mileage logs, fuel, and service data in parallel
  const [mileageResult, fuelResult, servicesResult] = await Promise.all([
    vehicleIds.length > 0
      ? supabase
          .from("mileage_logs")
          .select("vehicle_id, odometer_reading")
          .in("vehicle_id", vehicleIds)
      : Promise.resolve({ data: [] }),
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

  // Build a map of vehicle_id -> max odometer reading
  const maxMileageByVehicle: Record<string, number> = {};
  mileageResult.data?.forEach((log: any) => {
    const current = maxMileageByVehicle[log.vehicle_id] || 0;
    if (log.odometer_reading > current) {
      maxMileageByVehicle[log.vehicle_id] = log.odometer_reading;
    }
  });

  // Calculate totalMileage using max(current_mileage, maxLogMileage) per vehicle
  const totalMileage =
    allVehiclesData?.reduce((sum: number, v: any) => {
      const logMileage = maxMileageByVehicle[v.vehicle_id] || 0;
      return sum + Math.max(v.current_mileage || 0, logMileage);
    }, 0) || 0;

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
 * Fetch vehicles with share counts and accurate mileage (owned + shared)
 */
async function fetchVehicles(userId: string): Promise<VehicleWithShares[]> {
  // Use the same RPC as stats to get both owned and shared vehicles
  const { data: allVehiclesData, error: rpcError } = await (
    supabase as any
  ).rpc("get_user_vehicles_with_sharing", { user_uuid: userId });

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

/**
 * Fetch recent activity (owned + shared vehicles)
 */
async function fetchRecentActivity(userId: string): Promise<ActivityItem[]> {
  // Get all accessible vehicle IDs (owned + shared)
  const { data: vehicleIdsData } = await (supabase as any).rpc(
    "get_accessible_vehicle_ids",
    { user_uuid: userId },
  );

  const vehicleIds: string[] =
    vehicleIdsData?.map((row: any) => row.vehicle_id) || [];
  if (vehicleIds.length === 0) return [];

  const [mileagePromise, fuelPromise, servicePromise] = await Promise.all([
    supabase
      .from("mileage_logs")
      .select("*, vehicles(year, make, model), profiles(full_name)")
      .in("vehicle_id", vehicleIds)
      .order("date", { ascending: false })
      .limit(10),
    supabase
      .from("fuel_logs")
      .select("*, vehicles(year, make, model), profiles(full_name)")
      .in("vehicle_id", vehicleIds)
      .order("date", { ascending: false })
      .limit(10),
    supabase
      .from("service_logs")
      .select("*, vehicles(year, make, model), profiles(full_name)")
      .in("vehicle_id", vehicleIds)
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
 * - Automatic caching with optimized stale times
 * - Request deduplication (no duplicate API calls)
 * - Background refetching on mount/reconnect
 * - Instant navigation when data is cached
 * - Optimistic updates support
 * - Parallel query execution for faster initial load
 */
export const useDashboardDataQuery = () => {
  const { user } = useAuth();

  const queries = useQueries({
    queries: [
      {
        queryKey: ["dashboard", "stats", user?.id],
        queryFn: () => fetchStats(user!.id),
        enabled: !!user,
        staleTime: 2 * 60 * 1000, // 2min - stats change relatively slowly
        gcTime: 10 * 60 * 1000, // 10min cache
        refetchOnMount: false, // Don't refetch if data is fresh
        refetchOnWindowFocus: false, // Reduce unnecessary refetches
      },
      {
        queryKey: ["dashboard", "vehicles", user?.id],
        queryFn: () => fetchVehicles(user!.id),
        enabled: !!user,
        staleTime: 3 * 60 * 1000, // 3min - vehicles change less frequently
        gcTime: 15 * 60 * 1000, // 15min cache
        refetchOnMount: false,
        refetchOnWindowFocus: false,
      },
      {
        queryKey: ["dashboard", "activity", user?.id],
        queryFn: () => fetchRecentActivity(user!.id),
        enabled: !!user,
        staleTime: 1 * 60 * 1000, // 1min - activity updates more frequently
        gcTime: 5 * 60 * 1000, // 5min cache
        refetchOnMount: false,
        refetchOnWindowFocus: false,
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
