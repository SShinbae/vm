/**
 * Vehicle Repository
 *
 * Data access layer for vehicle operations.
 */

import { supabase } from "../api/supabaseClient";
import {
  BaseRepository,
  QueryFilters,
  RepositoryError,
} from "./BaseRepository";
import type {
  Vehicle,
  VehicleInsert,
  VehicleUpdate,
  VehicleWithGroupInfo,
  VehicleWithLogs,
  Result,
} from "@/src/types";

export class VehicleRepository extends BaseRepository<
  Vehicle,
  VehicleInsert,
  VehicleUpdate
> {
  protected tableName = "vehicles";

  /**
   * Find vehicles accessible to a user (owned + shared via groups)
   */
  async findAccessibleVehicles(
    userId: string,
  ): Promise<Result<Vehicle[], RepositoryError>> {
    const { data, error } = await supabase.rpc("get_accessible_vehicles", {
      user_uuid: userId,
    } as never);

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

    return { success: true, data: (data || []) as Vehicle[] };
  }

  /**
   * Find vehicles with their logs
   */
  async findWithLogs(
    vehicleId: string,
  ): Promise<Result<VehicleWithLogs, RepositoryError>> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(
        `
        *,
        fuel_logs (*),
        service_logs (*),
        mileage_logs (*)
      `,
      )
      .eq("id", vehicleId)
      .single();

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

    return { success: true, data: data as VehicleWithLogs };
  }

  /**
   * Find vehicles with group sharing info
   */
  async findWithSharingInfo(
    userId: string,
    filters?: QueryFilters,
  ): Promise<Result<VehicleWithGroupInfo[], RepositoryError>> {
    let query = supabase
      .from(this.tableName)
      .select(
        `
        *,
        vehicle_group_shares (
          group_id,
          groups (id, name, description)
        )
      `,
      )
      .eq("user_id", userId);

    if (filters) {
      query = this.applyFilters(query, filters);
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

    // Transform the data to match VehicleWithGroupInfo interface
    const vehicles: VehicleWithGroupInfo[] = (data || []).map(
      (vehicle: any) => ({
        ...vehicle,
        shared_groups:
          vehicle.vehicle_group_shares?.map((share: any) => share.groups) || [],
        sharing_info: {
          is_shared: vehicle.vehicle_group_shares?.length > 0,
          shared_groups:
            vehicle.vehicle_group_shares?.map((share: any) => share.group_id) ||
            [],
          total_shares: vehicle.vehicle_group_shares?.length || 0,
        },
      }),
    );

    return { success: true, data: vehicles };
  }

  /**
   * Share a vehicle with groups
   */
  async shareWithGroups(
    vehicleId: string,
    groupIds: string[],
  ): Promise<Result<void, RepositoryError>> {
    const { error } = await supabase.rpc("share_vehicle_with_groups", {
      vehicle_uuid: vehicleId,
      group_uuids: groupIds,
    } as never);

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

  /**
   * Get groups a vehicle is shared with
   */
  async getSharedGroups(
    vehicleId: string,
  ): Promise<
    Result<{ group_id: string; shared_by: string }[], RepositoryError>
  > {
    const { data, error } = await supabase.rpc("get_vehicle_share_groups", {
      vehicle_uuid: vehicleId,
    } as never);

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

    return { success: true, data: data || [] };
  }

  /**
   * Update vehicle's current mileage
   */
  async updateMileage(
    vehicleId: string,
    mileage: number,
  ): Promise<Result<Vehicle, RepositoryError>> {
    return this.update(vehicleId, {
      current_mileage: mileage,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Search vehicles by make, model, or license plate
   */
  async search(
    userId: string,
    searchTerm: string,
    filters?: QueryFilters,
  ): Promise<Result<Vehicle[], RepositoryError>> {
    let query = supabase
      .from(this.tableName)
      .select("*")
      .eq("user_id", userId)
      .or(
        `make.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,license_plate.ilike.%${searchTerm}%`,
      );

    if (filters) {
      query = this.applyFilters(query, filters);
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

    return { success: true, data: (data || []) as Vehicle[] };
  }
}

// Export singleton instance
export const vehicleRepository = new VehicleRepository();
