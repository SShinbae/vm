import { logger } from "@/lib/utils/logger";
import { supabase } from "../../services/supabaseClient";
import {
  ApiResponse,
  ServiceLog,
  ServiceLogInsert,
  ServiceLogUpdate,
} from "../../types";
import { canUserAccessVehicle } from "../utils/serviceUtils";

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
        logger.error(
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
        logger.warn(
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
      logger.error("Unexpected error fetching service logs:", error);
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
          next_service_mileage: log.next_service_mileage,
          receipt_image_url: log.receipt_image_url,
          ocr_extracted_data: log.ocr_extracted_data,
          auto_filled: log.auto_filled,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        logger.error("Error creating service log:", error);
        return { data: null, error: error.message, loading: false };
      }

      return { data, error: null, loading: false };
    } catch (error) {
      logger.error("Unexpected error creating service log:", error);
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
        logger.error("User authentication failed:", userError);
        return { data: null, error: "User not authenticated", loading: false };
      }

      logger.log("Updating service log:", id, "with updates:", updates);

      // First, get the log to check vehicle access and ensure it exists
      const { data: existingLog, error: fetchError } = await supabase
        .from("service_logs")
        .select("vehicle_id, user_id")
        .eq("id", id)
        .single<{ vehicle_id: string; user_id: string }>();

      if (fetchError) {
        logger.error("Error fetching existing service log:", fetchError);
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
        logger.error("No service log found with ID:", id);
        return { data: null, error: "Service log not found", loading: false };
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
          next_service_mileage: updates.next_service_mileage,
          receipt_image_url: updates.receipt_image_url,
          ocr_extracted_data: updates.ocr_extracted_data,
          auto_filled: updates.auto_filled,
        })
        .eq("id", id)
        .select();

      if (updateError) {
        logger.error("Error updating service log:", updateError);
        return {
          data: null,
          error: `Failed to update service log: ${updateError.message}`,
          loading: false,
        };
      }

      // Check if any rows were updated
      if (!updateResult || updateResult.length === 0) {
        logger.error("No rows were updated for service log ID:", id);
        return {
          data: null,
          error: "Service log could not be updated - it may have been deleted",
          loading: false,
        };
      }

      if (updateResult.length > 1) {
        logger.warn(
          "Multiple rows updated for service log ID:",
          id,
          "Updated count:",
          updateResult.length,
        );
      }

      const updatedLog = updateResult[0] as ServiceLog;
      logger.log("Successfully updated service log:", updatedLog);

      return { data: updatedLog, error: null, loading: false };
    } catch (error) {
      logger.error("Unexpected error updating service log:", error);
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
        logger.error("User authentication failed:", userError);
        return { data: null, error: "User not authenticated", loading: false };
      }

      logger.log("Deleting service log:", id);

      // First, get the log to check vehicle access and ensure it exists
      const { data: existingLog, error: fetchError } = await supabase
        .from("service_logs")
        .select("vehicle_id")
        .eq("id", id)
        .single<{ vehicle_id: string }>();

      if (fetchError) {
        logger.error(
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
        logger.error("No service log found with ID for deletion:", id);
        return { data: null, error: "Service log not found", loading: false };
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

      // Check if user is the vehicle owner (only owner can delete logs)
      const { data: vehicle, error: vehicleError } = await supabase
        .from("vehicles")
        .select("user_id")
        .eq("id", existingLog.vehicle_id)
        .single<{ user_id: string }>();

      if (vehicleError) {
        logger.error(
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
        logger.error("Error deleting service log:", deleteError);
        return {
          data: null,
          error: `Failed to delete service log: ${deleteError.message}`,
          loading: false,
        };
      }

      // Check if any rows were actually deleted
      if (!deleteResult || deleteResult.length === 0) {
        logger.error("No rows were deleted for service log ID:", id);
        return {
          data: null,
          error:
            "Service log could not be deleted - it may have already been removed",
          loading: false,
        };
      }

      logger.log(
        "Successfully deleted service log:",
        id,
        "Deleted count:",
        deleteResult.length,
      );

      return { data: true, error: null, loading: false };
    } catch (error) {
      logger.error("Unexpected error deleting service log:", error);
      return {
        data: null,
        error: "An unexpected error occurred while deleting the service log",
        loading: false,
      };
    }
  }
}
