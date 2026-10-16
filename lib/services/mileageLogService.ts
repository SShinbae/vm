import { getLogHistory } from "./logHistory";
import { logger } from "@/lib/utils/logger";
import { supabase } from "../../services/supabaseClient";
import {
  ApiResponse,
  LogWithVehicle,
  MileageLog,
  MileageLogInsert,
  MileageLogUpdate,
} from "../../types";
import { canUserAccessVehicle } from "../utils/serviceUtils";

/**
 * Auto mileage logs mirror that day's fuel logs (database trigger) and are
 * read-only. The error is user-facing text, since callers show it as-is.
 */
export const AUTO_MILEAGE_LOG_READ_ONLY =
  "This mileage log was created from fuel logs. Edit or delete the fuel log instead.";

export const isAutoMileageLog = (logType: string | null, log: object | null) =>
  logType === "mileage" &&
  !!log &&
  "source" in log &&
  log.source === "fuel_log";

export class MileageLogService {
  static async getMileageLogById(
    id: string,
  ): Promise<ApiResponse<LogWithVehicle<MileageLog>>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      const { data, error } = await supabase
        .from("mileage_logs")
        .select(
          `
          *,
          vehicles!inner(make, model, year, license_plate, user_id, main_image_url)
        `,
        )
        .eq("id", id)
        .single();

