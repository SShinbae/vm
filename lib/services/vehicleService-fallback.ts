import { logger } from "@/lib/utils/logger";
import { supabase } from "../../services/supabaseClient";
import {
  Vehicle,
  VehicleInsert,
  VehicleUpdate,
  VehicleWithLogs,
  VehicleWithGroupInfo,
  ApiResponse,
} from "../../types";

export class VehicleServiceFallback {
  static async getVehicles(): Promise<ApiResponse<VehicleWithGroupInfo[]>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      // Get user's own vehicles (this will always work with basic RLS)
      const { data: ownVehicles, error: ownError } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (ownError) {
        logger.error("Error fetching own vehicles:", ownError);
        return { data: null, error: ownError.message, loading: false };
      }

      // Get groups the user is a member of
      const { data: groupMemberships } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      let groupVehicles: any[] = [];

      if (groupMemberships && groupMemberships.length > 0) {
        // Get all group IDs where user is a member
        const groupIds = groupMemberships.map(
          (gm: { group_id: string }) => gm.group_id,
        );

        // Get all other members of these groups
        const { data: allGroupMembers } = await supabase
          .from("group_members")
          .select("user_id")
          .in("group_id", groupIds)
          .neq("user_id", user.id); // Exclude current user

        if (allGroupMembers && allGroupMembers.length > 0) {
          const memberUserIds = [
            ...new Set(
              allGroupMembers.map((gm: { user_id: string }) => gm.user_id),
            ),
          ];

          // Check if shared_with_groups column exists by trying to query it
          let vehiclesQuery = supabase
            .from("vehicles")
            .select("*")
            .in("user_id", memberUserIds);

          // Try to add shared_with_groups filter if column exists
          try {
            await supabase
              .from("vehicles")
              .select("shared_with_groups")
              .limit(1);

            // If we get here, the column exists
            vehiclesQuery = vehiclesQuery.eq("shared_with_groups", true);
          } catch {
            // Column doesn't exist, get all vehicles from group members
            logger.log(
              "shared_with_groups column not found, showing all group member vehicles",
            );
          }

          const { data: memberVehicles, error: memberVehiclesError } =
            await vehiclesQuery;

          if (!memberVehiclesError && memberVehicles) {
            // Get profile information for vehicle owners
            const { data: ownerProfiles } = await supabase
              .from("profiles")
              .select("id, full_name, email")
              .in("id", memberUserIds);

            // Add owner information to vehicles
            groupVehicles = memberVehicles.map((vehicle: Vehicle) => ({
              ...vehicle,
              owner_profile:
                ownerProfiles?.find(
                  (p: {
                    id: string;
                    full_name: string | null;
                    email: string;
                  }) => p.id === vehicle.user_id,
                ) || null,
              is_group_vehicle: true,
            }));
          }
        }
      }

      // Mark own vehicles
      const ownVehiclesMarked: VehicleWithGroupInfo[] = (ownVehicles || []).map(
        (vehicle: Vehicle) => ({
          ...vehicle,
          is_group_vehicle: false,
          owner_profile: null,
        }),
      );

      const allVehicles = [...ownVehiclesMarked, ...groupVehicles];

      // Sort by created_at descending
      allVehicles.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      logger.log("Fetched vehicles (fallback) debug:", {
        userId: user.id,
        ownVehicles: ownVehicles?.length || 0,
        groupVehicles: groupVehicles.length,
        totalVehicles: allVehicles.length,
        groupMemberships: groupMemberships?.length || 0,
      });

