import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../services/supabaseClient";
import { Database } from "../../types/database";

const NOTIFICATIONS_STORAGE_KEY = "notifications";
const MIGRATION_FLAG_KEY = "notifications_migrated";

// Legacy notification format from AsyncStorage
interface LegacyNotificationData {
  id: string;
  type:
    | "mileage_log"
    | "fuel_log"
    | "service_log"
    | "group_member"
    | "group_invite";
  action: "INSERT" | "UPDATE" | "DELETE";
  title: string;
  message: string;
  vehicleId?: string;
  groupId?: string;
  userId: string;
  userName?: string;
  timestamp: string;
  read: boolean;
}

/**
 * Check if notifications have already been migrated
 */
export async function hasMigratedNotifications(): Promise<boolean> {
  try {
    const migrated = await AsyncStorage.getItem(MIGRATION_FLAG_KEY);
    return migrated === "true";
  } catch (error) {
    console.error("Error checking migration status:", error);
    return false;
  }
}

/**
 * Migrate notifications from AsyncStorage to Supabase
 * @param userId The current user's ID
 * @returns Success status and number of notifications migrated
 */
export async function migrateNotificationsFromStorage(
  userId: string,
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // Check if already migrated
    const alreadyMigrated = await hasMigratedNotifications();
    if (alreadyMigrated) {
      console.log("Notifications already migrated, skipping...");
      return { success: true, count: 0 };
    }

    // Read notifications from AsyncStorage
    const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!stored) {
      console.log("No notifications to migrate");
      await AsyncStorage.setItem(MIGRATION_FLAG_KEY, "true");
      return { success: true, count: 0 };
    }

    const legacyNotifications: LegacyNotificationData[] = JSON.parse(stored);
    if (
      !Array.isArray(legacyNotifications) ||
      legacyNotifications.length === 0
    ) {
      console.log("No valid notifications to migrate");
      await AsyncStorage.setItem(MIGRATION_FLAG_KEY, "true");
      return { success: true, count: 0 };
    }

    // Transform to new database format
    const notificationsToInsert: Database["public"]["Tables"]["notifications"]["Insert"][] =
      legacyNotifications.map((notification) => ({
        id: notification.id,
        user_id: userId,
        notification_type: notification.type,
        title: notification.title,
        body: notification.message,
        data: {
          action: notification.action,
          userName: notification.userName,
        },
        read: notification.read,
        related_vehicle_id: notification.vehicleId || null,
        related_group_id: notification.groupId || null,
        action_url: null,
      }));

    // Insert into Supabase (upsert to handle re-runs safely)
    const { error: insertError } = await (
      supabase.from("notifications") as any
    ).upsert(notificationsToInsert, {
      onConflict: "id",
      ignoreDuplicates: false,
    });

    if (insertError) {
      console.error("Error inserting notifications:", insertError);
      return {
        success: false,
        count: 0,
        error: insertError.message,
      };
    }

    // Mark as migrated
    await AsyncStorage.setItem(MIGRATION_FLAG_KEY, "true");

    // Clear AsyncStorage notifications (keep as backup for now, will clean up later)
    // await AsyncStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);

    console.log(
      `Successfully migrated ${notificationsToInsert.length} notifications`,
    );

    return {
      success: true,
      count: notificationsToInsert.length,
    };
  } catch (error) {
    console.error("Migration error:", error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Clean up AsyncStorage notifications after successful migration
 * Call this after confirming the migration was successful and data is in Supabase
 */
export async function cleanupAsyncStorageNotifications(): Promise<void> {
  try {
    await AsyncStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    console.log("Cleaned up AsyncStorage notifications");
  } catch (error) {
    console.error("Error cleaning up AsyncStorage:", error);
  }
}
