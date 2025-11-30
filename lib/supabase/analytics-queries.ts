import { supabase } from "../../services/supabaseClient";
import { FuelLog, MileageLog, ServiceLog, Vehicle } from "../../types";
import {
  AnalyticsData,
  AnalyticsFilters,
  VehicleWithLogs,
} from "../../types/analytics";

/**
 * Fetch all analytics data based on filters
 */
export async function fetchAnalyticsData(
  userId: string,
  filters: AnalyticsFilters,
): Promise<AnalyticsData> {
  try {
    const { startDate, endDate } = filters.period;
    const { vehicleIds, groupId } = filters;

    // Format dates as YYYY-MM-DD to match the database format
    const formatDateForDB = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const startDateStr = formatDateForDB(startDate);
    const endDateStr = formatDateForDB(endDate);

    // Determine which vehicles to query
    let targetVehicleIds: string[] = [];

    if (groupId) {
      // Fetch vehicles shared with the group
      const { data: groupVehicles, error: groupError } = await supabase
        .from("vehicle_group_shares")
        .select("vehicle_id")
        .eq("group_id", groupId);

      if (groupError) throw groupError;
      targetVehicleIds = groupVehicles?.map((v: any) => v.vehicle_id) || [];
    } else if (vehicleIds.length > 0) {
      // Use specified vehicle IDs
      targetVehicleIds = vehicleIds;
    } else {
      // Fetch all user's vehicles
      const { data: userVehicles, error: vehicleError } = await supabase
        .from("vehicles")
        .select("id")
        .eq("user_id", userId);

      if (vehicleError) throw vehicleError;
      targetVehicleIds = userVehicles?.map((v: any) => v.id) || [];
    }

    if (targetVehicleIds.length === 0) {
      return {
        fuelLogs: [],
        serviceLogs: [],
        mileageLogs: [],
        vehicles: [],
      };
    }

    // Fetch all data in parallel
    const [
      fuelLogsResult,
      serviceLogsResult,
      mileageLogsResult,
      vehiclesResult,
    ] = await Promise.all([
      supabase
        .from("fuel_logs")
        .select("*")
        .in("vehicle_id", targetVehicleIds)
        .gte("date", startDateStr)
        .lte("date", endDateStr)
        .order("date", { ascending: true }),

      supabase
        .from("service_logs")
        .select("*")
        .in("vehicle_id", targetVehicleIds)
        .gte("date", startDateStr)
        .lte("date", endDateStr)
        .order("date", { ascending: true }),

      supabase
        .from("mileage_logs")
        .select("*")
        .in("vehicle_id", targetVehicleIds)
        .gte("date", startDateStr)
        .lte("date", endDateStr)
        .order("date", { ascending: true }),

      supabase.from("vehicles").select("*").in("id", targetVehicleIds),
    ]);

    // Check for errors
    if (fuelLogsResult.error) throw fuelLogsResult.error;
    if (serviceLogsResult.error) throw serviceLogsResult.error;
    if (mileageLogsResult.error) throw mileageLogsResult.error;
    if (vehiclesResult.error) throw vehiclesResult.error;

    // Debug logging
    console.log("Analytics Query Debug:", {
      startDate: startDateStr,
      endDate: endDateStr,
      targetVehicleIds,
      fuelLogsCount: fuelLogsResult.data?.length || 0,
      serviceLogsCount: serviceLogsResult.data?.length || 0,
      mileageLogsCount: mileageLogsResult.data?.length || 0,
      vehiclesCount: vehiclesResult.data?.length || 0,
    });

    return {
      fuelLogs: (fuelLogsResult.data as FuelLog[]) || [],
      serviceLogs: (serviceLogsResult.data as ServiceLog[]) || [],
      mileageLogs: (mileageLogsResult.data as MileageLog[]) || [],
      vehicles: (vehiclesResult.data as Vehicle[]) || [],
    };
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    throw error;
  }
}

/**
 * Fetch a single vehicle with all its logs
 */
export async function fetchVehicleWithLogs(
  vehicleId: string,
  startDate: Date,
  endDate: Date,
): Promise<VehicleWithLogs | null> {
  try {
    // Format dates as YYYY-MM-DD to match the database format
    const formatDateForDB = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const startDateStr = formatDateForDB(startDate);
    const endDateStr = formatDateForDB(endDate);

    const [
      vehicleResult,
      fuelLogsResult,
      serviceLogsResult,
      mileageLogsResult,
    ] = (await Promise.all([
      supabase.from("vehicles").select("*").eq("id", vehicleId).single(),

      supabase
        .from("fuel_logs")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .gte("date", startDateStr)
        .lte("date", endDateStr)
        .order("date", { ascending: true }),

      supabase
        .from("service_logs")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .gte("date", startDateStr)
        .lte("date", endDateStr)
        .order("date", { ascending: true }),

      supabase
        .from("mileage_logs")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .gte("date", startDateStr)
        .lte("date", endDateStr)
        .order("date", { ascending: true }),
    ])) as any;

    if (vehicleResult.error) throw vehicleResult.error;
    if (!vehicleResult.data) return null;

    if (fuelLogsResult.error) throw fuelLogsResult.error;
    if (serviceLogsResult.error) throw serviceLogsResult.error;
    if (mileageLogsResult.error) throw mileageLogsResult.error;

    return {
      ...(vehicleResult.data as Vehicle),
      fuel_logs: (fuelLogsResult.data as FuelLog[]) || [],
      service_logs: (serviceLogsResult.data as ServiceLog[]) || [],
      mileage_logs: (mileageLogsResult.data as MileageLog[]) || [],
    };
  } catch (error) {
    console.error("Error fetching vehicle with logs:", error);
    throw error;
  }
}

