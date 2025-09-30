// import { supabase } from '../lib/supabaseClient';
import { decode } from 'base64-arraybuffer';
import { Platform } from 'react-native';
import { supabase } from '../../services/supabaseClient';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload an image to Supabase Storage
 * @param uri - The local URI of the image
 * @param bucket - The storage bucket name (default: 'vehicles')
 * @param folder - Optional folder path within the bucket
 * @returns Upload result with public URL or error
 */
export async function uploadImage(
  uri: string,
  bucket: string = 'vehicles',
  folder?: string
): Promise<ImageUploadResult> {
  try {
    if (!uri) {
      return { success: false, error: 'No image URI provided' };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExtension = uri.split('.').pop() || 'jpg';
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    let fileData: ArrayBuffer | Blob;

    if (Platform.OS === 'web') {
      // For web, fetch the blob
      const response = await fetch(uri);
      fileData = await response.blob();
    } else {
      // For mobile, read as base64 and convert to ArrayBuffer
      const base64Response = await fetch(uri);
      const blob = await base64Response.blob();

      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1]; // Remove data:image/...;base64, prefix
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const base64Data = await base64Promise;
      fileData = decode(base64Data);
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileData, {
        contentType: `image/${fileExtension}`,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      return { success: false, error: 'Failed to get public URL' };
    }

    return {
      success: true,
      url: publicUrlData.publicUrl,
    };
  } catch (error: any) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload image',
    };
  }
}

/**
 * Delete an image from Supabase Storage
 * @param url - The public URL of the image
 * @param bucket - The storage bucket name (default: 'vehicles')
 * @returns Success boolean
 */
export async function deleteImage(
  url: string,
  bucket: string = 'vehicles'
): Promise<boolean> {
  try {
    if (!url) return false;

    // Extract file path from URL
    const urlParts = url.split(`/${bucket}/`);
    if (urlParts.length < 2) {
      console.error('Invalid image URL');
      return false;
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete image error:', error);
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
  vehicleId?: string
): Promise<ImageUploadResult> {
  try {
    // Upload new image
    const folder = vehicleId ? `vehicle_${vehicleId}` : 'vehicles';
    const uploadResult = await uploadImage(newImageUri, 'vehicles', folder);

    if (!uploadResult.success) {
      return uploadResult;
    }

    // Delete old image if exists
    if (oldImageUrl) {
      await deleteImage(oldImageUrl, 'vehicles');
    }

    return uploadResult;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to update vehicle image',
    };
  }
}