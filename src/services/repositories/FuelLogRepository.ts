/**
 * Fuel Log Repository
 *
 * Data access layer for fuel log operations.
 */

import { supabase } from "../api/supabaseClient";
import {
  BaseRepository,
  QueryFilters,
  RepositoryError,
} from "./BaseRepository";
import type {
  FuelLog,
  FuelLogInsert,
  FuelLogUpdate,
  Result,
} from "@/src/types";

export class FuelLogRepository extends BaseRepository<
  FuelLog,
  FuelLogInsert,
  FuelLogUpdate
> {
  protected tableName = "fuel_logs";

  /**
   * Find fuel logs for a specific vehicle
   */
  async findByVehicleId(
    vehicleId: string,
    filters?: QueryFilters,
  ): Promise<Result<FuelLog[], RepositoryError>> {
    let query = supabase
      .from(this.tableName)
      .select("*")
      .eq("vehicle_id", vehicleId);

    if (filters) {
      query = this.applyFilters(query, filters);
    } else {
      // Default ordering by date descending
      query = query.order("date", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
    }

    return { success: true, data: (data || []) as FuelLog[] };
  }

  /**
   * Find fuel logs for a user's accessible vehicles
   */
  async findByAccessibleVehicles(
    vehicleIds: string[],
    filters?: QueryFilters,
  ): Promise<Result<FuelLog[], RepositoryError>> {
    if (vehicleIds.length === 0) {
      return { success: true, data: [] };
    }

    let query = supabase
      .from(this.tableName)
      .select("*")
      .in("vehicle_id", vehicleIds);

    if (filters) {
      query = this.applyFilters(query, filters);
    } else {
      query = query.order("date", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
    }

    return { success: true, data: (data || []) as FuelLog[] };
  }

  /**
   * Find fuel logs within a date range
   */
  async findByDateRange(
    vehicleId: string,
    startDate: string,
    endDate: string,
  ): Promise<Result<FuelLog[], RepositoryError>> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("vehicle_id", vehicleId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (error) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
    }

    return { success: true, data: (data || []) as FuelLog[] };
  }

  /**
   * Get the latest fuel log for a vehicle
   */
  async findLatest(
    vehicleId: string,
  ): Promise<Result<FuelLog | null, RepositoryError>> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
    }

    return { success: true, data: data as FuelLog | null };
  }

  /**
   * Get fuel statistics for a vehicle
   */
  async getStats(
    vehicleId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<
    Result<
      {
        totalLiters: number;
        totalCost: number;
        avgCostPerLiter: number;
        fuelUps: number;
      },
      RepositoryError
    >
  > {
    let query = supabase
      .from(this.tableName)
      .select("liters_filled, cost")
      .eq("vehicle_id", vehicleId);

    if (startDate) {
      query = query.gte("date", startDate);
    }
    if (endDate) {
      query = query.lte("date", endDate);
    }

    const { data, error } = await query;

    if (error) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
    }

    const logs = (data || []) as {
      liters_filled: number;
      cost: number | null;
    }[];
    const totalLiters = logs.reduce(
      (sum, log) => sum + (log.liters_filled || 0),
      0,
    );
    const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
    const avgCostPerLiter = totalLiters > 0 ? totalCost / totalLiters : 0;

    return {
      success: true,
      data: {
        totalLiters,
        totalCost,
        avgCostPerLiter,
        fuelUps: logs.length,
      },
    };
  }

  /**
   * Delete all fuel logs for a vehicle
   */
  async deleteByVehicleId(
    vehicleId: string,
  ): Promise<Result<void, RepositoryError>> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq("vehicle_id", vehicleId);

    if (error) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
    }

    return { success: true, data: undefined };
  }
}

// Export singleton instance
export const fuelLogRepository = new FuelLogRepository();