/**
 * Fetch upcoming services (services with next_service_due populated)
 */
export async function fetchUpcomingServices(
  userId: string,
): Promise<ServiceLog[]> {
  try {
    // First get user's vehicle IDs
    const { data: vehicles, error: vehicleError } = await supabase
      .from("vehicles")
      .select("id")
      .eq("user_id", userId);

    if (vehicleError) throw vehicleError;
    if (!vehicles || vehicles.length === 0) return [];

    const vehicleIds = vehicles.map((v: any) => v.id);

    // Fetch services with next_service_due
    const { data, error } = await supabase
      .from("service_logs")
      .select("*")
      .in("vehicle_id", vehicleIds)
      .not("next_service_due", "is", null)
      .order("date", { ascending: false });

    if (error) throw error;

    return (data as ServiceLog[]) || [];
  } catch (error) {
    console.error("Error fetching upcoming services:", error);
    throw error;
  }
}

/**
 * Fetch multiple vehicles with their logs
 */
export async function fetchVehiclesWithLogs(
  vehicleIds: string[],
  startDate: Date,
  endDate: Date,
): Promise<VehicleWithLogs[]> {
  try {
    if (vehicleIds.length === 0) return [];

    const results = await Promise.all(
      vehicleIds.map((id) => fetchVehicleWithLogs(id, startDate, endDate)),
    );

    return results.filter((v): v is VehicleWithLogs => v !== null);
  } catch (error) {
    console.error("Error fetching vehicles with logs:", error);
    throw error;
  }
}

/**
 * Fetch all accessible vehicles for a user (owned + group-shared)
 */
export async function fetchAccessibleVehicles(
  userId: string,
): Promise<Vehicle[]> {
  try {
    // Fetch user's own vehicles
    const { data: ownVehicles, error: ownError } = await supabase
      .from("vehicles")
      .select("*")
      .eq("user_id", userId);

    if (ownError) throw ownError;

    // Fetch shared vehicles through groups
    let sharedVehicleIds: string[] = [];

    // Get user's group memberships
    const { data: userGroups, error: groupError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId);

    if (!groupError && userGroups && userGroups.length > 0) {
      const groupIds = userGroups.map((g: { group_id: string }) => g.group_id);

      // Get vehicles shared with these groups
      const { data: sharedVehicles, error: shareError } = await supabase
        .from("vehicle_group_shares")
        .select("vehicle_id")
        .in("group_id", groupIds);

      if (!shareError && sharedVehicles) {
        sharedVehicleIds = sharedVehicles.map(
          (sv: { vehicle_id: string }) => sv.vehicle_id,
        );
      }
    }

    // If we have shared vehicles, fetch them
    let groupVehicles: Vehicle[] = [];
    if (sharedVehicleIds.length > 0) {
      const { data: sharedVehiclesData, error: sharedError } = await supabase
        .from("vehicles")
        .select("*")
        .in("id", sharedVehicleIds);

      if (!sharedError && sharedVehiclesData) {
        groupVehicles = sharedVehiclesData as Vehicle[];
      }
    }

    // Combine owned and shared vehicles, removing duplicates
    const allVehicles = [
      ...((ownVehicles as Vehicle[]) || []),
      ...groupVehicles,
    ];
    const uniqueVehicles = Array.from(
      new Map(allVehicles.map((v) => [v.id, v])).values(),
    );

    return uniqueVehicles;
  } catch (error) {
    console.error("Error fetching accessible vehicles:", error);
    throw error;
  }
}

/**
 * Fetch logs for a specific date range (useful for export)
 */
export async function fetchLogsByDateRange(
  userId: string,
  vehicleId: string | null,
  startDate: Date,
  endDate: Date,
): Promise<{
  fuelLogs: FuelLog[];
  serviceLogs: ServiceLog[];
  mileageLogs: MileageLog[];
}> {
  try {
    // Format dates as YYYY-MM-DD to match the database format
    const formatDateForDB = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const startDateStr = formatDateForDB(startDate);
    const endDateStr = formatDateForDB(endDate);

    let fuelQuery = supabase
      .from("fuel_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDateStr)
      .lte("date", endDateStr);

    let serviceQuery = supabase
      .from("service_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDateStr)
      .lte("date", endDateStr);

    let mileageQuery = supabase
      .from("mileage_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDateStr)
      .lte("date", endDateStr);

    if (vehicleId) {
      fuelQuery = fuelQuery.eq("vehicle_id", vehicleId);
      serviceQuery = serviceQuery.eq("vehicle_id", vehicleId);
      mileageQuery = mileageQuery.eq("vehicle_id", vehicleId);
    }

    const [fuelResult, serviceResult, mileageResult] = await Promise.all([
      fuelQuery.order("date", { ascending: true }),
      serviceQuery.order("date", { ascending: true }),
      mileageQuery.order("date", { ascending: true }),
    ]);

    if (fuelResult.error) throw fuelResult.error;
    if (serviceResult.error) throw serviceResult.error;
    if (mileageResult.error) throw mileageResult.error;

    return {
      fuelLogs: (fuelResult.data as FuelLog[]) || [],
      serviceLogs: (serviceResult.data as ServiceLog[]) || [],
      mileageLogs: (mileageResult.data as MileageLog[]) || [],
    };
  } catch (error) {
    console.error("Error fetching logs by date range:", error);
    throw error;
  }
}
