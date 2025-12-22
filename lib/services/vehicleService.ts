import { supabase } from "../../services/supabaseClient";
import { ServiceTemplate, ServiceTemplateFormData } from "../../types";
import {
  ApiResponse,
  FuelLog,
  Group,
  MileageLog,
  ServiceLog,
  Vehicle,
  VehicleInsert,
  VehicleSharingConfig,
  VehicleUpdate,
  VehicleWithDetails,
} from "../../types/database-v2";
import { uploadImage } from "../utils/imageUpload";
// Service templates now use Supabase database storage

export class VehicleService {
  /**
   * Get vehicles (backward compatibility method)
   */
  static async getVehicles(): Promise<ApiResponse<VehicleWithDetails[]>> {
    return await this.getVehiclesWithSharing();
  }

  /**
   * Get vehicles with enhanced sharing information using the database function
   */
  static async getVehiclesWithSharing(): Promise<
    ApiResponse<VehicleWithDetails[]>
  > {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      console.log("🔍 Fetching vehicles with sharing info for user:", user.id);

      // Define the expected return type from the RPC
      type VehicleSharingInfo = {
        vehicle_id: string;
        make: string;
        model: string;
        year: number;
        license_plate: string;
        vin: string | null;
        main_image_url: string | null;
        color: string | null;
        current_mileage: number | null;
        created_at: string;
        updated_at: string;
        is_own_vehicle: boolean;
        owner_name: string | null;
        owner_email: string;
        shared_groups: string[];
      };

      // Use the database function for optimized query
      const { data: vehicleData, error: vehicleError } = await (
        supabase as any
      ).rpc("get_user_vehicles_with_sharing", { user_uuid: user.id });

      if (vehicleError) {
        console.error("❌ Error fetching vehicles:", vehicleError);
        return { data: null, error: vehicleError.message, loading: false };
      }

      const typedVehicleData = vehicleData as VehicleSharingInfo[] | null;
      console.log(
        "✅ Raw vehicle data received:",
        typedVehicleData?.length || 0,
      );

      // Enhance the data with additional information
      const enhancedVehicles: VehicleWithDetails[] = await Promise.all(
        (typedVehicleData || []).map(async (vehicle: VehicleSharingInfo) => {
          // Get vehicle images
          const { data: images } = await supabase
            .from("vehicle_images")
            .select("*")
            .eq("vehicle_id", vehicle.vehicle_id)
            .order("image_type", { ascending: true })
            .order("display_order", { ascending: true });

          // Get sharing groups for owned vehicles
          let sharedGroups: Group[] = [];
          if (vehicle.is_own_vehicle) {
            const { data: shares } = await supabase
              .from("vehicle_group_shares")
              .select(
                `
                group_id,
                shared_at,
                groups!inner(id, name, description)
              `,
              )
              .eq("vehicle_id", vehicle.vehicle_id);

            sharedGroups =
              shares?.map((share: any) => share.groups).filter(Boolean) || [];
          }

          // Get latest logs for stats
          const [mileageResult, fuelResult, serviceResult] = await Promise.all([
            supabase
              .from("mileage_logs")
              .select("*")
              .eq("vehicle_id", vehicle.vehicle_id)
              .order("date", { ascending: false })
              .limit(1)
              .returns<MileageLog[]>(),
            supabase
              .from("fuel_logs")
              .select("*")
              .eq("vehicle_id", vehicle.vehicle_id)
              .order("date", { ascending: false })
              .limit(1)
              .returns<FuelLog[]>(),
            supabase
              .from("service_logs")
              .select("*")
              .eq("vehicle_id", vehicle.vehicle_id)
              .order("date", { ascending: false })
              .limit(1)
              .returns<ServiceLog[]>(),
          ]);

          // Calculate current mileage: use database field or fall back to latest mileage log
          const currentMileage =
            vehicle.current_mileage && vehicle.current_mileage > 0
              ? vehicle.current_mileage
              : mileageResult.data?.[0]?.odometer_reading || 0;

          return {
            id: vehicle.vehicle_id,
            user_id: vehicle.is_own_vehicle ? user.id : "shared",
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            license_plate: vehicle.license_plate,
            vin: vehicle.vin,
            main_image_url: vehicle.main_image_url,
            color: vehicle.color,
            current_mileage: currentMileage,
            created_at: vehicle.created_at,
            updated_at: vehicle.updated_at,
            is_own_vehicle: vehicle.is_own_vehicle,
            owner_profile: vehicle.is_own_vehicle
              ? null
              : {
                  id: "owner-id",
                  email: vehicle.owner_email,
                  full_name: vehicle.owner_name,
                  avatar_url: null,
                  phone: null,
                  bio: null,
                  created_at: "",
                  updated_at: "",
                },
            images: images || [],
            shared_groups: sharedGroups,
            sharing_info: {
              is_shared: vehicle.shared_groups?.length > 0,
              shared_with_groups: vehicle.shared_groups || [],
              total_shares: vehicle.shared_groups?.length || 0,
            },
            logs: {
              latest_mileage: mileageResult.data?.[0] || undefined,
              latest_fuel: fuelResult.data?.[0] || undefined,
              latest_service: serviceResult.data?.[0] || undefined,
            },
          };
        }),
      );

      console.log("🎉 Enhanced vehicles processed:", enhancedVehicles.length);
      return { data: enhancedVehicles, error: null, loading: false };
    } catch (error) {
      console.error("💥 Unexpected error fetching vehicles:", error);
      return { data: null, error: "Failed to fetch vehicles", loading: false };
    }
  }

  /**
   * Get vehicles separated by ownership type
   */
  static async getVehiclesSeparated(): Promise<
    ApiResponse<{
      ownVehicles: VehicleWithDetails[];
      sharedVehicles: VehicleWithDetails[];
    }>
  > {
    try {
      const response = await this.getVehiclesWithSharing();

      if (response.error || !response.data) {
        return {
          data: null,
          error: response.error,
          loading: false,
        };
      }

      const ownVehicles = response.data.filter((v) => v.is_own_vehicle);
      const sharedVehicles = response.data.filter((v) => !v.is_own_vehicle);

      console.log("📊 Vehicles separated:", {
        ownCount: ownVehicles.length,
        sharedCount: sharedVehicles.length,
      });

      return {
        data: { ownVehicles, sharedVehicles },
        error: null,
        loading: false,
      };
    } catch (error) {
      console.error("💥 Error separating vehicles:", error);
      return {
        data: null,
        error: "Failed to separate vehicles",
        loading: false,
      };
    }
  }

  /**
   * Get vehicles shared with a specific group
   */
  static async getVehiclesForGroup(
    groupId: string,
  ): Promise<ApiResponse<VehicleWithDetails[]>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      console.log("🔍 Fetching vehicles for group:", groupId);

      // Get vehicles shared with this specific group
      const { data: shares, error: sharesError } = await supabase
        .from("vehicle_group_shares")
        .select(
          `
          vehicle_id,
          vehicles!inner(
            id,
            user_id,
            make,
            model,
            year,
            license_plate,
            vin,
            main_image_url,
            color,
            current_mileage,
            created_at,
            updated_at
          )
        `,
        )
        .eq("group_id", groupId);

      if (sharesError) {
        console.error("❌ Error fetching group vehicles:", sharesError);
        return { data: null, error: sharesError.message, loading: false };
      }

      if (!shares || shares.length === 0) {
        console.log("📭 No vehicles shared with this group");
        return { data: [], error: null, loading: false };
      }

      // Enhance vehicle data with owner profile and images
      const enhancedVehicles: VehicleWithDetails[] = await Promise.all(
        shares.map(async (share: any) => {
          const vehicle = share.vehicles;

          // Get vehicle images
          const { data: images } = await supabase
            .from("vehicle_images")
            .select("*")
            .eq("vehicle_id", vehicle.id)
            .order("image_type", { ascending: true })
            .order("display_order", { ascending: true });

          // Get owner profile
          const ownerProfileResult = await supabase
            .from("profiles")
            .select("id, email, full_name, avatar_url")
            .eq("id", vehicle.user_id)
            .single();

          const ownerProfile = ownerProfileResult.data as {
            id: string;
            email: string;
            full_name: string | null;
            avatar_url: string | null;
          } | null;

          const isOwnVehicle = vehicle.user_id === user.id;

          return {
            id: vehicle.id,
            user_id: vehicle.user_id,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            license_plate: vehicle.license_plate,
            vin: vehicle.vin,
            main_image_url: vehicle.main_image_url,
            color: vehicle.color,
            current_mileage: vehicle.current_mileage || 0,
            created_at: vehicle.created_at,
            updated_at: vehicle.updated_at,
            is_own_vehicle: isOwnVehicle,
            owner_profile: isOwnVehicle
              ? null
              : {
                  id: ownerProfile?.id || vehicle.user_id,
                  email: ownerProfile?.email || "",
                  full_name: ownerProfile?.full_name || null,
                  avatar_url: ownerProfile?.avatar_url || null,
                  phone: null,
                  bio: null,
                  created_at: "",
                  updated_at: "",
                },
            images: images || [],
            shared_groups: [],
            sharing_info: undefined,
            logs: undefined,
          };
        }),
      );

      console.log("✅ Vehicles fetched for group:", enhancedVehicles.length);
      return { data: enhancedVehicles, error: null, loading: false };
    } catch (error) {
      console.error("💥 Error fetching vehicles for group:", error);
      return {
        data: null,
        error: "Failed to fetch vehicles for group",
        loading: false,
      };
    }
  }

  /**
   * Share vehicle with specific groups
   */
  static async shareVehicleWithGroups(
    vehicleId: string,
    groupIds: string[],
  ): Promise<ApiResponse<boolean>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      console.log("🔄 Sharing vehicle with groups:", { vehicleId, groupIds });

      // Use the database function for atomic operation
      const { error } = await (supabase as any).rpc(
        "share_vehicle_with_groups",
        { vehicle_uuid: vehicleId, group_uuids: groupIds },
      );

      if (error) {
        console.error("❌ Error sharing vehicle:", error);
        return { data: null, error: error.message, loading: false };
      }

      console.log(
        "✅ Vehicle shared successfully with",
        groupIds.length,
        "groups",
      );
      return { data: true, error: null, loading: false };
    } catch (error) {
      console.error("💥 Unexpected error sharing vehicle:", error);
      return { data: null, error: "Failed to share vehicle", loading: false };
    }
  }

  /**
   * Get vehicle sharing configuration
   */
  static async getVehicleSharingConfig(
    vehicleId: string,
  ): Promise<ApiResponse<VehicleSharingConfig>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      // Verify user owns the vehicle
      const vehicleResult = await supabase
        .from("vehicles")
        .select("user_id")
        .eq("id", vehicleId)
        .single();

      const { data: vehicle, error: vehicleError } = vehicleResult as any;

      if (vehicleError || !vehicle) {
        return { data: null, error: "Vehicle not found", loading: false };
      }

      if (vehicle.user_id !== user.id) {
        return {
          data: null,
          error: "You can only view sharing config for your own vehicles",
          loading: false,
        };
      }

      // Get current shares with group info
      const { data: shares, error: sharesError } = await supabase
        .from("vehicle_group_shares")
        .select(
          `
          group_id,
          shared_at,
          groups!inner(id, name, description)
        `,
        )
        .eq("vehicle_id", vehicleId);

      if (sharesError) {
        console.error("Error fetching sharing config:", sharesError);
        return { data: null, error: sharesError.message, loading: false };
      }

      // Get member counts for each shared group separately
      const sharedGroupsWithCounts = await Promise.all(
        (shares || []).map(async (share: any) => {
          // Get member count for this group using a simpler count query
          const { data: members, error: countError } = await supabase
            .from("group_members")
            .select("id")
            .eq("group_id", share.group_id);

          if (countError) {
            console.error("Error getting member count:", countError);
          }

          return {
            group_id: share.group_id!,
            group_name: share.groups.name,
            member_count: members?.length || 0,
            shared_at: share.shared_at,
          };
        }),
      );

      const config: VehicleSharingConfig = {
        vehicle_id: vehicleId,
        shared_groups: sharedGroupsWithCounts,
        is_sharing_enabled: sharedGroupsWithCounts.length > 0,
        total_shares: sharedGroupsWithCounts.length,
      };

      return { data: config, error: null, loading: false };
    } catch (error) {
      console.error("Unexpected error fetching sharing config:", error);
      return {
        data: null,
        error: "Failed to fetch sharing configuration",
        loading: false,
      };
    }
  }

  /**
   * Remove vehicle sharing (stop sharing with all groups)
   */
  static async removeVehicleSharing(
    vehicleId: string,
  ): Promise<ApiResponse<boolean>> {
    try {
      return await this.shareVehicleWithGroups(vehicleId, []);
    } catch (error) {
      console.error("Unexpected error removing vehicle sharing:", error);
      return {
        data: null,
        error: "Failed to remove vehicle sharing",
        loading: false,
      };
    }
  }

  /**
   * Create vehicle with enhanced data
   */
  static async createVehicle(
    vehicleData: Omit<VehicleInsert, "user_id">,
    sharedGroupIds?: string[],
    imageUri?: string,
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
        .eq("license_plate", vehicleData.license_plate)
        .eq("user_id", user.id);

      if (existing && existing.length > 0) {
        return {
          data: null,
          error: "A vehicle with this license plate already exists",
          loading: false,
        };
      }

      // Upload image if provided
      let imageUrl: string | undefined;
      if (imageUri) {
        const uploadResult = await uploadImage(
          imageUri,
          "vehicles",
          `vehicle_${user.id}`,
        );
        if (uploadResult.success && uploadResult.url) {
          imageUrl = uploadResult.url;
        } else {
          console.warn("Failed to upload vehicle image:", uploadResult.error);
        }
      }

      // Create vehicle
      const vehicleResult = await supabase
        .from("vehicles")
        .insert({
          ...vehicleData,
          main_image_url: imageUrl,
          user_id: user.id,
        } as any)
        .select()
        .single();

      const { data: vehicle, error: vehicleError } = vehicleResult as any;

      if (vehicleError || !vehicle) {
        console.error("Error creating vehicle:", vehicleError);
        return { data: null, error: vehicleError.message, loading: false };
      }

      // Share with groups if specified
      if (sharedGroupIds && sharedGroupIds.length > 0) {
        const shareResult = await this.shareVehicleWithGroups(
          vehicle.id,
          sharedGroupIds,
        );
        if (shareResult.error) {
          console.error("Error sharing new vehicle:", shareResult.error);
          // Don't fail the creation, just log the sharing error
        }
      }

      console.log("✅ Vehicle created successfully:", vehicle.id);
      return { data: vehicle, error: null, loading: false };
    } catch (error) {
      console.error("Unexpected error creating vehicle:", error);
      return { data: null, error: "Failed to create vehicle", loading: false };
    }
  }

  /**
   * Update vehicle with sharing options
   */
  static async updateVehicle(
    id: string,
    updates: VehicleUpdate,
    sharedGroupIds?: string[],
  ): Promise<ApiResponse<Vehicle>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      // Check if user has access to this vehicle (owner or group member)
      const hasAccess = await this.canUserAccessVehicle(id, user.id);
      if (!hasAccess) {
        // Check if user owns the vehicle
        const { data: vehicle } = await supabase
          .from("vehicles")
          .select("user_id")
          .eq("id", id)
          .single<{ user_id: string }>();

        if (!vehicle || vehicle.user_id !== user.id) {
          return {
            data: null,
            error: "You do not have permission to edit this vehicle",
            loading: false,
          };
        }
      }

      // Check for duplicate license plate if updating
      if (updates.license_plate) {
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

      // Update vehicle
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const vehicleUpdateResult = await (supabase as any)
        .from("vehicles")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      const { data: vehicle, error: vehicleError } = vehicleUpdateResult as any;

      if (vehicleError || !vehicle) {
        console.error("Error updating vehicle:", vehicleError);
        return { data: null, error: vehicleError.message, loading: false };
      }

      // Update sharing if specified
      if (sharedGroupIds !== undefined) {
        const shareResult = await this.shareVehicleWithGroups(
          id,
          sharedGroupIds,
        );
        if (shareResult.error) {
          console.error("Error updating vehicle sharing:", shareResult.error);
          // Don't fail the update, just log the sharing error
        }
      }

      console.log("✅ Vehicle updated successfully:", id);
      return { data: vehicle, error: null, loading: false };
    } catch (error) {
      console.error("Unexpected error updating vehicle:", error);
      return { data: null, error: "Failed to update vehicle", loading: false };
    }
  }

  /**
   * Delete vehicle (and all associated data)
   */
  static async deleteVehicle(id: string): Promise<ApiResponse<boolean>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      // Verify ownership
      const vehicleResult = await supabase
        .from("vehicles")
        .select("user_id")
        .eq("id", id)
        .single();

      const { data: vehicle, error: vehicleError } = vehicleResult as any;

      if (vehicleError || !vehicle) {
        return { data: null, error: "Vehicle not found", loading: false };
      }

      if (vehicle.user_id !== user.id) {
        return {
          data: null,
          error: "You can only delete your own vehicles",
          loading: false,
        };
      }

      // Delete vehicle (cascading will handle related data)
      const { error: deleteError } = await supabase
        .from("vehicles")
        .delete()
        .eq("id", id);

      if (deleteError) {
        console.error("Error deleting vehicle:", deleteError);
        return { data: null, error: deleteError.message, loading: false };
      }

      console.log("✅ Vehicle deleted successfully:", id);
      return { data: true, error: null, loading: false };
    } catch (error) {
      console.error("Unexpected error deleting vehicle:", error);
      return { data: null, error: "Failed to delete vehicle", loading: false };
    }
  }

  /**
   * Get vehicle by ID with full details
   */
  static async getVehicleById(
    id: string,
  ): Promise<ApiResponse<VehicleWithDetails>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      // Get vehicle with logs
      const vehicleResult = await supabase
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

      const { data: vehicle, error: vehicleError } = vehicleResult as any;

      if (vehicleError) {
        console.error("Error fetching vehicle:", vehicleError);
        return { data: null, error: vehicleError.message, loading: false };
      }

      // Check if user can access this vehicle
      const canAccess =
        vehicle.user_id === user.id ||
        (await this.canUserAccessVehicle(id, user.id));

      if (!canAccess) {
        return {
          data: null,
          error: "Vehicle not found or access denied",
          loading: false,
        };
      }

      // Get additional data including record counts and detailed logs
      const [
        imagesResult,
        sharingResult,
        ownerResult,
        recordCountsResult,
        detailedLogsResult,
      ] = await Promise.all([
        supabase
          .from("vehicle_images")
          .select("*")
          .eq("vehicle_id", id)
          .order("image_type", { ascending: true })
          .order("display_order", { ascending: true }),
        vehicle.user_id === user.id
          ? this.getVehicleSharingConfig(id)
          : Promise.resolve({ data: null, error: null, loading: false }),
        vehicle.user_id !== user.id
          ? supabase
              .from("profiles")
              .select("id, email, full_name, avatar_url")
              .eq("id", vehicle.user_id)
              .single()
          : Promise.resolve({ data: null, error: null }),
        this.getVehicleRecordCounts(id),
        this.getVehicleDetailedLogs(id),
      ]);

      const enhancedVehicle: VehicleWithDetails = {
        ...vehicle,
        is_own_vehicle: vehicle.user_id === user.id,
        owner_profile: ownerResult.data || null,
        images: imagesResult.data || [],
        shared_groups:
          sharingResult.data?.shared_groups.map((sg) => ({
            id: sg.group_id,
            name: sg.group_name,
            description: null,
            owner_id: "",
            created_at: "",
            updated_at: "",
          })) || [],
        sharing_info: sharingResult.data
          ? {
              is_shared: sharingResult.data.is_sharing_enabled,
              shared_with_groups: sharingResult.data.shared_groups.map(
                (sg) => sg.group_name,
              ),
              total_shares: sharingResult.data.total_shares,
            }
          : undefined,
        // Use detailed logs from separate queries, fall back to nested query logs
        mileage_logs:
          detailedLogsResult.data?.mileage_logs ||
          (vehicle as any).mileage_logs ||
          [],
        fuel_logs:
          detailedLogsResult.data?.fuel_logs ||
          (vehicle as any).fuel_logs ||
          [],
        service_logs:
          detailedLogsResult.data?.service_logs ||
          (vehicle as any).service_logs ||
          [],
        logs: {
          latest_mileage:
            detailedLogsResult.data?.mileage_logs?.[0] ||
            vehicle.mileage_logs?.[0] ||
            undefined,
          latest_fuel:
            detailedLogsResult.data?.fuel_logs?.[0] ||
            vehicle.fuel_logs?.[0] ||
            undefined,
          latest_service:
            detailedLogsResult.data?.service_logs?.[0] ||
            vehicle.service_logs?.[0] ||
            undefined,
          counts: recordCountsResult.data || {
            fuel_count: 0,
            service_count: 0,
            mileage_count: 0,
          },
        },
      };

      return { data: enhancedVehicle, error: null, loading: false };
    } catch (error) {
      console.error("Unexpected error fetching vehicle:", error);
      return { data: null, error: "Failed to fetch vehicle", loading: false };
    }
  }

  /**
   * Check if user can access a vehicle (through sharing)
   */
  private static async canUserAccessVehicle(
    vehicleId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      // Check if vehicle is shared with any groups the user is a member of
      const sharesResult = await supabase
        .from("vehicle_group_shares")
        .select("group_id")
        .eq("vehicle_id", vehicleId);

      const { data: shares, error } = sharesResult as any;

      if (error || !shares || shares.length === 0) {
        return false;
      }

      const sharedGroupIds = shares.map((share: any) => share.group_id);

      // Check if user is a member of any of these groups
      const membershipsResult = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", userId)
        .in("group_id", sharedGroupIds);

      const { data: memberships, error: membershipError } =
        membershipsResult as any;

      return !membershipError && memberships && memberships.length > 0;
    } catch (error) {
      console.error("Error checking vehicle access:", error);
      return false;
    }
  }

  /**
   * Get vehicle statistics
   */
  static async getVehicleStats(vehicleId: string) {
    try {
      // This method remains largely the same but could be enhanced with sharing awareness

      // Get latest mileage
      const latestMileageResult = await supabase
        .from("mileage_logs")
        .select("odometer_reading")
        .eq("vehicle_id", vehicleId)
        .order("date", { ascending: false })
        .limit(1);

      const { data: latestMileage } = latestMileageResult as any;

      // Get fuel efficiency (last 5 fuel-ups)
      const fuelLogsResult = await supabase
        .from("fuel_logs")
        .select("liters_filled, odometer_reading")
        .eq("vehicle_id", vehicleId)
        .order("date", { ascending: false })
        .limit(5);

      const { data: fuelLogs } = fuelLogsResult as any;

      // Get next service due
      const nextServiceResult = await supabase
        .from("service_logs")
        .select("next_service_due, service_type")
        .eq("vehicle_id", vehicleId)
        .not("next_service_due", "is", null)
        .order("next_service_due", { ascending: true })
        .limit(1);

      const { data: nextService } = nextServiceResult as any;

      return {
        currentMileage: latestMileage?.[0]?.odometer_reading || 0,
        fuelLogs: fuelLogs || [],
        nextService: nextService?.[0] || null,
      };
    } catch (error) {
      console.error("Error fetching vehicle stats:", error);
      return {
        currentMileage: 0,
        fuelLogs: [],
        nextService: null,
      };
    }
  }

  /**
   * Update vehicle's current mileage based on latest mileage log
   */
  static async updateVehicleCurrentMileage(
    vehicleId: string,
  ): Promise<ApiResponse<boolean>> {
    try {
      // Get the latest mileage log
      const latestMileageResult = await supabase
        .from("mileage_logs")
        .select("odometer_reading")
        .eq("vehicle_id", vehicleId)
        .order("date", { ascending: false })
        .limit(1);

      const { data: latestMileage, error: mileageError } =
        latestMileageResult as any;

      if (mileageError) {
        console.error("Error fetching latest mileage:", mileageError);
        return { data: null, error: mileageError.message, loading: false };
      }

      if (latestMileage && latestMileage.length > 0) {
        const newMileage = latestMileage[0].odometer_reading;

        // Update the vehicle's current_mileage
        const updateResult = (supabase as any)
          .from("vehicles")
          .update({ current_mileage: newMileage })
          .eq("id", vehicleId);

        const { error: updateError } = updateResult as any;

        if (updateError) {
          console.error("Error updating current mileage:", updateError);
          return { data: null, error: updateError.message, loading: false };
        }

        console.log(
          `✅ Updated vehicle ${vehicleId} current_mileage to ${newMileage}`,
        );
        return { data: true, error: null, loading: false };
      }

      return { data: true, error: null, loading: false };
    } catch (error) {
      console.error("Unexpected error updating current mileage:", error);
      return {
        data: null,
        error: "Failed to update current mileage",
        loading: false,
      };
    }
  }

  /**
   * Get user's groups for sharing vehicles
   */
  static async getUserGroups(): Promise<ApiResponse<Group[]>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      // Get groups owned by user
      const { data: ownedGroups, error: ownedError } = await supabase
        .from("groups")
        .select("*")
        .eq("owner_id", user.id);

      if (ownedError) {
        console.error("Error fetching owned groups:", ownedError);
        return { data: null, error: ownedError.message, loading: false };
      }

      // Get groups where user is a member
      const memberGroupsResult = await supabase
        .from("group_members")
        .select(
          `
          groups (
            id,
            name,
            description,
            owner_id,
            created_at,
            updated_at
          )
        `,
        )
        .eq("user_id", user.id);

      const { data: memberGroups, error: memberError } =
        memberGroupsResult as any;

      if (memberError) {
        console.error("Error fetching member groups:", memberError);
        return { data: ownedGroups || [], error: null, loading: false };
      }

      // Combine owned and member groups, avoiding duplicates
      const memberGroupData = (memberGroups || [])
        .map((item: any) => item.groups)
        .filter((group: any) => group !== null);

      const allGroups: any[] = [...(ownedGroups || [])];

      // Add member groups that aren't already in owned groups
      memberGroupData.forEach((group: any) => {
        if (!allGroups.find((g: any) => g.id === group.id)) {
          allGroups.push(group);
        }
      });

      return { data: allGroups, error: null, loading: false };
    } catch (error) {
      console.error("Unexpected error fetching user groups:", error);
      return { data: null, error: "Failed to fetch groups", loading: false };
    }
  }

  /**
   * Get record counts for a vehicle (fuel, service, mileage)
   */
  static async getVehicleRecordCounts(vehicleId: string): Promise<
    ApiResponse<{
      fuel_count: number;
      service_count: number;
      mileage_count: number;
      access_status?: {
        fuel_accessible: boolean;
        service_accessible: boolean;
        mileage_accessible: boolean;
        has_permission_issues: boolean;
      };
    }>
  > {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return {
          data: {
            fuel_count: 0,
            service_count: 0,
            mileage_count: 0,
            access_status: {
              fuel_accessible: false,
              service_accessible: false,
              mileage_accessible: false,
              has_permission_issues: true,
            },
          },
          error: "User not authenticated",
          loading: false,
        };
      }

      // Get counts for all log types in parallel
      const [fuelCountResult, serviceCountResult, mileageCountResult] =
        await Promise.all([
          supabase
            .from("fuel_logs")
            .select("id", { count: "exact", head: true })
            .eq("vehicle_id", vehicleId),
          supabase
            .from("service_logs")
            .select("id", { count: "exact", head: true })
            .eq("vehicle_id", vehicleId),
          supabase
            .from("mileage_logs")
            .select("id", { count: "exact", head: true })
            .eq("vehicle_id", vehicleId),
        ]);

      // Check for permission-related errors (like RLS policy violations)
      const isPermissionError = (error: any) => {
        return (
          error &&
          (error.message?.includes("permission") ||
            error.message?.includes("policy") ||
            error.message?.includes("RLS") ||
            error.code === "PGRST116") // PostgREST insufficient privilege error
        );
      };

      const access_status = {
        fuel_accessible: !fuelCountResult.error,
        service_accessible: !serviceCountResult.error,
        mileage_accessible: !mileageCountResult.error,
        has_permission_issues:
          isPermissionError(fuelCountResult.error) ||
          isPermissionError(serviceCountResult.error) ||
          isPermissionError(mileageCountResult.error),
      };

      const counts = {
        fuel_count: fuelCountResult.count || 0,
        service_count: serviceCountResult.count || 0,
        mileage_count: mileageCountResult.count || 0,
        access_status,
      };

      // Log errors with appropriate context
      if (fuelCountResult.error) {
        const errorType = isPermissionError(fuelCountResult.error)
          ? "Permission denied"
          : "Database error";
        console.warn(
          `${errorType} for fuel logs on vehicle ${vehicleId}:`,
          fuelCountResult.error,
        );
      }
      if (serviceCountResult.error) {
        const errorType = isPermissionError(serviceCountResult.error)
          ? "Permission denied"
          : "Database error";
        console.warn(
          `${errorType} for service logs on vehicle ${vehicleId}:`,
          serviceCountResult.error,
        );
      }
      if (mileageCountResult.error) {
        const errorType = isPermissionError(mileageCountResult.error)
          ? "Permission denied"
          : "Database error";
        console.warn(
          `${errorType} for mileage logs on vehicle ${vehicleId}:`,
          mileageCountResult.error,
        );
      }

      return { data: counts, error: null, loading: false };
    } catch (error) {
      console.error("Unexpected error fetching vehicle record counts:", error);
      return {
        data: {
          fuel_count: 0,
          service_count: 0,
          mileage_count: 0,
          access_status: {
            fuel_accessible: false,
            service_accessible: false,
            mileage_accessible: false,
            has_permission_issues: true,
          },
        },
        error: "Failed to fetch record counts",
        loading: false,
      };
    }
  }

  /**
   * Get detailed logs for a vehicle using separate queries (for RLS compatibility)
   */
  static async getVehicleDetailedLogs(vehicleId: string): Promise<
    ApiResponse<{
      mileage_logs: any[];
      fuel_logs: any[];
      service_logs: any[];
    }>
  > {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return {
          data: { mileage_logs: [], fuel_logs: [], service_logs: [] },
          error: null,
          loading: false,
        };
      }

      // Get detailed logs for all types in parallel using direct queries
      // This ensures RLS policies work consistently with the count queries
      const [mileageLogsResult, fuelLogsResult, serviceLogsResult] =
        await Promise.all([
          supabase
            .from("mileage_logs")
            .select("*")
            .eq("vehicle_id", vehicleId)
            .order("date", { ascending: false })
            .limit(10), // Get recent 10 records
          supabase
            .from("fuel_logs")
            .select("*")
            .eq("vehicle_id", vehicleId)
            .order("date", { ascending: false })
            .limit(10), // Get recent 10 records
          supabase
            .from("service_logs")
            .select("*")
            .eq("vehicle_id", vehicleId)
            .order("date", { ascending: false })
            .limit(10), // Get recent 10 records
        ]);

      const logs = {
        mileage_logs: mileageLogsResult.data || [],
        fuel_logs: fuelLogsResult.data || [],
        service_logs: serviceLogsResult.data || [],
      };

      // Log any errors but don't fail completely - graceful degradation
      if (mileageLogsResult.error) {
        console.warn(
          `Could not fetch mileage logs for vehicle ${vehicleId}:`,
          mileageLogsResult.error,
        );
      }
      if (fuelLogsResult.error) {
        console.warn(
          `Could not fetch fuel logs for vehicle ${vehicleId}:`,
          fuelLogsResult.error,
        );
      }
      if (serviceLogsResult.error) {
        console.warn(
          `Could not fetch service logs for vehicle ${vehicleId}:`,
          serviceLogsResult.error,
        );
      }

      return { data: logs, error: null, loading: false };
    } catch (error) {
      console.error("Unexpected error fetching vehicle detailed logs:", error);
      return {
        data: { mileage_logs: [], fuel_logs: [], service_logs: [] },
        error: null,
        loading: false,
      };
    }
  }

  // =================
  // SERVICE TEMPLATES
  // =================

  /**
   * Get all service templates
   */
  static async getServiceTemplates(): Promise<ApiResponse<ServiceTemplate[]>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      console.log("🔍 Fetching service templates for user:", user.id);

      // Get templates with their items
      const templatesResult = await supabase
        .from("service_templates")
        .select(
          `
          *,
          service_template_items(*)
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const { data: templates, error: templatesError } = templatesResult as any;

      if (templatesError) {
        console.error("❌ Error fetching service templates:", templatesError);
        return { data: null, error: templatesError.message, loading: false };
      }

      // Transform the data to match our ServiceTemplate interface
      const serviceTemplates: ServiceTemplate[] = (templates || []).map(
        (template: any) => ({
          id: template.id,
          name: template.name,
          description: template.description || "",
          items: (template.service_template_items || [])
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((item: any) => ({
              id: item.id,
              description: item.description,
              price: parseFloat(item.price),
              order: item.display_order,
            })),
          total_cost: parseFloat(template.total_cost),
          created_at: template.created_at,
          updated_at: template.updated_at,
        }),
      );

      console.log("✅ Service templates fetched:", serviceTemplates.length);
      return {
        data: serviceTemplates,
        error: null,
        loading: false,
      };
    } catch (error) {
      console.error("💥 Error fetching service templates:", error);
      return {
        data: null,
        error: "Failed to fetch service templates",
        loading: false,
      };
    }
  }

  /**
   * Get a service template by ID
   */
  static async getServiceTemplate(
    id: string,
  ): Promise<ApiResponse<ServiceTemplate>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      console.log("🔍 Fetching service template:", id);

      // Get template with its items
      const templateResult = await supabase
        .from("service_templates")
        .select(
          `
          *,
          service_template_items(*)
        `,
        )
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      const { data: template, error: templateError } = templateResult as any;

      if (templateError) {
        console.error("❌ Error fetching service template:", templateError);
        return {
          data: null,
          error:
            templateError.code === "PGRST116"
              ? "Service template not found"
              : templateError.message,
          loading: false,
        };
      }

      if (!template) {
        return {
          data: null,
          error: "Service template not found",
          loading: false,
        };
      }

      // Transform the data to match our ServiceTemplate interface
      const serviceTemplate: ServiceTemplate = {
        id: template.id,
        name: template.name,
        description: template.description || "",
        items: (template.service_template_items || [])
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((item: any) => ({
            id: item.id,
            description: item.description,
            price: parseFloat(item.price),
            order: item.display_order,
          })),
        total_cost: parseFloat(template.total_cost),
        created_at: template.created_at,
        updated_at: template.updated_at,
      };

      return {
        data: serviceTemplate,
        error: null,
        loading: false,
      };
    } catch (error) {
      console.error("💥 Error fetching service template:", error);
      return {
        data: null,
        error: "Failed to fetch service template",
        loading: false,
      };
    }
  }

  /**
   * Create a new service template with default 2 rows
   */
  static async createServiceTemplate(
    formData: ServiceTemplateFormData,
  ): Promise<ApiResponse<ServiceTemplate>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      console.log("🔄 Creating service template:", formData.name);

      // Ensure at least 2 rows (default)
      const items =
        formData.items.length > 0
          ? formData.items
          : [
              { description: "", price: 0 },
              { description: "", price: 0 },
            ];

      // Create the template first
      const templateResult = await (supabase as any)
        .from("service_templates")
        .insert({
          user_id: user.id,
          name: formData.name,
          description: formData.description || "",
          total_cost: 0, // Will be updated by trigger
        })
        .select()
        .single();

      const { data: template, error: templateError } = templateResult as any;

      if (templateError || !template) {
        console.error("❌ Error creating service template:", templateError);
        return { data: null, error: templateError.message, loading: false };
      }

      // Create the template items
      if (items.length > 0) {
        const templateItems = items.map((item, index) => ({
          template_id: template.id,
          description: item.description,
          price: item.price,
          display_order: index + 1,
        }));

        const itemsResult = (supabase as any)
          .from("service_template_items")
          .insert(templateItems);

        const { error: itemsError } = itemsResult as any;

        if (itemsError) {
          // If items creation fails, clean up the template
          await supabase
            .from("service_templates")
            .delete()
            .eq("id", template.id);
          console.error(
            "❌ Error creating service template items:",
            itemsError,
          );
          return { data: null, error: itemsError.message, loading: false };
        }
      }

      // Fetch the complete template with items
      const createdTemplate = await this.getServiceTemplate(template.id);

      if (createdTemplate.error || !createdTemplate.data) {
        return {
          data: null,
          error: createdTemplate.error || "Failed to fetch created template",
          loading: false,
        };
      }

      console.log("✅ Service template created successfully:", template.id);
      return {
        data: createdTemplate.data,
        error: null,
        loading: false,
      };
    } catch (error) {
      console.error("💥 Error creating service template:", error);
      return {
        data: null,
        error: "Failed to create service template",
        loading: false,
      };
    }
  }

  /**
   * Update a service template with automatic cost calculation
   */
  static async updateServiceTemplate(
    id: string,
    formData: ServiceTemplateFormData,
  ): Promise<ApiResponse<ServiceTemplate>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      console.log("🔄 Updating service template:", id);

      // First, verify the template exists and belongs to the user
      const { data: existingTemplate, error: templateError } = await supabase
        .from("service_templates")
        .select("id")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (templateError || !existingTemplate) {
        return {
          data: null,
          error: "Service template not found",
          loading: false,
        };
      }

      // Update the template
      const updateResult = await (supabase as any)
        .from("service_templates")
        .update({
          name: formData.name,
          description: formData.description || "",
        })
        .eq("id", id);

      const { error: updateError } = updateResult;

      if (updateError) {
        console.error("❌ Error updating service template:", updateError);
        return { data: null, error: updateError.message, loading: false };
      }

      // Delete existing items
      const { error: deleteItemsError } = await supabase
        .from("service_template_items")
        .delete()
        .eq("template_id", id);

      if (deleteItemsError) {
        console.error(
          "❌ Error deleting old template items:",
          deleteItemsError,
        );
        return { data: null, error: deleteItemsError.message, loading: false };
      }

      // Create new items
      if (formData.items.length > 0) {
        const templateItems = formData.items.map((item, index) => ({
          template_id: id,
          description: item.description,
          price: item.price,
          display_order: index + 1,
        }));

        const itemsResult = await (supabase as any)
          .from("service_template_items")
          .insert(templateItems);

        const { error: itemsError } = itemsResult;

        if (itemsError) {
          console.error("❌ Error creating new template items:", itemsError);
          return { data: null, error: itemsError.message, loading: false };
        }
      }

      // Fetch the updated template with items
      const updatedTemplate = await this.getServiceTemplate(id);

      if (updatedTemplate.error || !updatedTemplate.data) {
        return {
          data: null,
          error: updatedTemplate.error || "Failed to fetch updated template",
          loading: false,
        };
      }

      console.log("✅ Service template updated successfully:", id);
      return {
        data: updatedTemplate.data,
        error: null,
        loading: false,
      };
    } catch (error) {
      console.error("💥 Error updating service template:", error);
      return {
        data: null,
        error: "Failed to update service template",
        loading: false,
      };
    }
  }

  /**
   * Delete a service template
   */
  static async deleteServiceTemplate(
    id: string,
  ): Promise<ApiResponse<boolean>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      console.log("🗑️ Deleting service template:", id);

      // Delete the template (cascade will handle items)
      const { error: deleteError } = await supabase
        .from("service_templates")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("❌ Error deleting service template:", deleteError);
        return { data: null, error: deleteError.message, loading: false };
      }

      console.log("✅ Service template deleted successfully:", id);
      return {
        data: true,
        error: null,
        loading: false,
      };
    } catch (error) {
      console.error("💥 Error deleting service template:", error);
      return {
        data: null,
        error: "Failed to delete service template",
        loading: false,
      };
    }
  }

  /**
   * Create default service template structure (2 empty rows)
   */
  static createDefaultTemplate(): ServiceTemplateFormData {
    return {
      name: "",
      description: "",
      items: [
        { description: "", price: 0 },
        { description: "", price: 0 },
      ],
    };
  }

  /**
   * Calculate total cost from service items
   */
  static calculateTotalCost(items: { price: number }[]): number {
    return items.reduce((sum, item) => sum + (item.price || 0), 0);
  }
}
