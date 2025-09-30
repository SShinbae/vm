import { supabase } from '../../services/supabaseClient';
import {
  ApiResponse,
  VehicleImage,
  VehicleImageInsert
} from '../../types/database-v2';

export class ImageUploadService {
  // Maximum file size (5MB)
  private static MAX_FILE_SIZE = 5 * 1024 * 1024;

  // Allowed image types
  private static ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  /**
   * Validate image file before upload
   */
  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size too large. Maximum size is ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      };
    }

    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid file type. Please upload JPEG, PNG, or WebP images only.'
      };
    }

    return { isValid: true };
  }

  /**
   * Generate unique filename for upload
   */
  private static generateFileName(userId: string, type: string, originalName: string): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    const randomId = Math.random().toString(36).substring(2, 15);

    return `${userId}/${type}_${timestamp}_${randomId}.${extension}`;
  }

  /**
   * Upload profile avatar
   */
  static async uploadProfileAvatar(file: File): Promise<ApiResponse<string>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // Validate file
      const validation = this.validateImageFile(file);
      if (!validation.isValid) {
        return { data: null, error: validation.error!, loading: false };
      }

      // Generate filename
      const fileName = this.generateFileName(user.id, 'avatar', file.name);

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        return { data: null, error: uploadError.message, loading: false };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-avatars')
        .getPublicUrl(fileName);

      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        // Try to cleanup uploaded file
        await supabase.storage.from('profile-avatars').remove([fileName]);
        return { data: null, error: updateError.message, loading: false };
      }

      console.log('✅ Avatar uploaded successfully:', urlData.publicUrl);
      return { data: urlData.publicUrl, error: null, loading: false };

    } catch (error) {
      console.error('Unexpected error uploading avatar:', error);
      return { data: null, error: 'Failed to upload avatar', loading: false };
    }
  }

  /**
   * Upload vehicle image
   */
  static async uploadVehicleImage(
    vehicleId: string,
    file: File,
    imageType: 'vehicle_main' | 'vehicle_gallery' = 'vehicle_gallery',
    caption?: string
  ): Promise<ApiResponse<VehicleImage>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // Verify user owns the vehicle
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('user_id')
        .eq('id', vehicleId)
        .single();

      if (vehicleError || !vehicle) {
        return { data: null, error: 'Vehicle not found', loading: false };
      }

      if (vehicle.user_id !== user.id) {
        return { data: null, error: 'You can only upload images for your own vehicles', loading: false };
      }

      // Validate file
      const validation = this.validateImageFile(file);
      if (!validation.isValid) {
        return { data: null, error: validation.error!, loading: false };
      }

      // Generate filename
      const fileName = this.generateFileName(user.id, `vehicle_${vehicleId}`, file.name);

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vehicle-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading vehicle image:', uploadError);
        return { data: null, error: uploadError.message, loading: false };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('vehicle-images')
        .getPublicUrl(fileName);

      // Get next display order for gallery images
      let displayOrder = 0;
      if (imageType === 'vehicle_gallery') {
        const { data: existingImages } = await supabase
          .from('vehicle_images')
          .select('display_order')
          .eq('vehicle_id', vehicleId)
          .eq('image_type', 'vehicle_gallery')
          .order('display_order', { ascending: false })
          .limit(1);

        displayOrder = (existingImages?.[0]?.display_order || 0) + 1;
      }

      // Create vehicle image record
      const imageData: VehicleImageInsert = {
        vehicle_id: vehicleId,
        image_url: urlData.publicUrl,
        image_type: imageType,
        caption: caption || null,
        display_order: displayOrder,
        uploaded_by: user.id
      };

      const { data: imageRecord, error: imageError } = await supabase
        .from('vehicle_images')
        .insert(imageData)
        .select()
        .single();

      if (imageError) {
        console.error('Error creating image record:', imageError);
        // Try to cleanup uploaded file
        await supabase.storage.from('vehicle-images').remove([fileName]);
        return { data: null, error: imageError.message, loading: false };
      }

      // If this is a main image, update vehicle record
      if (imageType === 'vehicle_main') {
        const { error: vehicleUpdateError } = await supabase
          .from('vehicles')
          .update({ main_image_url: urlData.publicUrl })
          .eq('id', vehicleId);

        if (vehicleUpdateError) {
          console.error('Error updating vehicle main image:', vehicleUpdateError);
          // Continue anyway, the image record was created successfully
        }
      }

      console.log('✅ Vehicle image uploaded successfully:', urlData.publicUrl);
      return { data: imageRecord, error: null, loading: false };

    } catch (error) {
      console.error('Unexpected error uploading vehicle image:', error);
      return { data: null, error: 'Failed to upload vehicle image', loading: false };
    }
  }

  /**
   * Get vehicle images
   */
  static async getVehicleImages(vehicleId: string): Promise<ApiResponse<VehicleImage[]>> {
    try {
      const { data, error } = await supabase
        .from('vehicle_images')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('image_type', { ascending: true }) // main images first
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching vehicle images:', error);
        return { data: null, error: error.message, loading: false };
      }

      return { data: data || [], error: null, loading: false };

    } catch (error) {
      console.error('Unexpected error fetching vehicle images:', error);
      return { data: null, error: 'Failed to fetch vehicle images', loading: false };
    }
  }

  /**
   * Delete vehicle image
   */
  static async deleteVehicleImage(imageId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // Get image record to verify ownership and get storage path
      const { data: imageRecord, error: imageError } = await supabase
        .from('vehicle_images')
        .select(`
          *,
          vehicles!inner(user_id)
        `)
        .eq('id', imageId)
        .single();

      if (imageError || !imageRecord) {
        return { data: null, error: 'Image not found', loading: false };
      }

      // Check ownership
      if (imageRecord.vehicles.user_id !== user.id) {
        return { data: null, error: 'You can only delete your own vehicle images', loading: false };
      }

      // Extract filename from URL
      const url = new URL(imageRecord.image_url);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const fullPath = `${user.id}/${fileName}`;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('vehicle-images')
        .remove([fullPath]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue with database deletion even if storage fails
      }

      // Delete database record
      const { error: deleteError } = await supabase
        .from('vehicle_images')
        .delete()
        .eq('id', imageId);

      if (deleteError) {
        console.error('Error deleting image record:', deleteError);
        return { data: null, error: deleteError.message, loading: false };
      }

      // If this was a main image, clear vehicle's main_image_url
      if (imageRecord.image_type === 'vehicle_main') {
        await supabase
          .from('vehicles')
          .update({ main_image_url: null })
          .eq('id', imageRecord.vehicle_id);
      }

      console.log('✅ Vehicle image deleted successfully');
      return { data: true, error: null, loading: false };

    } catch (error) {
      console.error('Unexpected error deleting vehicle image:', error);
      return { data: null, error: 'Failed to delete vehicle image', loading: false };
    }
  }

  /**
   * Update image caption and order
   */
  static async updateVehicleImage(
    imageId: string,
    updates: { caption?: string; display_order?: number }
  ): Promise<ApiResponse<VehicleImage>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // Verify ownership through vehicle
      const { data: imageRecord, error: checkError } = await supabase
        .from('vehicle_images')
        .select(`
          *,
          vehicles!inner(user_id)
        `)
        .eq('id', imageId)
        .single();

      if (checkError || !imageRecord) {
        return { data: null, error: 'Image not found', loading: false };
      }

      if (imageRecord.vehicles.user_id !== user.id) {
        return { data: null, error: 'You can only modify your own vehicle images', loading: false };
      }

      // Update image record
      const { data: updatedImage, error: updateError } = await supabase
        .from('vehicle_images')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', imageId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating vehicle image:', updateError);
        return { data: null, error: updateError.message, loading: false };
      }

      return { data: updatedImage, error: null, loading: false };

    } catch (error) {
      console.error('Unexpected error updating vehicle image:', error);
      return { data: null, error: 'Failed to update vehicle image', loading: false };
    }
  }

  /**
   * Delete profile avatar
   */
  static async deleteProfileAvatar(): Promise<ApiResponse<boolean>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: 'User not authenticated', loading: false };
      }

      // Get current avatar URL
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.avatar_url) {
        return { data: null, error: 'No avatar to delete', loading: false };
      }

      // Extract filename from URL
      const url = new URL(profile.avatar_url);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const fullPath = `${user.id}/${fileName}`;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('profile-avatars')
        .remove([fullPath]);

      if (storageError) {
        console.error('Error deleting avatar from storage:', storageError);
        // Continue with database update even if storage fails
      }

      // Update profile to remove avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return { data: null, error: updateError.message, loading: false };
      }

      console.log('✅ Profile avatar deleted successfully');
      return { data: true, error: null, loading: false };

    } catch (error) {
      console.error('Unexpected error deleting avatar:', error);
      return { data: null, error: 'Failed to delete avatar', loading: false };
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
          type: file.type
        });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Compress image before upload (optional utility)
   */
  static compressImage(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
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
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
}