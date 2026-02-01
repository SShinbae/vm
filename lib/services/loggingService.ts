import { supabase } from "../../services/supabaseClient";
import {
  ApiResponse,
  FuelLog,
  FuelLogInsert,
  FuelLogUpdate,
  MileageLog,
  MileageLogInsert,
  MileageLogUpdate,
  ServiceLog,
  ServiceLogInsert,
  ServiceLogUpdate,
} from "../../types";
import { canUserAccessVehicle } from "../utils/serviceUtils";

export class MileageLogService {
  static async getMileageLogs(
    vehicleId?: string,
    options?: { limit?: number; offset?: number },
  ): Promise<ApiResponse<MileageLog[]>> {
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
        .from("mileage_logs")
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
              .from("mileage_logs")
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
        console.error(
          "Error fetching owned mileage logs:",
          ownedLogsResult.error,
        );
        return {
          data: null,
          error: ownedLogsResult.error.message,
          loading: false,
        };
      }

      if (sharedLogsResult.error) {
        console.warn(
          "Error fetching shared mileage logs:",
          sharedLogsResult.error,
        );
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
      console.error("Unexpected error fetching mileage logs:", error);
      return {
        data: null,
        error: "Failed to fetch mileage logs",
        loading: false,
      };
    }
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
        console.error("Error creating mileage log:", error);
        return { data: null, error: error.message, loading: false };
      }

      return { data, error: null, loading: false };
    } catch (error) {
      console.error("Unexpected error creating mileage log:", error);
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
        console.error("User authentication failed:", userError);
        return { data: null, error: "User not authenticated", loading: false };
      }

      console.log("Updating mileage log:", id, "with updates:", updates);

      // First, get the log to check vehicle access and ensure it exists
      const { data: existingLog, error: fetchError } = await supabase
        .from("mileage_logs")
        .select("vehicle_id, user_id")
        .eq("id", id)
        .single<{ vehicle_id: string; user_id: string }>();

      if (fetchError) {
        console.error("Error fetching existing mileage log:", fetchError);
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
        console.error("No mileage log found with ID:", id);
        return { data: null, error: "Mileage log not found", loading: false };
      }

      // Validate that user can access the vehicle (owns it or has shared access)
      const hasAccess = await canUserAccessVehicle(
        existingLog.vehicle_id,
        user.id,
      );

      if (!hasAccess) {
        console.error(
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
        console.error("Error updating mileage log:", updateError);
        return {
          data: null,
          error: `Failed to update mileage log: ${updateError.message}`,
          loading: false,
        };
      }

      // Check if any rows were updated
      if (!updateResult || updateResult.length === 0) {
        console.error("No rows were updated for mileage log ID:", id);
        return {
          data: null,
          error: "Mileage log could not be updated - it may have been deleted",
          loading: false,
        };
      }

      if (updateResult.length > 1) {
        console.warn(
          "Multiple rows updated for mileage log ID:",
          id,
          "Updated count:",
          updateResult.length,
        );
      }

      const updatedLog = updateResult[0] as MileageLog;
      console.log("Successfully updated mileage log:", updatedLog);

      return { data: updatedLog, error: null, loading: false };
    } catch (error) {
      console.error("Unexpected error updating mileage log:", error);
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
        console.error("User authentication failed:", userError);
        return { data: null, error: "User not authenticated", loading: false };
      }

      console.log("Deleting mileage log:", id);

      // First, get the log to check vehicle access and ensure it exists
      const { data: existingLog, error: fetchError } = await supabase
        .from("mileage_logs")
        .select("vehicle_id")
        .eq("id", id)
        .single<{ vehicle_id: string }>();

      if (fetchError) {
        console.error(
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
        console.error("No mileage log found with ID for deletion:", id);
        return { data: null, error: "Mileage log not found", loading: false };
      }

      // Validate that user can access the vehicle (owns it or has shared access)
      const hasAccess = await canUserAccessVehicle(
        existingLog.vehicle_id,
        user.id,
      );

      if (!hasAccess) {
        console.error(
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
        console.error("Error deleting mileage log:", deleteError);
        return {
          data: null,
          error: `Failed to delete mileage log: ${deleteError.message}`,
          loading: false,
        };
      }

      // Check if any rows were actually deleted
      if (!deleteResult || deleteResult.length === 0) {
        console.error("No rows were deleted for mileage log ID:", id);
        return {
          data: null,
          error:
            "Mileage log could not be deleted - it may have already been removed",
          loading: false,
        };
      }

      console.log(
        "Successfully deleted mileage log:",
        id,
        "Deleted count:",
        deleteResult.length,
      );

      return { data: true, error: null, loading: false };
    } catch (error) {
      console.error("Unexpected error deleting mileage log:", error);
      return {
        data: null,
        error: "An unexpected error occurred while deleting the mileage log",
        loading: false,
      };
    }
  }
}

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
        console.log("Mileage log exists for this date, skipping auto-creation");
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

      console.log("Mileage log auto-created from fuel log");
    } catch (error) {
      console.warn("Failed to auto-create mileage log:", error);
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
        console.error("Error fetching owned fuel logs:", ownedLogsResult.error);
        return {
          data: null,
          error: ownedLogsResult.error.message,
          loading: false,
        };
      }

      if (sharedLogsResult.error) {
        console.warn(
          "Error fetching shared fuel logs:",
          sharedLogsResult.error,
        );
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
      console.error("Unexpected error fetching fuel logs:", error);
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
        console.error("Error fetching fuel log:", error);
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
      console.error("Unexpected error fetching fuel log:", error);
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
        console.error("Error creating fuel log:", error);
        return { data: null, error: error.message, loading: false };
      }

      // Fire-and-forget mileage log creation
      if (log.odometer_reading && log.odometer_reading > 0) {
        this.createMileageLogFromFuelLog(
          log.vehicle_id,
          log.odometer_reading,
          log.date,
          user.id,
        ).catch((err) => console.warn("Mileage auto-log failed:", err));
      }

      return { data, error: null, loading: false };
    } catch (error) {
      console.error("Unexpected error creating fuel log:", error);
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
        console.error("User authentication failed:", userError);
        return { data: null, error: "User not authenticated", loading: false };
      }

      console.log("Updating fuel log:", id, "with updates:", updates);

      // First, get the log to check vehicle access and ensure it exists
      const { data: existingLog, error: fetchError } = await supabase
        .from("fuel_logs")
        .select("vehicle_id, user_id")
        .eq("id", id)
        .single<{ vehicle_id: string; user_id: string }>();

      if (fetchError) {
        console.error("Error fetching existing fuel log:", fetchError);
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
        console.error("No fuel log found with ID:", id);
        return { data: null, error: "Fuel log not found", loading: false };
      }

      // Validate that user can access the vehicle (owns it or has shared access)
      const hasAccess = await canUserAccessVehicle(
        existingLog.vehicle_id,
        user.id,
      );

      if (!hasAccess) {
        console.error(
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
        console.error("Error updating fuel log:", updateError);
        return {
          data: null,
          error: `Failed to update fuel log: ${updateError.message}`,
          loading: false,
        };
      }

      // Check if any rows were updated
      if (!updateResult || updateResult.length === 0) {
        console.error("No rows were updated for fuel log ID:", id);
        return {
          data: null,
          error: "Fuel log could not be updated - it may have been deleted",
          loading: false,
        };
      }

      if (updateResult.length > 1) {
        console.warn(
          "Multiple rows updated for fuel log ID:",
          id,
          "Updated count:",
          updateResult.length,
        );
      }

      const updatedLog = updateResult[0] as FuelLog;
      console.log("Successfully updated fuel log:", updatedLog);

      return { data: updatedLog, error: null, loading: false };
    } catch (error) {
      console.error("Unexpected error updating fuel log:", error);
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
        console.error("User authentication failed:", userError);
        return { data: null, error: "User not authenticated", loading: false };
      }

      console.log("Deleting fuel log:", id);

      // First, get the log to check vehicle access and ensure it exists
      const { data: existingLog, error: fetchError } = await supabase
        .from("fuel_logs")
        .select("vehicle_id")
        .eq("id", id)
        .single<{ vehicle_id: string }>();

      if (fetchError) {
        console.error(
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
        console.error("No fuel log found with ID for deletion:", id);
        return { data: null, error: "Fuel log not found", loading: false };
      }

      // Validate that user can access the vehicle (owns it or has shared access)
      const hasAccess = await canUserAccessVehicle(
        existingLog.vehicle_id,
        user.id,
      );

      if (!hasAccess) {
        console.error(
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
        console.error("Error deleting fuel log:", deleteError);
        return {
          data: null,
          error: `Failed to delete fuel log: ${deleteError.message}`,
          loading: false,
        };
      }

      // Check if any rows were actually deleted
      if (!deleteResult || deleteResult.length === 0) {
        console.error("No rows were deleted for fuel log ID:", id);
        return {
          data: null,
          error:
            "Fuel log could not be deleted - it may have already been removed",
          loading: false,
        };
      }

      console.log(
        "Successfully deleted fuel log:",
        id,
        "Deleted count:",
        deleteResult.length,
      );

      return { data: true, error: null, loading: false };
    } catch (error) {
      console.error("Unexpected error deleting fuel log:", error);
      return {
        data: null,
        error: "An unexpected error occurred while deleting the fuel log",
        loading: false,
      };
    }
  }
}

