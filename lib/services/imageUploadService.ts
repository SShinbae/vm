import { logger } from "@/lib/utils/logger";
import { supabase } from "../../services/supabaseClient";
import {
  ApiResponse,
  VehicleImage,
  VehicleImageInsert,
} from "../../types/database-v2";
import { canUserAccessVehicle } from "../utils/serviceUtils";

export class ImageUploadService {
  // Maximum file size (5MB)
  private static MAX_FILE_SIZE = 5 * 1024 * 1024;

  // Allowed image types
  private static ALLOWED_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  /**
   * Validate image file before upload
   */
  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size too large. Maximum size is ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error:
          "Invalid file type. Please upload JPEG, PNG, or WebP images only.",
      };
    }

    return { isValid: true };
  }

  /**
   * Generate unique filename for upload
   */
  private static generateFileName(
    userId: string,
    type: string,
    originalName: string,
  ): string {
    const timestamp = Date.now();
    const extension = originalName.split(".").pop()?.toLowerCase() || "jpg";
    const randomId = Math.random().toString(36).substring(2, 15);

    return `${userId}/${type}_${timestamp}_${randomId}.${extension}`;
  }

  /**
   * Upload profile avatar
   */
  static async uploadProfileAvatar(file: File): Promise<ApiResponse<string>> {
    try {
      logger.log("🚀 Starting avatar upload process...");
      logger.log("📄 File details:", {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      });

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        logger.error("❌ User authentication failed:", userError);
        return { data: null, error: "User not authenticated", loading: false };
      }

      logger.log("✅ User authenticated:", user.id);

      // Validate file
      const validation = this.validateImageFile(file);
      if (!validation.isValid) {
        logger.error("❌ File validation failed:", validation.error);
        return { data: null, error: validation.error!, loading: false };
      }

      logger.log("✅ File validation passed");

      // Generate filename
      const fileName = this.generateFileName(user.id, "avatar", file.name);
      logger.log("📝 Generated filename:", fileName);

      // Upload to storage
      logger.log("📤 Uploading to Supabase storage...");
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("profile-avatars")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        logger.error("❌ Storage upload failed:", uploadError);
        logger.error("   Error details:", {
          message: uploadError.message,
          statusCode: (uploadError as any).statusCode,
          error: (uploadError as any).error,
        });
        return { data: null, error: uploadError.message, loading: false };
      }

      logger.log("✅ Storage upload successful:", uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("profile-avatars")
        .getPublicUrl(fileName);

      logger.log("🔗 Generated public URL:", urlData.publicUrl);

      // Update user profile with new avatar URL
      logger.log("💾 Updating profile in database...");
      const { error: updateError } = await supabase
        .from("profiles")
        // @ts-expect-error - Supabase type inference issue with update
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", user.id);

      if (updateError) {
        logger.error("❌ Profile update failed:", updateError);
        // Try to cleanup uploaded file
        await supabase.storage.from("profile-avatars").remove([fileName]);
        return { data: null, error: updateError.message, loading: false };
      }

      logger.log("✅ Avatar upload complete! URL:", urlData.publicUrl);
      return { data: urlData.publicUrl, error: null, loading: false };
    } catch (error) {
      logger.error("💥 Unexpected error uploading avatar:", error);
      return { data: null, error: "Failed to upload avatar", loading: false };
    }
  }

  /**
   * Upload profile avatar from URI (for mobile platforms)
   * This method handles the URI directly without converting to File object
   * to avoid ArrayBuffer blob issues on React Native
   */
  static async uploadProfileAvatarFromUri(
    uri: string,
  ): Promise<ApiResponse<string>> {
    try {
      logger.log("🚀 Starting avatar upload from URI...");
      logger.log("📄 URI:", uri);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        logger.error("❌ User authentication failed:", userError);
        return { data: null, error: "User not authenticated", loading: false };
      }

      logger.log("✅ User authenticated:", user.id);

      // Fetch the image and convert to base64
      const response = await fetch(uri);
      const blob = await response.blob();

      // Convert blob to base64 using FileReader
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64Data = base64String.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Get file extension from URI or default to jpg
      const fileExtension = uri.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = this.generateFileName(
        user.id,
        "avatar",
        `image.${fileExtension}`,
      );

      logger.log("📝 Generated filename:", fileName);

      // Upload using base64 data
      logger.log("📤 Uploading to Supabase storage...");
      const { decode } = await import("base64-arraybuffer");
      const arrayBuffer = decode(base64);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("profile-avatars")
        .upload(fileName, arrayBuffer, {
          contentType: blob.type || "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        logger.error("❌ Storage upload failed:", uploadError);
        return { data: null, error: uploadError.message, loading: false };
      }

      logger.log("✅ Storage upload successful:", uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("profile-avatars")
        .getPublicUrl(fileName);

      logger.log("🔗 Generated public URL:", urlData.publicUrl);

      // Update user profile with new avatar URL
      logger.log("💾 Updating profile in database...");
      const { error: updateError } = await supabase
        .from("profiles")
        // @ts-expect-error - Supabase type inference issue with update
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", user.id);

      if (updateError) {
        logger.error("❌ Profile update failed:", updateError);
        // Try to cleanup uploaded file
        await supabase.storage.from("profile-avatars").remove([fileName]);
        return { data: null, error: updateError.message, loading: false };
      }

      logger.log("✅ Avatar upload complete! URL:", urlData.publicUrl);
      return { data: urlData.publicUrl, error: null, loading: false };
    } catch (error) {
      logger.error("💥 Unexpected error uploading avatar from URI:", error);
      return { data: null, error: "Failed to upload avatar", loading: false };
    }
  }

  /**
   * Upload vehicle image
   */
  static async uploadVehicleImage(
    vehicleId: string,
    file: File,
    imageType: "vehicle_main" | "vehicle_gallery" = "vehicle_gallery",
    caption?: string,
  ): Promise<ApiResponse<VehicleImage>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      // Verify user owns the vehicle
      const { data: vehicle, error: vehicleError } = await supabase
        .from("vehicles")
        .select("user_id")
        .eq("id", vehicleId)
        .single<{ user_id: string }>();

      if (vehicleError || !vehicle) {
        return { data: null, error: "Vehicle not found", loading: false };
      }

      if (vehicle.user_id !== user.id) {
        return {
          data: null,
          error: "You can only upload images for your own vehicles",
          loading: false,
        };
      }

      // Validate file
      const validation = this.validateImageFile(file);
      if (!validation.isValid) {
        return { data: null, error: validation.error!, loading: false };
      }

      // Generate filename
      const fileName = this.generateFileName(
        user.id,
        `vehicle_${vehicleId}`,
        file.name,
      );

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("vehicle-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        logger.error("Error uploading vehicle image:", uploadError);
        return { data: null, error: uploadError.message, loading: false };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("vehicle-images")
        .getPublicUrl(fileName);

      // Get next display order for gallery images
      let displayOrder = 0;
      if (imageType === "vehicle_gallery") {
        const { data: existingImages } = await supabase
          .from("vehicle_images")
          .select("display_order")
          .eq("vehicle_id", vehicleId)
          .eq("image_type", "vehicle_gallery")
          .order("display_order", { ascending: false })
          .limit(1);

        // @ts-expect-error - Supabase type inference issue with select
        displayOrder = (existingImages?.[0]?.display_order || 0) + 1;
      }

      // Create vehicle image record
      const imageData: VehicleImageInsert = {
        vehicle_id: vehicleId,
        image_url: urlData.publicUrl,
        image_type: imageType,
        caption: caption || null,
        display_order: displayOrder,
        uploaded_by: user.id,
      };

      const { data: imageRecord, error: imageError } = await supabase
        .from("vehicle_images")
        // @ts-expect-error - Supabase type inference issue with insert
        .insert(imageData)
        .select()
        .single();

      if (imageError) {
        logger.error("Error creating image record:", imageError);
        // Try to cleanup uploaded file
        await supabase.storage.from("vehicle-images").remove([fileName]);
        return { data: null, error: imageError.message, loading: false };
      }

      // If this is a main image, update vehicle record
      if (imageType === "vehicle_main") {
        const { error: vehicleUpdateError } = await supabase
          .from("vehicles")
          // @ts-expect-error - Supabase type inference issue with update
          .update({ main_image_url: urlData.publicUrl })
          .eq("id", vehicleId);

        if (vehicleUpdateError) {
          logger.error(
            "Error updating vehicle main image:",
            vehicleUpdateError,
          );
          // Continue anyway, the image record was created successfully
        }
      }

      logger.log("✅ Vehicle image uploaded successfully:", urlData.publicUrl);
      return { data: imageRecord, error: null, loading: false };
    } catch (error) {
      logger.error("Unexpected error uploading vehicle image:", error);
      return {
        data: null,
        error: "Failed to upload vehicle image",
        loading: false,
      };
    }
  }

  /**
   * Upload vehicle image from URI (for mobile platforms)
   * This method handles the URI directly without converting to File object
   * to avoid ArrayBuffer blob issues on React Native
   */
  static async uploadVehicleImageFromUri(
    vehicleId: string,
    uri: string,
    imageType: "vehicle_main" | "vehicle_gallery" = "vehicle_gallery",
    caption?: string,
  ): Promise<ApiResponse<VehicleImage>> {
    try {
      logger.log("🚀 Starting vehicle image upload from URI...");
      logger.log("📄 URI:", uri);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      // Verify user owns the vehicle
      const { data: vehicle, error: vehicleError } = await supabase
        .from("vehicles")
        .select("user_id")
        .eq("id", vehicleId)
        .single<{ user_id: string }>();

      if (vehicleError || !vehicle) {
        return { data: null, error: "Vehicle not found", loading: false };
      }

      if (vehicle.user_id !== user.id) {
        return {
          data: null,
          error: "You can only upload images for your own vehicles",
          loading: false,
        };
      }

      // Fetch the image and convert to base64
      const response = await fetch(uri);
      const blob = await response.blob();

      // Convert blob to base64 using FileReader
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Get file extension from URI or default to jpg
      const fileExtension = uri.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = this.generateFileName(
        user.id,
        `vehicle_${vehicleId}`,
        `image.${fileExtension}`,
      );

      logger.log("📝 Generated filename:", fileName);

      // Upload using base64 data
      logger.log("📤 Uploading to Supabase storage...");
      const { decode } = await import("base64-arraybuffer");
      const arrayBuffer = decode(base64);

      const { error: uploadError } = await supabase.storage
        .from("vehicle-images")
        .upload(fileName, arrayBuffer, {
          contentType: blob.type || "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        logger.error("Error uploading vehicle image:", uploadError);
        return { data: null, error: uploadError.message, loading: false };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("vehicle-images")
        .getPublicUrl(fileName);

      // Get next display order for gallery images
      let displayOrder = 0;
      if (imageType === "vehicle_gallery") {
        const { data: existingImages } = await supabase
          .from("vehicle_images")
          .select("display_order")
          .eq("vehicle_id", vehicleId)
          .eq("image_type", "vehicle_gallery")
          .order("display_order", { ascending: false })
          .limit(1);

        // @ts-expect-error - Supabase type inference issue with select
        displayOrder = (existingImages?.[0]?.display_order || 0) + 1;
      }

      // Create vehicle image record
      const imageData: VehicleImageInsert = {
        vehicle_id: vehicleId,
        image_url: urlData.publicUrl,
        image_type: imageType,
        caption: caption || null,
        display_order: displayOrder,
        uploaded_by: user.id,
      };

      const { data: imageRecord, error: imageError } = await supabase
        .from("vehicle_images")
        // @ts-expect-error - Supabase type inference issue with insert
        .insert(imageData)
        .select()
        .single();

      if (imageError) {
        logger.error("Error creating image record:", imageError);
        // Try to cleanup uploaded file
        await supabase.storage.from("vehicle-images").remove([fileName]);
        return { data: null, error: imageError.message, loading: false };
      }

      // If this is a main image, update vehicle record
      if (imageType === "vehicle_main") {
        const { error: vehicleUpdateError } = await supabase
          .from("vehicles")
          // @ts-expect-error - Supabase type inference issue with update
          .update({ main_image_url: urlData.publicUrl })
          .eq("id", vehicleId);

        if (vehicleUpdateError) {
          logger.error(
            "Error updating vehicle main image:",
            vehicleUpdateError,
          );
          // Continue anyway, the image record was created successfully
        }
      }

      logger.log("✅ Vehicle image uploaded successfully:", urlData.publicUrl);
      return { data: imageRecord, error: null, loading: false };
    } catch (error) {
      logger.error("Unexpected error uploading vehicle image from URI:", error);
      return {
        data: null,
        error: "Failed to upload vehicle image",
        loading: false,
      };
    }
  }

  /**
   * Get vehicle images
   */
  static async getVehicleImages(
    vehicleId: string,
  ): Promise<ApiResponse<VehicleImage[]>> {
    try {
      const { data, error } = await supabase
        .from("vehicle_images")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .order("image_type", { ascending: true }) // main images first
        .order("display_order", { ascending: true });

      if (error) {
        logger.error("Error fetching vehicle images:", error);
        return { data: null, error: error.message, loading: false };
      }

      return { data: data || [], error: null, loading: false };
    } catch (error) {
      logger.error("Unexpected error fetching vehicle images:", error);
      return {
        data: null,
        error: "Failed to fetch vehicle images",
        loading: false,
      };
    }
  }

  /**
   * Delete vehicle image
   */
  static async deleteVehicleImage(
    imageId: string,
  ): Promise<ApiResponse<boolean>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      // Get image record to verify ownership and get storage path
      const { data: imageRecord, error: imageError } = await supabase
        .from("vehicle_images")
        .select(
          `
          *,
          vehicles!inner(user_id)
        `,
        )
        .eq("id", imageId)
        .single();

      if (imageError || !imageRecord) {
        return { data: null, error: "Image not found", loading: false };
      }

      // Check if user has access to this vehicle (owner or group member)
      const vehicleId = (imageRecord as any).vehicle_id;
      const hasAccess = await canUserAccessVehicle(vehicleId, user.id);

      if (!hasAccess) {
        return {
          data: null,
          error: "You do not have permission to delete this image",
          loading: false,
        };
      }

      // Extract filename from URL
      const url = new URL((imageRecord as any).image_url);
      const pathParts = url.pathname.split("/");
      const fileName = pathParts[pathParts.length - 1];
      const fullPath = `${user.id}/${fileName}`;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("vehicle-images")
        .remove([fullPath]);

      if (storageError) {
        logger.error("Error deleting from storage:", storageError);
        // Continue with database deletion even if storage fails
      }

      // Delete database record
      const { error: deleteError } = await supabase
        .from("vehicle_images")
        .delete()
        .eq("id", imageId);

      if (deleteError) {
        logger.error("Error deleting image record:", deleteError);
        return { data: null, error: deleteError.message, loading: false };
      }

      // If this was a main image, clear vehicle's main_image_url
      if ((imageRecord as any).image_type === "vehicle_main") {
        await supabase
          .from("vehicles")
          // @ts-expect-error - Supabase type inference issue with update
          .update({ main_image_url: null })
          .eq("id", (imageRecord as any).vehicle_id);
      }

      logger.log("✅ Vehicle image deleted successfully");
      return { data: true, error: null, loading: false };
    } catch (error) {
      logger.error("Unexpected error deleting vehicle image:", error);
      return {
        data: null,
        error: "Failed to delete vehicle image",
        loading: false,
      };
    }
  }

  /**
   * Update image caption and order
   */
  static async updateVehicleImage(
    imageId: string,
    updates: { caption?: string; display_order?: number },
  ): Promise<ApiResponse<VehicleImage>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      // Verify ownership through vehicle
      const { data: imageRecord, error: checkError } = await supabase
        .from("vehicle_images")
        .select(
          `
          *,
          vehicles!inner(user_id)
        `,
        )
        .eq("id", imageId)
        .single();

      if (checkError || !imageRecord) {
        return { data: null, error: "Image not found", loading: false };
      }

      // Check if user has access to this vehicle (owner or group member)
      const vehicleId = (imageRecord as any).vehicle_id;
      const hasAccess = await canUserAccessVehicle(vehicleId, user.id);

      if (!hasAccess) {
        return {
          data: null,
          error: "You do not have permission to modify this image",
          loading: false,
        };
      }

      // Update image record
      const { data: updatedImage, error: updateError } = await supabase
        .from("vehicle_images")
        // @ts-expect-error - Supabase type inference issue with update
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", imageId)
        .select()
        .single();

      if (updateError) {
        logger.error("Error updating vehicle image:", updateError);
        return { data: null, error: updateError.message, loading: false };
      }

      return { data: updatedImage, error: null, loading: false };
    } catch (error) {
      logger.error("Unexpected error updating vehicle image:", error);
      return {
        data: null,
        error: "Failed to update vehicle image",
        loading: false,
      };
    }
  }

  /**
   * Delete profile avatar
   */
  static async deleteProfileAvatar(): Promise<ApiResponse<boolean>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      // Get current avatar URL
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single<{ avatar_url: string | null }>();

      if (profileError || !profile?.avatar_url) {
        return { data: null, error: "No avatar to delete", loading: false };
      }

      // Extract filename from URL
      const url = new URL(profile.avatar_url);
      const pathParts = url.pathname.split("/");
      const fileName = pathParts[pathParts.length - 1];
      const fullPath = `${user.id}/${fileName}`;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("profile-avatars")
        .remove([fullPath]);

      if (storageError) {
        logger.error("Error deleting avatar from storage:", storageError);
        // Continue with database update even if storage fails
      }

      // Update profile to remove avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        // @ts-expect-error - Supabase type inference issue with update
        .update({ avatar_url: null })
        .eq("id", user.id);

      if (updateError) {
        logger.error("Error updating profile:", updateError);
        return { data: null, error: updateError.message, loading: false };
      }

      logger.log("✅ Profile avatar deleted successfully");
      return { data: true, error: null, loading: false };
    } catch (error) {
      logger.error("Unexpected error deleting avatar:", error);
      return { data: null, error: "Failed to delete avatar", loading: false };
    }
  }

  /**
   * Get image dimensions and metadata
   */
  static getImageMetadata(file: File): Promise<{
    width: number;
    height: number;
    size: number;
    type: string;
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          size: file.size,
          type: file.type,
        });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Compress image before upload (optional utility)
   */
  static compressImage(
    file: File,
    maxWidth: number = 1200,
    quality: number = 0.8,
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        const newWidth = img.width * ratio;
        const newHeight = img.height * ratio;

        // Set canvas size
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, newWidth, newHeight);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error("Failed to compress image"));
            }
          },
          file.type,
          quality,
        );
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
}