      if (error) {
        logger.error("Error fetching mileage log:", error);
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
              "Access denied - you do not have permission to view this mileage log",
            loading: false,
          };
        }
      }

      return { data, error: null, loading: false };
    } catch (error) {
      logger.error("Unexpected error fetching mileage log:", error);
      return {
        data: null,
        error: "Failed to fetch mileage log",
        loading: false,
      };
    }
  }

  static async getMileageLogs(
    vehicleId?: string,
    options?: { limit?: number; offset?: number; ascending?: boolean },
  ): Promise<ApiResponse<MileageLog[]>> {
    return getLogHistory<MileageLog>("mileage_logs", vehicleId, options);
  }

  static async createMileageLog(
    log: Omit<MileageLogInsert, "user_id">,
  ): Promise<ApiResponse<MileageLog>> {
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

      // Check for duplicate date entries for the same vehicle
      const { data: existing } = await supabase
        .from("mileage_logs")
        .select("id")
        .eq("vehicle_id", log.vehicle_id)
        .eq("date", log.date);

      if (existing && existing.length > 0) {
        return {
          data: null,
          error: "A mileage entry already exists for this date",
          loading: false,
        };
      }

      const { data, error } = await supabase
        .from("mileage_logs")
        // @ts-ignore - Supabase type inference issue with insert
        .insert({
          id: log.id,
          vehicle_id: log.vehicle_id,
          date: log.date,
          odometer_reading: log.odometer_reading,
          notes: log.notes,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        logger.error("Error creating mileage log:", error);
        return { data: null, error: error.message, loading: false };
      }

      return { data, error: null, loading: false };
    } catch (error) {
      logger.error("Unexpected error creating mileage log:", error);
      return {
        data: null,
        error: "Failed to create mileage log",
        loading: false,
      };
    }
  }

  static async updateMileageLog(
    id: string,
    updates: MileageLogUpdate,
  ): Promise<ApiResponse<MileageLog>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        logger.error("User authentication failed:", userError);
        return { data: null, error: "User not authenticated", loading: false };
      }

      logger.log("Updating mileage log:", id, "with updates:", updates);

      // First, get the log to check vehicle access and ensure it exists
      const { data: existingLog, error: fetchError } = await supabase
        .from("mileage_logs")
        .select("vehicle_id, user_id, source")
        .eq("id", id)
        .single<{ vehicle_id: string; user_id: string; source: string }>();

      if (fetchError) {
        logger.error("Error fetching existing mileage log:", fetchError);
        if (fetchError.code === "PGRST116") {
          return { data: null, error: "Mileage log not found", loading: false };
        }
        return {
          data: null,
          error: "Failed to verify mileage log exists",
          loading: false,
        };
      }

      if (!existingLog) {
        logger.error("No mileage log found with ID:", id);
        return { data: null, error: "Mileage log not found", loading: false };
      }

      if (existingLog.source === "fuel_log") {
        return {
          data: null,
          error: AUTO_MILEAGE_LOG_READ_ONLY,
          loading: false,
        };
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
            "Access denied - you do not have permission to edit this mileage log",
          loading: false,
        };
      }

      // Perform the update and return the results
      const { data: updateResult, error: updateError } = await supabase
        .from("mileage_logs")
        // @ts-ignore - Supabase type inference issue with update
        .update({
          odometer_reading: updates.odometer_reading,
          date: updates.date,
          notes: updates.notes,
        })
        .eq("id", id)
        .select();

      if (updateError) {
        logger.error("Error updating mileage log:", updateError);
        return {
          data: null,
          error: `Failed to update mileage log: ${updateError.message}`,
          loading: false,
        };
      }

      // Check if any rows were updated
      if (!updateResult || updateResult.length === 0) {
        logger.error("No rows were updated for mileage log ID:", id);
        return {
          data: null,
          error: "Mileage log could not be updated - it may have been deleted",
          loading: false,
        };
      }

      if (updateResult.length > 1) {
        logger.warn(
          "Multiple rows updated for mileage log ID:",
          id,
          "Updated count:",
          updateResult.length,
        );
      }

      const updatedLog = updateResult[0] as MileageLog;
      logger.log("Successfully updated mileage log:", updatedLog);

      return { data: updatedLog, error: null, loading: false };
    } catch (error) {
      logger.error("Unexpected error updating mileage log:", error);
      return {
        data: null,
        error: "An unexpected error occurred while updating the mileage log",
        loading: false,
      };
    }
  }

  static async deleteMileageLog(id: string): Promise<ApiResponse<boolean>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        logger.error("User authentication failed:", userError);
        return { data: null, error: "User not authenticated", loading: false };
      }

      logger.log("Deleting mileage log:", id);

      // First, get the log to check vehicle access and ensure it exists
      const { data: existingLog, error: fetchError } = await supabase
        .from("mileage_logs")
        .select("vehicle_id, source")
        .eq("id", id)
        .single<{ vehicle_id: string; source: string }>();

      if (fetchError) {
        logger.error(
          "Error fetching existing mileage log for deletion:",
          fetchError,
        );
        if (fetchError.code === "PGRST116") {
          return { data: null, error: "Mileage log not found", loading: false };
        }
        return {
          data: null,
          error: "Failed to verify mileage log exists",
          loading: false,
        };
      }

      if (!existingLog) {
        logger.error("No mileage log found with ID for deletion:", id);
        return { data: null, error: "Mileage log not found", loading: false };
      }

      if (existingLog.source === "fuel_log") {
        return {
          data: null,
          error: AUTO_MILEAGE_LOG_READ_ONLY,
          loading: false,
        };
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
        .from("mileage_logs")
        .delete()
        .eq("id", id)
        .select();

      if (deleteError) {
        logger.error("Error deleting mileage log:", deleteError);
        return {
          data: null,
          error: `Failed to delete mileage log: ${deleteError.message}`,
          loading: false,
        };
      }

      // Check if any rows were actually deleted
      if (!deleteResult || deleteResult.length === 0) {
        logger.error("No rows were deleted for mileage log ID:", id);
        return {
          data: null,
          error:
            "Mileage log could not be deleted - it may have already been removed",
          loading: false,
        };
      }

      logger.log(
        "Successfully deleted mileage log:",
        id,
        "Deleted count:",
        deleteResult.length,
      );

      return { data: true, error: null, loading: false };
    } catch (error) {
      logger.error("Unexpected error deleting mileage log:", error);
      return {
        data: null,
        error: "An unexpected error occurred while deleting the mileage log",
        loading: false,
      };
    }
  }
}