export class ServiceLogService {
  static async getServiceLogs(
    vehicleId?: string,
    options?: { limit?: number; offset?: number },
  ): Promise<ApiResponse<ServiceLog[]>> {
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
        .from("service_logs")
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
              .from("service_logs")
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
        console.error(
          "Error fetching owned service logs:",
          ownedLogsResult.error,
        );
        return {
          data: null,
          error: ownedLogsResult.error.message,
          loading: false,
        };
      }

      if (sharedLogsResult.error) {
        console.warn(
          "Error fetching shared service logs:",
          sharedLogsResult.error,
        );
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
      console.error("Unexpected error fetching service logs:", error);
      return {
        data: null,
        error: "Failed to fetch service logs",
        loading: false,
      };
    }
  }

  static async createServiceLog(
    log: Omit<ServiceLogInsert, "user_id">,
  ): Promise<ApiResponse<ServiceLog>> {
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
        .from("service_logs")
        // @ts-ignore - Supabase type inference issue with insert
        .insert({
          id: log.id,
          vehicle_id: log.vehicle_id,
          service_type: log.service_type,
          date: log.date,
          odometer_reading: log.odometer_reading,
          cost: log.cost,
          description: log.description,
          next_service_due: log.next_service_due,
          receipt_image_url: log.receipt_image_url,
          ocr_extracted_data: log.ocr_extracted_data,
          auto_filled: log.auto_filled,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating service log:", error);
        return { data: null, error: error.message, loading: false };
      }

      return { data, error: null, loading: false };
    } catch (error) {
      console.error("Unexpected error creating service log:", error);
      return {
        data: null,
        error: "Failed to create service log",
        loading: false,
      };
    }
  }

  static async updateServiceLog(
    id: string,
    updates: ServiceLogUpdate,
  ): Promise<ApiResponse<ServiceLog>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("User authentication failed:", userError);
        return { data: null, error: "User not authenticated", loading: false };
      }

      console.log("Updating service log:", id, "with updates:", updates);

      // First, get the log to check vehicle access and ensure it exists
      const { data: existingLog, error: fetchError } = await supabase
        .from("service_logs")
        .select("vehicle_id, user_id")
        .eq("id", id)
        .single<{ vehicle_id: string; user_id: string }>();

      if (fetchError) {
        console.error("Error fetching existing service log:", fetchError);
        if (fetchError.code === "PGRST116") {
          return { data: null, error: "Service log not found", loading: false };
        }
        return {
          data: null,
          error: "Failed to verify service log exists",
          loading: false,
        };
      }

      if (!existingLog) {
        console.error("No service log found with ID:", id);
        return { data: null, error: "Service log not found", loading: false };
      }

      // Validate that user can access the vehicle (owns it or has shared access)
      const hasAccess = await canUserAccessVehicle(
        existingLog.vehicle_id,
        user.id,
      );

      if (!hasAccess) {
        console.error(
          "User does not have access to vehicle:",
          existingLog.vehicle_id,
        );
        return {
          data: null,
          error:
            "Access denied - you do not have permission to edit this service log",
          loading: false,
        };
      }

      // Perform the update and return the results
      const { data: updateResult, error: updateError } = await supabase
        .from("service_logs")
        // @ts-ignore - Supabase type inference issue with update
        .update({
          service_type: updates.service_type,
          description: updates.description,
          cost: updates.cost,
          date: updates.date,
          odometer_reading: updates.odometer_reading,
          next_service_due: updates.next_service_due,
          receipt_image_url: updates.receipt_image_url,
          ocr_extracted_data: updates.ocr_extracted_data,
          auto_filled: updates.auto_filled,
        })
        .eq("id", id)
        .select();

      if (updateError) {
        console.error("Error updating service log:", updateError);
        return {
          data: null,
          error: `Failed to update service log: ${updateError.message}`,
          loading: false,
        };
      }

      // Check if any rows were updated
      if (!updateResult || updateResult.length === 0) {
        console.error("No rows were updated for service log ID:", id);
        return {
          data: null,
          error: "Service log could not be updated - it may have been deleted",
          loading: false,
        };
      }

      if (updateResult.length > 1) {
        console.warn(
          "Multiple rows updated for service log ID:",
          id,
          "Updated count:",
          updateResult.length,
        );
      }

      const updatedLog = updateResult[0] as ServiceLog;
      console.log("Successfully updated service log:", updatedLog);

      return { data: updatedLog, error: null, loading: false };
    } catch (error) {
      console.error("Unexpected error updating service log:", error);
      return {
        data: null,
        error: "An unexpected error occurred while updating the service log",
        loading: false,
      };
    }
  }

  static async deleteServiceLog(id: string): Promise<ApiResponse<boolean>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("User authentication failed:", userError);
        return { data: null, error: "User not authenticated", loading: false };
      }

      console.log("Deleting service log:", id);

      // First, get the log to check vehicle access and ensure it exists
      const { data: existingLog, error: fetchError } = await supabase
        .from("service_logs")
        .select("vehicle_id")
        .eq("id", id)
        .single<{ vehicle_id: string }>();

      if (fetchError) {
        console.error(
          "Error fetching existing service log for deletion:",
          fetchError,
        );
        if (fetchError.code === "PGRST116") {
          return { data: null, error: "Service log not found", loading: false };
        }
        return {
          data: null,
          error: "Failed to verify service log exists",
          loading: false,
        };
      }

      if (!existingLog) {
        console.error("No service log found with ID for deletion:", id);
        return { data: null, error: "Service log not found", loading: false };
      }

      // Validate that user can access the vehicle (owns it or has shared access)
      const hasAccess = await canUserAccessVehicle(
        existingLog.vehicle_id,
        user.id,
      );

      if (!hasAccess) {
        console.error(
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

      // Check if user is the vehicle owner (only owner can delete logs)
      const { data: vehicle, error: vehicleError } = await supabase
        .from("vehicles")
        .select("user_id")
        .eq("id", existingLog.vehicle_id)
        .single<{ user_id: string }>();

      if (vehicleError) {
        console.error(
          "Error fetching vehicle for ownership check:",
          vehicleError,
        );
        return {
          data: null,
          error: "Failed to verify vehicle ownership",
          loading: false,
        };
      }

      // Only the vehicle owner can delete logs
      if (vehicle.user_id !== user.id) {
        return {
          data: null,
          error: "PERMISSION_DENIED_SHARED_VEHICLE",
          loading: false,
        };
      }

      // Perform the deletion
      const { data: deleteResult, error: deleteError } = await supabase
        .from("service_logs")
        .delete()
        .eq("id", id)
        .select();

      if (deleteError) {
        console.error("Error deleting service log:", deleteError);
        return {
          data: null,
          error: `Failed to delete service log: ${deleteError.message}`,
          loading: false,
        };
      }

      // Check if any rows were actually deleted
      if (!deleteResult || deleteResult.length === 0) {
        console.error("No rows were deleted for service log ID:", id);
        return {
          data: null,
          error:
            "Service log could not be deleted - it may have already been removed",
          loading: false,
        };
      }

      console.log(
        "Successfully deleted service log:",
        id,
        "Deleted count:",
        deleteResult.length,
      );

      return { data: true, error: null, loading: false };
    } catch (error) {
      console.error("Unexpected error deleting service log:", error);
      return {
        data: null,
        error: "An unexpected error occurred while deleting the service log",
        loading: false,
      };
    }
  }
}