      return { data: allVehicles, error: null, loading: false };
    } catch (err) {
      logger.error("Unexpected error fetching vehicles:", err);
      return { data: null, error: "Failed to fetch vehicles", loading: false };
    }
  }

  static async getVehicleById(
    id: string,
  ): Promise<ApiResponse<VehicleWithLogs>> {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select(
          `
          *,
          mileage_logs(*, created_at),
          fuel_logs(*, created_at),
          service_logs(*, created_at)
        `,
        )
        .eq("id", id)
        .single();

      if (error) {
        logger.error("Error fetching vehicle:", error);
        return { data: null, error: error.message, loading: false };
      }

      return { data, error: null, loading: false };
    } catch (err) {
      logger.error("Unexpected error fetching vehicle:", err);
      return { data: null, error: "Failed to fetch vehicle", loading: false };
    }
  }

  static async createVehicle(
    vehicle: Omit<VehicleInsert, "user_id">,
  ): Promise<ApiResponse<Vehicle>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      // Check for duplicate license plate
      const { data: existing } = await supabase
        .from("vehicles")
        .select("id")
        .eq("license_plate", vehicle.license_plate)
        .eq("user_id", user.id);

      if (existing && existing.length > 0) {
        return {
          data: null,
          error: "A vehicle with this license plate already exists",
          loading: false,
        };
      }

      // Prepare vehicle data - only include shared_with_groups if the column exists
      const vehicleData: any = {
        ...vehicle,
        user_id: user.id,
      };

      // Try to include shared_with_groups if it exists
      try {
        await supabase.from("vehicles").select("shared_with_groups").limit(1);

        // Column exists, include it
        vehicleData.shared_with_groups = vehicle.shared_with_groups ?? false;
      } catch {
        // Column doesn't exist, exclude it
        logger.log(
          "shared_with_groups column not found, creating vehicle without sharing field",
        );
      }

      const { data, error } = await supabase
        .from("vehicles")
        .insert(vehicleData)
        .select()
        .single();

      if (error) {
        logger.error("Error creating vehicle:", error);
        return { data: null, error: error.message, loading: false };
      }

      return { data, error: null, loading: false };
    } catch (err) {
      logger.error("Unexpected error creating vehicle:", err);
      return { data: null, error: "Failed to create vehicle", loading: false };
    }
  }

  static async updateVehicle(
    id: string,
    updates: VehicleUpdate,
  ): Promise<ApiResponse<Vehicle>> {
    try {
      // If updating license plate, check for duplicates
      if (updates.license_plate) {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          return {
            data: null,
            error: "User not authenticated",
            loading: false,
          };
        }

        const { data: existing } = await supabase
          .from("vehicles")
          .select("id")
          .eq("license_plate", updates.license_plate)
          .eq("user_id", user.id)
          .neq("id", id);

        if (existing && existing.length > 0) {
          return {
            data: null,
            error: "A vehicle with this license plate already exists",
            loading: false,
          };
        }
      }

      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await (supabase.from("vehicles") as any)
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        logger.error("Error updating vehicle:", error);
        return { data: null, error: error.message, loading: false };
      }

      return { data, error: null, loading: false };
    } catch (err) {
      logger.error("Unexpected error updating vehicle:", err);
      return { data: null, error: "Failed to update vehicle", loading: false };
    }
  }

  static async deleteVehicle(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);

      if (error) {
        logger.error("Error deleting vehicle:", error);
        return { data: null, error: error.message, loading: false };
      }

      return { data: true, error: null, loading: false };
    } catch (err) {
      logger.error("Unexpected error deleting vehicle:", err);
      return { data: null, error: "Failed to delete vehicle", loading: false };
    }
  }

  static async getVehicleStats(vehicleId: string) {
    try {
      // Get latest mileage
      const { data: latestMileage } = await supabase
        .from("mileage_logs")
        .select("odometer_reading")
        .eq("vehicle_id", vehicleId)
        .order("date", { ascending: false })
        .limit(1);

      type MileageResult = { odometer_reading: number };

      // Get fuel efficiency (last 5 fuel-ups)
      const { data: fuelLogs } = await supabase
        .from("fuel_logs")
        .select("liters_filled, odometer_reading")
        .eq("vehicle_id", vehicleId)
        .order("date", { ascending: false })
        .limit(5);

      // Get next service due
      const { data: nextService } = await supabase
        .from("service_logs")
        .select("next_service_due, service_type")
        .eq("vehicle_id", vehicleId)
        .not("next_service_due", "is", null)
        .order("next_service_due", { ascending: true })
        .limit(1);

      return {
        currentMileage:
          (latestMileage as MileageResult[] | null)?.[0]?.odometer_reading || 0,
        fuelLogs: fuelLogs || [],
        nextService: nextService?.[0] || null,
      };
    } catch (err) {
      logger.error("Error fetching vehicle stats:", err);
      return {
        currentMileage: 0,
        fuelLogs: [],
        nextService: null,
      };
    }
  }

  static async toggleVehicleSharing(
    vehicleId: string,
    shared: boolean,
  ): Promise<ApiResponse<Vehicle>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      // Verify the user owns this vehicle
      const { data: vehicle, error: vehicleError } = await supabase
        .from("vehicles")
        .select("user_id")
        .eq("id", vehicleId)
        .single();

      if (vehicleError) {
        logger.error("Error fetching vehicle:", vehicleError);
        return { data: null, error: "Vehicle not found", loading: false };
      }

      type VehicleUserIdResult = { user_id: string };
      if ((vehicle as VehicleUserIdResult).user_id !== user.id) {
        return {
          data: null,
          error: "You can only modify your own vehicles",
          loading: false,
        };
      }

      // Check if shared_with_groups column exists
      try {
        await supabase.from("vehicles").select("shared_with_groups").limit(1);

        // Column exists, update it
        const updateData: any = {
          shared_with_groups: shared,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await (supabase.from("vehicles") as any)
          .update(updateData)
          .eq("id", vehicleId)
          .select()
          .single();

        if (error) {
          logger.error("Error updating vehicle sharing:", error);
          return { data: null, error: error.message, loading: false };
        }

        return { data, error: null, loading: false };
      } catch {
        // Column doesn't exist
        return {
          data: null,
          error: "Sharing feature not available - database needs migration",
          loading: false,
        };
      }
    } catch (err) {
      logger.error("Unexpected error toggling vehicle sharing:", err);
      return {
        data: null,
        error: "Failed to update vehicle sharing",
        loading: false,
      };
    }
  }
}
