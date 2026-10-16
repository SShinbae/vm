import { getLogHistory } from "./logHistory";
import { logger } from "@/lib/utils/logger";
import { supabase } from "../../services/supabaseClient";
import {
  ApiResponse,
  LogWithVehicle,
  FuelLog,
  FuelLogInsert,
  FuelLogUpdate,
} from "../../types";
import { canUserAccessVehicle } from "../utils/serviceUtils";

export class FuelLogService {
  static async getFuelLogs(
    vehicleId?: string,
    options?: { limit?: number; offset?: number; ascending?: boolean },
  ): Promise<ApiResponse<FuelLog[]>> {
    return getLogHistory<FuelLog>("fuel_logs", vehicleId, options);
  }

  static async getFuelLogById(
    id: string,
  ): Promise<ApiResponse<LogWithVehicle<FuelLog>>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      const { data, error } = await supabase
        .from("fuel_logs")
        .select(
          `
          *,
          vehicles!inner(make, model, year, license_plate, user_id, main_image_url)
        `,
        )
        .eq("id", id)
        .single();

      if (error) {
        logger.error("Error fetching fuel log:", error);
        return { data: null, error: error.message, loading: false };
      }

      if (data) {
        const hasAccess = await canUserAccessVehicle(
          (data as any).vehicle_id,
          user.id,
        );
        if (!hasAccess) {
          return {
            data: null,
            error:
              "Access denied - you do not have permission to view this fuel log",
            loading: false,
          };
        }
      }

