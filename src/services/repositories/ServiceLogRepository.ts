/**
 * Service Log Repository
 *
 * Data access layer for service log operations.
 */

import { supabase } from "../api/supabaseClient";
import {
  BaseRepository,
  QueryFilters,
  RepositoryError,
} from "./BaseRepository";
import type {
  ServiceLog,
  ServiceLogInsert,
  ServiceLogUpdate,
  ServiceType,
  Result,
} from "@/src/types";

export class ServiceLogRepository extends BaseRepository<
  ServiceLog,
  ServiceLogInsert,
  ServiceLogUpdate
> {
  protected tableName = "service_logs";

  /**
   * Find service logs for a specific vehicle
   */
  async findByVehicleId(
    vehicleId: string,
    filters?: QueryFilters,
  ): Promise<Result<ServiceLog[], RepositoryError>> {
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

    return { success: true, data: (data || []) as ServiceLog[] };
  }

  /**
   * Find service logs by type
   */
  async findByType(
    vehicleId: string,
    serviceType: ServiceType,
    filters?: QueryFilters,
  ): Promise<Result<ServiceLog[], RepositoryError>> {
    let query = supabase
      .from(this.tableName)
      .select("*")
      .eq("vehicle_id", vehicleId)
      .eq("service_type", serviceType);

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

    return { success: true, data: (data || []) as ServiceLog[] };
  }

  /**
   * Find service logs for accessible vehicles
   */
  async findByAccessibleVehicles(
    vehicleIds: string[],
    filters?: QueryFilters,
  ): Promise<Result<ServiceLog[], RepositoryError>> {
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

    return { success: true, data: (data || []) as ServiceLog[] };
  }

  /**
   * Find service logs within a date range
   */
  async findByDateRange(
    vehicleId: string,
    startDate: string,
    endDate: string,
  ): Promise<Result<ServiceLog[], RepositoryError>> {
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

    return { success: true, data: (data || []) as ServiceLog[] };
  }

  /**
   * Get the latest service log for a vehicle
   */
  async findLatest(
    vehicleId: string,
  ): Promise<Result<ServiceLog | null, RepositoryError>> {
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

    return { success: true, data: data as ServiceLog | null };
  }

  /**
   * Find upcoming services based on next_service_due field
   */
  async findUpcoming(
    vehicleIds: string[],
    limit = 10,
  ): Promise<Result<ServiceLog[], RepositoryError>> {
    if (vehicleIds.length === 0) {
      return { success: true, data: [] };
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .in("vehicle_id", vehicleIds)
      .not("next_service_due", "is", null)
      .gte("next_service_due", new Date().toISOString())
      .order("next_service_due", { ascending: true })
      .limit(limit);

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

    return { success: true, data: (data || []) as ServiceLog[] };
  }

  /**
   * Get service statistics for a vehicle
   */
  async getStats(
    vehicleId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<
    Result<
      {
        totalServices: number;
        totalCost: number;
        servicesByType: Record<string, number>;
        costByType: Record<string, number>;
      },
      RepositoryError
    >
  > {
    let query = supabase
      .from(this.tableName)
      .select("service_type, cost")
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
      service_type: string;
      cost: number | null;
    }[];
    const servicesByType: Record<string, number> = {};
    const costByType: Record<string, number> = {};
    let totalCost = 0;

    for (const log of logs) {
      const type = log.service_type;
      servicesByType[type] = (servicesByType[type] || 0) + 1;
      costByType[type] = (costByType[type] || 0) + (log.cost || 0);
      totalCost += log.cost || 0;
    }

    return {
      success: true,
      data: {
        totalServices: logs.length,
        totalCost,
        servicesByType,
        costByType,
      },
    };
  }

  /**
   * Delete all service logs for a vehicle
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
export const serviceLogRepository = new ServiceLogRepository();
