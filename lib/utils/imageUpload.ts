// import { supabase } from '../lib/supabaseClient';
import { decode } from "base64-arraybuffer";
import { Platform } from "react-native";
import { supabase } from "../../services/supabaseClient";

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload an image to Supabase Storage
 * @param uri - The local URI of the image
 * @param bucket - The storage bucket name (default: 'vehicle-images')
 * @param folder - Optional folder path within the bucket
 * @returns Upload result with public URL or error
 */
export async function uploadImage(
  uri: string,
  bucket: string = "vehicle-images",
  folder?: string,
): Promise<ImageUploadResult> {
  try {
    if (!uri) {
      return { success: false, error: "No image URI provided" };
    }

    // Validate URI format - reject file:// URIs on web
    if (Platform.OS === "web" && uri.startsWith("file://")) {
      console.error("❌ Cannot upload file:// URI on web:", uri);
      return {
        success: false,
        error:
          "Invalid image format. File URIs cannot be uploaded from web browsers. Please try selecting the image again.",
      };
    }

    // Additional validation for web - check for blob URLs that might be invalid
    if (
      Platform.OS === "web" &&
      uri.startsWith("blob:") &&
      !uri.includes("://")
    ) {
      console.error("❌ Invalid blob URI on web:", uri);
      return {
        success: false,
        error: "Invalid image format. Please try selecting the image again.",
      };
    }

    let fileData: ArrayBuffer | Blob;
    let fileExtension = "jpg";
    let mimeType = "image/jpeg";

    if (Platform.OS === "web") {
      // For web, fetch the blob
      // Handle both blob URLs (blob:http://...) and data URLs
      console.log("🌐 Fetching blob from URI:", uri.substring(0, 60) + "...");

      try {
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        fileData = await response.blob();
      } catch (fetchError: any) {
        console.error("❌ Failed to fetch image blob:", fetchError);
        return {
          success: false,
          error: `Failed to fetch image: ${fetchError.message}`,
        };
      }

      // Get MIME type from blob (e.g., "image/jpeg", "image/png")
      mimeType = fileData.type || "image/jpeg";

      // Extract file extension from MIME type
      const mimeToExtension: { [key: string]: string } = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/gif": "gif",
        "image/webp": "webp",
        "image/svg+xml": "svg",
      };

      fileExtension =
        mimeToExtension[mimeType] || mimeType.split("/")[1] || "jpg";

      console.log("✅ Web image blob fetched successfully:", {
        size: fileData.size,
        type: fileData.type,
        mimeType,
        fileExtension,
        uri: uri.substring(0, 60) + "...",
      });
    } else {
      // For mobile, read as base64 and convert to ArrayBuffer
      // Extract extension from URI for mobile
      fileExtension = uri.split(".").pop()?.toLowerCase() || "jpg";
      mimeType = `image/${fileExtension === "jpg" ? "jpeg" : fileExtension}`;

      const base64Response = await fetch(uri);
      const blob = await base64Response.blob();

      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(",")[1]; // Remove data:image/...;base64, prefix
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const base64Data = await base64Promise;
      fileData = decode(base64Data);
    }

    // Generate unique filename with correct extension
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    console.log("📤 Uploading to Supabase Storage:", {
      bucket,
      fileName,
      filePath,
      mimeType,
      size: fileData instanceof Blob ? fileData.size : fileData.byteLength,
    });

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileData, {
        contentType: mimeType,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("❌ Supabase upload error:", error);
      return { success: false, error: error.message };
    }

    console.log("✅ Upload successful! File path:", data?.path);

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      console.error("❌ Failed to get public URL");
      return { success: false, error: "Failed to get public URL" };
    }

    console.log("✅ Public URL generated:", publicUrlData.publicUrl);

    return {
      success: true,
      url: publicUrlData.publicUrl,
    };
  } catch (error: any) {
    console.error("Image upload error:", error);
    return {
      success: false,
      error: error.message || "Failed to upload image",
    };
  }
}

/**
 * Delete an image from Supabase Storage
 * @param url - The public URL of the image
 * @param bucket - The storage bucket name (default: 'vehicle-images')
 * @returns Success boolean
 */
export async function deleteImage(
  url: string,
  bucket: string = "vehicle-images",
): Promise<boolean> {
  try {
    if (!url) return false;

    // Extract file path from URL
    const urlParts = url.split(`/${bucket}/`);
    if (urlParts.length < 2) {
      console.error("Invalid image URL");
      return false;
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      console.error("Error deleting image:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Delete image error:", error);
    return false;
  }
}

/**
 * Update vehicle image - upload new and optionally delete old
 * @param newImageUri - URI of the new image
 * @param oldImageUrl - URL of the old image to delete (optional)
 * @param vehicleId - ID of the vehicle for folder organization
 * @returns Upload result
 */
export async function updateVehicleImage(
  newImageUri: string,
  oldImageUrl?: string | null,
  vehicleId?: string,
): Promise<ImageUploadResult> {
  try {
    // Upload new image
    const folder = vehicleId ? `vehicle_${vehicleId}` : "vehicles";
    const uploadResult = await uploadImage(
      newImageUri,
      "vehicle-images",
      folder,
    );

    if (!uploadResult.success) {
      return uploadResult;
    }

    // Delete old image if exists
    if (oldImageUrl) {
      await deleteImage(oldImageUrl, "vehicle-images");
    }

    return uploadResult;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to update vehicle image",
    };
  }
}
