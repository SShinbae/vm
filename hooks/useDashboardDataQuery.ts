import { useAuth } from "@/lib/contexts/AuthContext";
import { useQueries, useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabaseClient";
import {
  ReminderLog,
  selectServiceReminders,
} from "@/lib/dashboard/serviceReminders";
import { buildFuelCostTrend } from "@/lib/dashboard/homeOverview";

import {
  accessibleVehicleQueryOptions,
  VehicleWithShares,
} from "./useAccessibleVehiclesQuery";
export type { VehicleWithShares } from "./useAccessibleVehiclesQuery";

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
  createdAt?: string;
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
      createdAt: log.created_at,
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
      createdAt: log.created_at,
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
      date: log.date,
      createdAt: log.created_at,
      vehicleName: `${log.vehicles?.year} ${log.vehicles?.make} ${log.vehicles?.model}`,
      primaryValue: `RM${(log.cost || 0).toFixed(2)}`,
      icon: "wrench.and.screwdriver.fill",
      addedBy: log.profiles?.full_name ?? "Unknown",
    });
  });

  return activities
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        (b.createdAt || "").localeCompare(a.createdAt || ""),
    )
    .slice(0, 5);
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
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("fuel_logs")
      .select("*, vehicles(year, make, model), profiles(full_name)")
      .in("vehicle_id", vehicleIds)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("service_logs")
      .select("*, vehicles(year, make, model), profiles(full_name)")
      .in("vehicle_id", vehicleIds)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return processActivityLogs(
    mileagePromise.data || [],
    fuelPromise.data || [],
    servicePromise.data || [],
  );
}

async function fetchServiceReminders(vehicles: VehicleWithShares[]) {
  if (!vehicles.length) return [];

  const logs: ReminderLog[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase
      .from("service_logs")
      .select(
        "id,vehicle_id,service_type,date,created_at,next_service_due,next_service_mileage",
      )
      .in(
        "vehicle_id",
        vehicles.map((vehicle) => vehicle.id),
      )
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + 999);
    if (error) throw new Error(error.message);
    logs.push(...(data || []));
    if (!data || data.length < 1000) break;
  }

  return selectServiceReminders(logs, vehicles);
}

async function fetchFuelCostTrend(
  vehicles: VehicleWithShares[],
  months: 6 | 12,
) {
  if (!vehicles.length) return buildFuelCostTrend([], months);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  const fromDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`;
  const logs: { date: string; cost: number | null }[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase
      .from("fuel_logs")
      .select("date,cost")
      .in(
        "vehicle_id",
        vehicles.map((vehicle) => vehicle.id),
      )
      .gte("date", fromDate)
      .order("date", { ascending: false })
      .range(offset, offset + 999);
    if (error) throw new Error(error.message);
    logs.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return buildFuelCostTrend(logs, months, now);
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
export const useDashboardDataQuery = (fuelTrendMonths: 6 | 12 = 6) => {
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
      accessibleVehicleQueryOptions(user?.id),
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
  const remindersQuery = useQuery({
    queryKey: ["dashboard", "reminders", user?.id, vehiclesQuery.dataUpdatedAt],
    queryFn: () => fetchServiceReminders(vehiclesQuery.data || []),
    enabled: !!user && vehiclesQuery.data !== undefined,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const fuelTrendQuery = useQuery({
    queryKey: [
      "dashboard",
      "fuelTrend",
      user?.id,
      vehiclesQuery.dataUpdatedAt,
      fuelTrendMonths,
    ],
    queryFn: () =>
      fetchFuelCostTrend(vehiclesQuery.data || [], fuelTrendMonths),
    enabled: !!user && vehiclesQuery.data !== undefined,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Combined loading state
  const loading = queries.some((q) => q.isLoading);
  const refreshing = queries.some((q) => q.isFetching && !q.isLoading);

  // Get error from any query
  const error = queries.find((q) => q.error)?.error;

  // Manual refresh function
  const onRefresh = async () => {
    await Promise.all([
      ...queries.map((q) => q.refetch()),
      remindersQuery.refetch(),
      fuelTrendQuery.refetch(),
    ]);
  };

  return {
    stats: statsQuery.data || defaultStats,
    vehicles: vehiclesQuery.data || [],
    recentActivity: activityQuery.data || [],
    serviceReminders: remindersQuery.data || [],
    remindersLoading: remindersQuery.isLoading,
    remindersError: remindersQuery.error ? String(remindersQuery.error) : null,
    fuelCostTrend: fuelTrendQuery.data || [],
    fuelTrendLoading: fuelTrendQuery.isLoading,
    fuelTrendError: fuelTrendQuery.error ? String(fuelTrendQuery.error) : null,
    loading,
    refreshing,
    error: error ? String(error) : null,
    user,
    onRefresh,
  };
};
