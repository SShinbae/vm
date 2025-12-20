import { Platform } from "react-native";
import Constants from "expo-constants";
import { supabase } from "../../services/supabaseClient";

// Dynamically import OneSignal to handle cases where native module isn't available
let OneSignal: typeof import("react-native-onesignal").OneSignal | null = null;
let LogLevel: typeof import("react-native-onesignal").LogLevel | null = null;

type NotificationWillDisplayEvent =
  import("react-native-onesignal").NotificationWillDisplayEvent;
type NotificationClickEvent =
  import("react-native-onesignal").NotificationClickEvent;

// Check if OneSignal native module is available
const isOneSignalAvailable = (): boolean => {
  try {
    const onesignal = require("react-native-onesignal");
    OneSignal = onesignal.OneSignal;
    LogLevel = onesignal.LogLevel;
    return true;
  } catch {
    return false;
  }
};

class OneSignalService {
  private initialized = false;
  private isAvailable = false;

  private getOneSignal() {
    if (!this.isAvailable || !OneSignal) {
      return null;
    }
    return OneSignal;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Skip on web - OneSignal React Native SDK is for mobile only
    if (Platform.OS === "web") {
      console.log("OneSignal: Skipping initialization on web platform");
      return;
    }

    // Check if native module is available (won't be in Expo Go)
    this.isAvailable = isOneSignalAvailable();
    const os = this.getOneSignal();
    if (!os) {
      console.log(
        "OneSignal: Native module not available. Please use a development build instead of Expo Go.",
      );
      return;
    }

    const appId = Constants.expoConfig?.extra?.oneSignalAppId;

    if (!appId || appId === "YOUR_ONESIGNAL_APP_ID_HERE") {
      console.warn(
        "OneSignal: App ID not configured. Please set ONESIGNAL_APP_ID in your .env file",
      );
      return;
    }

    try {
      // Enable verbose logging for development
      if (__DEV__ && LogLevel) {
        os.Debug.setLogLevel(LogLevel.Verbose);
      }

      // Initialize OneSignal
      os.initialize(appId);

      // Request notification permission
      os.Notifications.requestPermission(true);

      // Set up notification handlers
      this.setupNotificationHandlers(os);

      this.initialized = true;
      console.log("OneSignal: Initialized successfully");
    } catch (error) {
      console.error("OneSignal: Failed to initialize", error);
    }
  }

  private setupNotificationHandlers(
    os: typeof import("react-native-onesignal").OneSignal,
  ): void {
    // Handle notification received while app is in foreground
    os.Notifications.addEventListener(
      "foregroundWillDisplay",
      (event: NotificationWillDisplayEvent) => {
        console.log("OneSignal: Notification received in foreground", event);
        // Display the notification
        event.getNotification().display();
      },
    );

    // Handle notification click
    os.Notifications.addEventListener(
      "click",
      (event: NotificationClickEvent) => {
        console.log("OneSignal: Notification clicked", event);
        this.handleNotificationClick(event);
      },
    );
  }

  private handleNotificationClick(event: NotificationClickEvent): void {
    const data = event.notification?.additionalData as
      | Record<string, unknown>
      | undefined;

    if (data?.type && data?.id) {
      switch (data.type) {
        case "log_update":
          if (data.vehicleId) {
            console.log("Navigate to vehicle:", data.vehicleId);
            // Add navigation logic here
          }
          break;
        case "group_invite":
        case "group_member":
          if (data.groupId) {
            console.log("Navigate to group:", data.groupId);
            // Add navigation logic here
          }
          break;
      }
    }
  }

  /**
   * Set the external user ID (links OneSignal user to your app's user)
   */
  async setExternalUserId(userId: string): Promise<void> {
    const os = this.getOneSignal();
    if (Platform.OS === "web" || !this.initialized || !os) return;

    try {
      os.login(userId);
      console.log("OneSignal: External user ID set", userId);
    } catch (error) {
      console.error("OneSignal: Failed to set external user ID", error);
    }
  }

  /**
   * Clear the external user ID (call on logout)
   */
  async clearExternalUserId(): Promise<void> {
    const os = this.getOneSignal();
    if (Platform.OS === "web" || !this.initialized || !os) return;

    try {
      os.logout();
      console.log("OneSignal: External user ID cleared");
    } catch (error) {
      console.error("OneSignal: Failed to clear external user ID", error);
    }
  }

  /**
   * Add a tag to the user for segmentation
   */
  async addTag(key: string, value: string): Promise<void> {
    const os = this.getOneSignal();
    if (Platform.OS === "web" || !this.initialized || !os) return;

    try {
      os.User.addTag(key, value);
    } catch (error) {
      console.error("OneSignal: Failed to add tag", error);
    }
  }

  /**
   * Add multiple tags at once
   */
  async addTags(tags: Record<string, string>): Promise<void> {
    const os = this.getOneSignal();
    if (Platform.OS === "web" || !this.initialized || !os) return;

    try {
      os.User.addTags(tags);
    } catch (error) {
      console.error("OneSignal: Failed to add tags", error);
    }
  }

  /**
   * Remove a tag
   */
  async removeTag(key: string): Promise<void> {
    const os = this.getOneSignal();
    if (Platform.OS === "web" || !this.initialized || !os) return;

    try {
      os.User.removeTag(key);
    } catch (error) {
      console.error("OneSignal: Failed to remove tag", error);
    }
  }

  /**
   * Get the OneSignal subscription ID (player ID)
   */
  getSubscriptionId(): string | null {
    const os = this.getOneSignal();
    if (Platform.OS === "web" || !this.initialized || !os) return null;

    try {
      return os.User.pushSubscription.getPushSubscriptionId() ?? null;
    } catch (error) {
      console.error("OneSignal: Failed to get subscription ID", error);
      return null;
    }
  }

  /**
   * Check if push notifications are enabled
   */
  async hasPermission(): Promise<boolean> {
    const os = this.getOneSignal();
    if (Platform.OS === "web" || !os) return false;

    try {
      return os.Notifications.getPermissionAsync();
    } catch (error) {
      console.error("OneSignal: Failed to check permission", error);
      return false;
    }
  }

  /**
   * Request push notification permission
   */
  async requestPermission(): Promise<boolean> {
    const os = this.getOneSignal();
    if (Platform.OS === "web" || !os) return false;

    try {
      return os.Notifications.requestPermission(true);
    } catch (error) {
      console.error("OneSignal: Failed to request permission", error);
      return false;
    }
  }

  /**
   * Sync user with OneSignal after login
   */
  async syncUser(): Promise<void> {
    const os = this.getOneSignal();
    if (Platform.OS === "web" || !this.initialized || !os) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await this.setExternalUserId(user.id);

        // Add user email if available
        if (user.email) {
          os.User.addEmail(user.email);
        }

        // Add useful tags for segmentation
        await this.addTags({
          user_id: user.id,
          platform: Platform.OS,
        });
      }
    } catch (error) {
      console.error("OneSignal: Failed to sync user", error);
    }
  }

  /**
   * Clean up on logout
   */
  async onLogout(): Promise<void> {
    if (Platform.OS === "web" || !this.initialized) return;

    await this.clearExternalUserId();
  }
}

export const oneSignalService = new OneSignalService();
