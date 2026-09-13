import { logger } from "@/lib/utils/logger";
import { supabase } from "../../services/supabaseClient";
import {
  ApiResponse,
  FuelLog,
  FuelLogInsert,
  FuelLogUpdate,
} from "../../types";
import { canUserAccessVehicle } from "../utils/serviceUtils";

export class FuelLogService {
  /**
   * Creates a mileage log from fuel log data (fire-and-forget)
   */
  private static async createMileageLogFromFuelLog(
    vehicleId: string,
    odometerReading: number,
    date: string,
    userId: string,
  ): Promise<void> {
    try {
      // Check for existing mileage log on same date
      const { data: existing } = await supabase
        .from("mileage_logs")
        .select("id")
        .eq("vehicle_id", vehicleId)
        .eq("date", date);

      if (existing && existing.length > 0) {
        logger.log("Mileage log exists for this date, skipping auto-creation");
        return;
      }

      // Create mileage log
      await supabase.from("mileage_logs").insert({
        vehicle_id: vehicleId,
        date: date,
        odometer_reading: odometerReading,
        notes: "Auto-created from fuel log",
        user_id: userId,
      } as any);

      logger.log("Mileage log auto-created from fuel log");
    } catch (error) {
      logger.warn("Failed to auto-create mileage log:", error);
      // Don't throw - this is fire-and-forget
    }
  }

  static async getFuelLogs(
    vehicleId?: string,
    options?: { limit?: number; offset?: number },
  ): Promise<ApiResponse<FuelLog[]>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      // OPTIMIZATION: Add pagination support
      const limit = options?.limit || 20;
      const offset = options?.offset || 0;

      // Build base query for owned vehicles
      let ownedQuery = supabase
        .from("fuel_logs")
        .select(
          `
          *,
          vehicles!inner(make, model, year, license_plate, user_id, main_image_url)
        `,
        )
        .eq("vehicles.user_id", user.id)
        .order("date", { ascending: false })
        .range(offset, offset + limit - 1);

      if (vehicleId) {
        ownedQuery = ownedQuery.eq("vehicle_id", vehicleId);
      }

      // First, get the shared vehicle IDs that the user has access to
      let sharedVehicleIds: string[] = [];
      if (!vehicleId) {
        // Get user's group memberships
        const { data: userGroups, error: groupError } = await supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", user.id);

        if (!groupError && userGroups && userGroups.length > 0) {
          const groupIds = userGroups.map(
            (g: { group_id: string }) => g.group_id,
          );

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
      }

      // Get logs for both owned vehicles and shared vehicles
      const [ownedLogsResult, sharedLogsResult] = await Promise.all([
        // Owned vehicle logs
        ownedQuery,

        // Shared vehicle logs (only if we have shared vehicle IDs)
        sharedVehicleIds.length > 0
          ? supabase
              .from("fuel_logs")
              .select(
                `
            *,
            vehicles!inner(make, model, year, license_plate, user_id, main_image_url)
          `,
              )
              .in("vehicle_id", sharedVehicleIds)
              .order("date", { ascending: false })
              .range(offset, offset + limit - 1)
          : Promise.resolve({ data: [], error: null }),
      ]);

      // Handle errors
      if (ownedLogsResult.error) {
        logger.error("Error fetching owned fuel logs:", ownedLogsResult.error);
        return {
          data: null,
          error: ownedLogsResult.error.message,
          loading: false,
        };
      }

      if (sharedLogsResult.error) {
        logger.warn("Error fetching shared fuel logs:", sharedLogsResult.error);
        // Don't fail completely, just use owned logs
      }

      // Combine and sort all logs
      const ownedLogs = ownedLogsResult.data || [];
      const sharedLogs = (sharedLogsResult.data || []).map((log: any) => ({
        ...log,
        is_shared_vehicle: true, // Mark as shared for UI indicators
      }));

      const allLogs = [...ownedLogs, ...sharedLogs];

      // Remove duplicates (in case user owns and has access to same vehicle through sharing)
      const uniqueLogs = allLogs.filter(
        (log, index, self) => index === self.findIndex((l) => l.id === log.id),
      );

      // Sort by date descending
      uniqueLogs.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      return { data: uniqueLogs, error: null, loading: false };
    } catch (error) {
      logger.error("Unexpected error fetching fuel logs:", error);
      return { data: null, error: "Failed to fetch fuel logs", loading: false };
    }
  }

  static async getFuelLogById(id: string): Promise<ApiResponse<FuelLog>> {
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

      // Fire-and-forget mileage log creation
      if (log.odometer_reading && log.odometer_reading > 0) {
        this.createMileageLogFromFuelLog(
          log.vehicle_id,
          log.odometer_reading,
          log.date,
          user.id,
        ).catch((err) => logger.warn("Mileage auto-log failed:", err));
      }

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
