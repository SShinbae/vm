/**
 * Mileage Log Repository
 *
 * Data access layer for mileage log operations.
 */

import { supabase } from "../api/supabaseClient";
import {
  BaseRepository,
  QueryFilters,
  RepositoryError,
} from "./BaseRepository";
import type {
  MileageLog,
  MileageLogInsert,
  MileageLogUpdate,
  Result,
} from "@/src/types";

export class MileageLogRepository extends BaseRepository<
  MileageLog,
  MileageLogInsert,
  MileageLogUpdate
> {
  protected tableName = "mileage_logs";

  /**
   * Find mileage logs for a specific vehicle
   */
  async findByVehicleId(
    vehicleId: string,
    filters?: QueryFilters,
  ): Promise<Result<MileageLog[], RepositoryError>> {
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

    return { success: true, data: (data || []) as MileageLog[] };
  }

  /**
   * Find mileage logs for accessible vehicles
   */
  async findByAccessibleVehicles(
    vehicleIds: string[],
    filters?: QueryFilters,
  ): Promise<Result<MileageLog[], RepositoryError>> {
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

    return { success: true, data: (data || []) as MileageLog[] };
  }

  /**
   * Find mileage logs within a date range
   */
  async findByDateRange(
    vehicleId: string,
    startDate: string,
    endDate: string,
  ): Promise<Result<MileageLog[], RepositoryError>> {
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

    return { success: true, data: (data || []) as MileageLog[] };
  }

  /**
   * Get the latest mileage log for a vehicle
   */
  async findLatest(
    vehicleId: string,
  ): Promise<Result<MileageLog | null, RepositoryError>> {
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

    return { success: true, data: data as MileageLog | null };
  }

  /**
   * Get the highest odometer reading for a vehicle
   */
  async getMaxOdometer(
    vehicleId: string,
  ): Promise<Result<number, RepositoryError>> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("odometer_reading")
      .eq("vehicle_id", vehicleId)
      .order("odometer_reading", { ascending: false })
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

    return {
      success: true,
      data:
        (data as { odometer_reading: number } | null)?.odometer_reading || 0,
    };
  }

  /**
   * Calculate total distance traveled for a vehicle
   */
  async getTotalDistance(
    vehicleId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Result<number, RepositoryError>> {
    let query = supabase
      .from(this.tableName)
      .select("odometer_reading")
      .eq("vehicle_id", vehicleId)
      .order("date", { ascending: true });

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

    const readings = (data || []) as { odometer_reading: number }[];
    if (readings.length < 2) {
      return { success: true, data: 0 };
    }

    const firstReading = readings[0].odometer_reading;
    const lastReading = readings[readings.length - 1].odometer_reading;
    const distance = lastReading - firstReading;

    return { success: true, data: Math.max(0, distance) };
  }

  /**
   * Delete all mileage logs for a vehicle
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
export const mileageLogRepository = new MileageLogRepository();
