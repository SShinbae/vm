import { supabase } from "../../services/supabaseClient";
import { ApiResponse } from "../../types";

export class ReceiptStorageService {
  /**
   * Get receipt image URL for a service log
   */
  static async getReceiptImageUrl(
    receiptPath: string,
  ): Promise<ApiResponse<string>> {
    try {
      const { data } = supabase.storage
        .from("receipt-images")
        .getPublicUrl(receiptPath);

      return { data: data.publicUrl, error: null, loading: false };
    } catch (error) {
      console.error("Error getting receipt image URL:", error);
      return {
        data: null,
        error: "Failed to get receipt image URL",
        loading: false,
      };
    }
  }

  /**
   * Delete receipt image from storage
   */
  static async deleteReceiptImage(
    receiptPath: string,
  ): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.storage
        .from("receipt-images")
        .remove([receiptPath]);

      if (error) {
        console.error("Error deleting receipt image:", error);
        return { data: null, error: error.message, loading: false };
      }

      return { data: true, error: null, loading: false };
    } catch (error) {
      console.error("Unexpected error deleting receipt image:", error);
      return {
        data: null,
        error: "Failed to delete receipt image",
        loading: false,
      };
    }
  }

  /**
   * List all receipt images for a user
   */
  static async listUserReceiptImages(): Promise<ApiResponse<any[]>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      const { data, error } = await supabase.storage
        .from("receipt-images")
        .list(user.id, {
          limit: 100,
          offset: 0,
        });

      if (error) {
        console.error("Error listing receipt images:", error);
        return { data: null, error: error.message, loading: false };
      }

      return { data: data || [], error: null, loading: false };
    } catch (error) {
      console.error("Unexpected error listing receipt images:", error);
      return {
        data: null,
        error: "Failed to list receipt images",
        loading: false,
      };
    }
  }

  /**
   * Get storage usage statistics for user
   */
  static async getStorageStats(): Promise<
    ApiResponse<{
      totalFiles: number;
      totalSize: number;
      remainingStorage: number;
    }>
  > {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      const { data, error } = await supabase.storage
        .from("receipt-images")
        .list(user.id, {
          limit: 1000,
          offset: 0,
        });

      if (error) {
        console.error("Error getting storage stats:", error);
        return { data: null, error: error.message, loading: false };
      }

      const files = data || [];
      const totalSize = files.reduce(
        (sum, file) => sum + (file.metadata?.size || 0),
        0,
      );
      const maxStorage = 100 * 1024 * 1024; // 100MB per user
      const remainingStorage = Math.max(0, maxStorage - totalSize);

      return {
        data: {
          totalFiles: files.length,
          totalSize,
          remainingStorage,
        },
        error: null,
        loading: false,
      };
    } catch (error) {
      console.error("Unexpected error getting storage stats:", error);
      return {
        data: null,
        error: "Failed to get storage statistics",
        loading: false,
      };
    }
  }

  /**
   * Clean up old receipt images (optional maintenance function)
   */
  static async cleanupOldReceipts(
    daysOld: number = 365,
  ): Promise<ApiResponse<number>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { data: null, error: "User not authenticated", loading: false };
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data: files, error: listError } = await supabase.storage
        .from("receipt-images")
        .list(user.id, {
          limit: 1000,
          offset: 0,
        });

      if (listError) {
        return { data: null, error: listError.message, loading: false };
      }

      const oldFiles = (files || []).filter((file) => {
        const fileDate = new Date(file.created_at || "");
        return fileDate < cutoffDate;
      });

      if (oldFiles.length === 0) {
        return { data: 0, error: null, loading: false };
      }

      const filePaths = oldFiles.map((file) => `${user.id}/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from("receipt-images")
        .remove(filePaths);

      if (deleteError) {
        console.error("Error cleaning up old receipts:", deleteError);
        return { data: null, error: deleteError.message, loading: false };
      }

      return { data: oldFiles.length, error: null, loading: false };
    } catch (error) {
      console.error("Unexpected error cleaning up old receipts:", error);
      return {
        data: null,
        error: "Failed to cleanup old receipts",
        loading: false,
      };
    }
  }
}
