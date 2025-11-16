import { useAuth } from "@/lib/contexts/AuthContext";
import { supabase } from "@/services/supabaseClient";
import { VehicleWithDetails } from "@/types/database-v2";
import { useCallback, useEffect, useState } from "react";

export interface DashboardStats {
  totalVehicles: number;
  avgMileage: number;
  monthlyFuelCost: number;
  upcomingServices: number;
}

/**
 * Custom hook for calculating vehicle statistics
 * Handles all stats calculations including fuel costs and service tracking
 */
export function useVehicleStats(vehicles: VehicleWithDetails[]) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    avgMileage: 0,
    monthlyFuelCost: 0,
    upcomingServices: 0,
  });

  /**
   * Fetch monthly fuel cost and upcoming services from Supabase
   * Now calculates based on ALL vehicles (owned + shared)
   */
  const fetchAdditionalStats = useCallback(
    async (vehicleIds: string[]) => {
      if (!user || vehicleIds.length === 0) {
        return { monthlyFuelCost: 0, upcomingServices: 0 };
      }

      try {
        // Get monthly fuel cost for ALL vehicles (owned and shared)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: fuelData } = await supabase
          .from("fuel_logs")
          .select("cost")
          .in("vehicle_id", vehicleIds)
          .gte("date", startOfMonth.toISOString());

        const monthlyFuelCost =
          (fuelData as { cost: number | null }[] | null)?.reduce(
            (sum, f) => sum + (f.cost || 0),
            0,
          ) || 0;

        console.log(
          `💰 Monthly fuel cost for ${vehicleIds.length} vehicles: RM${monthlyFuelCost.toFixed(2)}`,
        );

        // Get upcoming services (next 30 days) for ALL vehicles
        const now = new Date();
        const thirtyDaysLater = new Date(
          now.getTime() + 30 * 24 * 60 * 60 * 1000,
        );

        const { data: servicesData } = await supabase
          .from("service_logs")
          .select("next_service_due")
          .in("vehicle_id", vehicleIds)
          .gte("next_service_due", now.toISOString())
          .lte("next_service_due", thirtyDaysLater.toISOString());

        const upcomingServices = servicesData?.length || 0;

        return { monthlyFuelCost, upcomingServices };
      } catch (err) {
        console.error("Error fetching stats:", err);
        return { monthlyFuelCost: 0, upcomingServices: 0 };
      }
    },
    [user],
  );

  /**
   * Calculate stats whenever vehicles change
   */
  useEffect(() => {
    const calculateStats = async () => {
      // Calculate basic vehicle stats
      const totalVehicles = vehicles.length;
      const totalMileage = vehicles.reduce(
        (sum, v) => sum + (v.current_mileage || 0),
        0,
      );
      const avgMileage = totalVehicles > 0 ? totalMileage / totalVehicles : 0;

      // Extract all vehicle IDs
      const vehicleIds = vehicles.map((v) => v.id);

      // Fetch additional stats from database for ALL vehicles
      const additionalStats = await fetchAdditionalStats(vehicleIds);

      setStats({
        totalVehicles,
        avgMileage,
        monthlyFuelCost: additionalStats.monthlyFuelCost,
        upcomingServices: additionalStats.upcomingServices,
      });
    };

    calculateStats();
  }, [vehicles, fetchAdditionalStats]);

  return stats;
}