      return { data, error: null, loading: false };
    } catch (error) {
      logger.error("Unexpected error fetching fuel log:", error);
      return { data: null, error: "Failed to fetch fuel log", loading: false };
    }
  }

  static async createFuelLog(
    log: Omit<FuelLogInsert, "user_id">,
  ): Promise<ApiResponse<FuelLog>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      // Validate that user can access the vehicle (owns it or has shared access)
      const hasAccess = await canUserAccessVehicle(log.vehicle_id, user.id);

      if (!hasAccess) {
        return {
          data: null,
          error: "Vehicle not found or access denied",
          loading: false,
        };
      }

      const { data, error } = await supabase
        .from("fuel_logs")
        // @ts-ignore - Supabase type inference issue with insert
        .insert({
          id: log.id,
          vehicle_id: log.vehicle_id,
          date: log.date,
          odometer_reading: log.odometer_reading,
          liters_filled: log.liters_filled,
          cost: log.cost,
          location: log.location,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        logger.error("Error creating fuel log:", error);
        return { data: null, error: error.message, loading: false };
      }

      // The day's auto mileage log is kept in sync by a database trigger
      // (sync_auto_mileage_from_fuel_log), not here.
      return { data, error: null, loading: false };
    } catch (error) {
      logger.error("Unexpected error creating fuel log:", error);
      return { data: null, error: "Failed to create fuel log", loading: false };
    }
  }

  static async updateFuelLog(
    id: string,
    updates: FuelLogUpdate,
  ): Promise<ApiResponse<FuelLog>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        logger.error("User authentication failed:", userError);
        return { data: null, error: "User not authenticated", loading: false };
      }

      logger.log("Updating fuel log:", id, "with updates:", updates);

      // First, get the log to check vehicle access and ensure it exists
      const { data: existingLog, error: fetchError } = await supabase
        .from("fuel_logs")
        .select("vehicle_id, user_id")
        .eq("id", id)
        .single<{ vehicle_id: string; user_id: string }>();

      if (fetchError) {
        logger.error("Error fetching existing fuel log:", fetchError);
        if (fetchError.code === "PGRST116") {
          return { data: null, error: "Fuel log not found", loading: false };
        }
        return {
          data: null,
          error: "Failed to verify fuel log exists",
          loading: false,
        };
      }

      if (!existingLog) {
        logger.error("No fuel log found with ID:", id);
        return { data: null, error: "Fuel log not found", loading: false };
      }

      // Validate that user can access the vehicle (owns it or has shared access)
      const hasAccess = await canUserAccessVehicle(
        existingLog.vehicle_id,
        user.id,
      );

      if (!hasAccess) {
        logger.error(
          "User does not have access to vehicle:",
          existingLog.vehicle_id,
        );
        return {
          data: null,
          error:
            "Access denied - you do not have permission to edit this fuel log",
          loading: false,
        };
      }

      // Perform the update and return the results
      const { data: updateResult, error: updateError } = await supabase
        .from("fuel_logs")
        // @ts-ignore - Supabase type inference issue with update
        .update({
          liters_filled: updates.liters_filled,
          cost: updates.cost,
          date: updates.date,
          odometer_reading: updates.odometer_reading,
          location: updates.location,
        })
        .eq("id", id)
        .select();

      if (updateError) {
        logger.error("Error updating fuel log:", updateError);
        return {
          data: null,
          error: `Failed to update fuel log: ${updateError.message}`,
          loading: false,
        };
      }

      // Check if any rows were updated
      if (!updateResult || updateResult.length === 0) {
        logger.error("No rows were updated for fuel log ID:", id);
        return {
          data: null,
          error: "Fuel log could not be updated - it may have been deleted",
          loading: false,
        };
      }

      if (updateResult.length > 1) {
        logger.warn(
          "Multiple rows updated for fuel log ID:",
          id,
          "Updated count:",
          updateResult.length,
        );
      }

      const updatedLog = updateResult[0] as FuelLog;
      logger.log("Successfully updated fuel log:", updatedLog);

      return { data: updatedLog, error: null, loading: false };
    } catch (error) {
      logger.error("Unexpected error updating fuel log:", error);
      return {
        data: null,
        error: "An unexpected error occurred while updating the fuel log",
        loading: false,
      };
    }
  }

  static async deleteFuelLog(id: string): Promise<ApiResponse<boolean>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        logger.error("User authentication failed:", userError);
        return { data: null, error: "User not authenticated", loading: false };
      }

      logger.log("Deleting fuel log:", id);

      // First, get the log to check vehicle access and ensure it exists
      const { data: existingLog, error: fetchError } = await supabase
        .from("fuel_logs")
        .select("vehicle_id")
        .eq("id", id)
        .single<{ vehicle_id: string }>();

      if (fetchError) {
        logger.error(
          "Error fetching existing fuel log for deletion:",
          fetchError,
        );
        if (fetchError.code === "PGRST116") {
          return { data: null, error: "Fuel log not found", loading: false };
        }
        return {
          data: null,
          error: "Failed to verify fuel log exists",
          loading: false,
        };
      }

      if (!existingLog) {
        logger.error("No fuel log found with ID for deletion:", id);
        return { data: null, error: "Fuel log not found", loading: false };
      }

      // Validate that user can access the vehicle (owns it or has shared access)
      const hasAccess = await canUserAccessVehicle(
        existingLog.vehicle_id,
        user.id,
      );

      if (!hasAccess) {
        logger.error(
          "User does not have access to vehicle for deletion:",
          existingLog.vehicle_id,
        );

        // Check if the log belongs to a shared vehicle that user can only view
        const { data: vehicle, error: vehicleError } = await supabase
          .from("vehicles")
          .select("user_id, make, model, year")
          .eq("id", existingLog.vehicle_id)
          .single<{
            user_id: string;
            make: string;
            model: string;
            year: number;
          }>();

        if (!vehicleError && vehicle && vehicle.user_id !== user.id) {
          return {
            data: null,
            error: "PERMISSION_DENIED_SHARED_VEHICLE",
            loading: false,
          };
        }

        return {
          data: null,
          error: "PERMISSION_DENIED_ACCESS",
          loading: false,
        };
      }

      // Perform the deletion
      const { data: deleteResult, error: deleteError } = await supabase
        .from("fuel_logs")
        .delete()
        .eq("id", id)
        .select();

      if (deleteError) {
        logger.error("Error deleting fuel log:", deleteError);
        return {
          data: null,
          error: `Failed to delete fuel log: ${deleteError.message}`,
          loading: false,
        };
      }

      // Check if any rows were actually deleted
      if (!deleteResult || deleteResult.length === 0) {
        logger.error("No rows were deleted for fuel log ID:", id);
        return {
          data: null,
          error:
            "Fuel log could not be deleted - it may have already been removed",
          loading: false,
        };
      }

      logger.log(
        "Successfully deleted fuel log:",
        id,
        "Deleted count:",
        deleteResult.length,
      );

      return { data: true, error: null, loading: false };
    } catch (error) {
      logger.error("Unexpected error deleting fuel log:", error);
      return {
        data: null,
        error: "An unexpected error occurred while deleting the fuel log",
        loading: false,
      };
    }
  }
}
