import { config } from "@/lib/config";
import { logger } from "@/lib/utils/logger";
import { withTimeout } from "@/lib/utils/networkUtils";
import { Platform } from "react-native";
import { supabase } from "../../services/supabaseClient";
import { router } from "expo-router";
import { getPushNotificationRoute } from "../utils/notificationNavigation";

// Dynamically import OneSignal to handle cases where native module isn't available
let OneSignal: typeof import("react-native-onesignal").OneSignal | null = null;
let LogLevel: typeof import("react-native-onesignal").LogLevel | null = null;

let OneSignalWeb: any = null;

type NotificationWillDisplayEvent =
  import("react-native-onesignal").NotificationWillDisplayEvent;
type NotificationClickEvent =
  import("react-native-onesignal").NotificationClickEvent;

// Check if OneSignal native module is available
const isOneSignalAvailable = (): boolean => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const onesignal = require("react-native-onesignal");
    OneSignal = onesignal.OneSignal;
    LogLevel = onesignal.LogLevel;
    return true;
  } catch {
    return false;
  }
};

// Load OneSignal web SDK asynchronously
const loadOneSignalWeb = async (): Promise<boolean> => {
  try {
    const module = await import("react-onesignal");
    OneSignalWeb = module.default;
    return true;
  } catch (error) {
    if (__DEV__) {
      logger.error("OneSignal: Failed to load web SDK", error);
    }
    return false;
  }
};

class OneSignalService {
  private initialized = false;
  private isAvailable = false;
  private isWebAvailable = false;

  private getOneSignal() {
    if (!this.isAvailable || !OneSignal) {
      return null;
    }
    return OneSignal;
  }

  private getOneSignalWeb() {
    if (!this.isWebAvailable || !OneSignalWeb) {
      return null;
    }
    return OneSignalWeb;
  }

  private async ensureWebSDKLoaded(): Promise<boolean> {
    if (OneSignalWeb) return true;
    this.isWebAvailable = await loadOneSignalWeb();
    return this.isWebAvailable;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const appId = config.oneSignalAppId;

    if (!appId || appId === "YOUR_ONESIGNAL_APP_ID_HERE") {
      if (__DEV__) {
        logger.warn(
          "OneSignal: App ID not configured. Please set ONESIGNAL_APP_ID in your .env file",
        );
      }
      return;
    }

    // Handle web platform separately
    if (Platform.OS === "web") {
      await this.initializeWeb(appId);
      return;
    }

    // Check if native module is available (won't be in Expo Go)
    this.isAvailable = isOneSignalAvailable();
    const os = this.getOneSignal();
    if (!os) {
      if (__DEV__) {
        logger.log(
          "OneSignal: Native module not available. Please use a development build instead of Expo Go.",
        );
      }
      return;
    }

    try {
      // Enable verbose logging for development
      if (__DEV__ && LogLevel) {
        os.Debug.setLogLevel(LogLevel.Verbose);
      }

      // Initialize OneSignal
      os.initialize(appId);

      // Set up notification handlers
      this.setupNotificationHandlers(os);

      this.initialized = true;
      if (__DEV__) {
        logger.log("OneSignal: Initialized successfully");
      }
    } catch (error) {
      if (__DEV__) {
        logger.error("OneSignal: Failed to initialize", error);
      }
    }
  }

  private async initializeWeb(appId: string): Promise<void> {
    const loaded = await this.ensureWebSDKLoaded();
    if (!loaded) {
      if (__DEV__) {
        logger.log("OneSignal: Web SDK not available");
      }
      return;
    }

    const osWeb = this.getOneSignalWeb();
    if (!osWeb) {
      if (__DEV__) {
        logger.log("OneSignal: Web SDK failed to initialize");
      }
      return;
    }

    try {
      await withTimeout(
        osWeb.init({
          appId,
          allowLocalhostAsSecureOrigin: __DEV__,
          // In development, Metro doesn't serve from public folder
          // In production, use the service worker from public folder
          serviceWorkerParam: { scope: "/push/onesignal/" },
          serviceWorkerPath: __DEV__
            ? undefined
            : "/push/onesignal/OneSignalSDKWorker.js",
        }),
      );

      this.initialized = true;
      if (__DEV__) {
        logger.log("OneSignal: Web SDK initialized successfully");

        // Check permission status
        const permission = osWeb.Notifications.permission;
        logger.log("OneSignal: Web notification permission:", permission);

        const subscriptionId = osWeb.User.PushSubscription.id;
        logger.log("OneSignal: Web subscription ID:", subscriptionId);
      }
    } catch (error) {
      if (__DEV__) {
        logger.error("OneSignal: Failed to initialize web SDK", error);
      }
    }
  }

  private setupNotificationHandlers(
    os: typeof import("react-native-onesignal").OneSignal,
  ): void {
    // Handle notification received while app is in foreground
    os.Notifications.addEventListener(
      "foregroundWillDisplay",
      (event: NotificationWillDisplayEvent) => {
        if (__DEV__) {
          logger.log("OneSignal: Notification received in foreground", event);
        }
        // Display the notification
        event.getNotification().display();
      },
    );

    // Handle notification click
    os.Notifications.addEventListener(
      "click",
      (event: NotificationClickEvent) => {
        if (__DEV__) {
          logger.log("OneSignal: Notification clicked", event);
        }
        this.handleNotificationClick(event);
      },
    );
  }

  private handleNotificationClick(event: NotificationClickEvent): void {
    const data = event.notification?.additionalData as
      | Record<string, unknown>
      | undefined;

    const route = getPushNotificationRoute(data);
    if (route) {
      router.push(route as any);
    }
  }

  /**
   * Set the external user ID (links OneSignal user to your app's user)
   */
  async setExternalUserId(userId: string): Promise<void> {
    if (!this.initialized) return;

    // Handle web
    if (Platform.OS === "web") {
      const osWeb = this.getOneSignalWeb();
      if (!osWeb) return;
      try {
        osWeb.login(userId);
        if (__DEV__) {
          logger.log("OneSignal: Web external user ID set", userId);
        }
      } catch (error) {
        if (__DEV__) {
          logger.error("OneSignal: Failed to set web external user ID", error);
        }
      }
      return;
    }

    // Handle mobile
    const os = this.getOneSignal();
    if (!os) return;

    try {
      os.login(userId);
      if (__DEV__) {
        logger.log("OneSignal: External user ID set", userId);
      }
    } catch (error) {
      if (__DEV__) {
        logger.error("OneSignal: Failed to set external user ID", error);
      }
    }
  }

  /**
   * Clear the external user ID (call on logout)
   */
  async clearExternalUserId(): Promise<void> {
    if (!this.initialized) return;

    // Handle web
    if (Platform.OS === "web") {
      const osWeb = this.getOneSignalWeb();
      if (!osWeb) return;
      try {
        osWeb.logout();
        if (__DEV__) {
          logger.log("OneSignal: Web external user ID cleared");
        }
      } catch (error) {
        if (__DEV__) {
          logger.error(
            "OneSignal: Failed to clear web external user ID",
            error,
          );
        }
      }
      return;
    }

    // Handle mobile
    const os = this.getOneSignal();
    if (!os) return;

    try {
      os.logout();
      if (__DEV__) {
        logger.log("OneSignal: External user ID cleared");
      }
    } catch (error) {
      if (__DEV__) {
        logger.error("OneSignal: Failed to clear external user ID", error);
      }
    }
  }

  /**
   * Add a tag to the user for segmentation
   */
  async addTag(key: string, value: string): Promise<void> {
    if (!this.initialized) return;

    if (Platform.OS === "web") {
      const osWeb = this.getOneSignalWeb();
      if (!osWeb) return;
      try {
        osWeb.User.addTag(key, value);
      } catch (error) {
        if (__DEV__) {
          logger.error("OneSignal: Failed to add web tag", error);
        }
      }
      return;
    }

    const os = this.getOneSignal();
    if (!os) return;

    try {
      os.User.addTag(key, value);
    } catch (error) {
      if (__DEV__) {
        logger.error("OneSignal: Failed to add tag", error);
      }
    }
  }

  /**
   * Add multiple tags at once
   */
  async addTags(tags: Record<string, string>): Promise<void> {
    if (!this.initialized) return;

    if (Platform.OS === "web") {
      const osWeb = this.getOneSignalWeb();
      if (!osWeb) return;
      try {
        osWeb.User.addTags(tags);
      } catch (error) {
        if (__DEV__) {
          logger.error("OneSignal: Failed to add web tags", error);
        }
      }
      return;
    }

    const os = this.getOneSignal();
    if (!os) return;

    try {
      os.User.addTags(tags);
    } catch (error) {
      if (__DEV__) {
        logger.error("OneSignal: Failed to add tags", error);
      }
    }
  }

  /**
   * Remove a tag
   */
  async removeTag(key: string): Promise<void> {
    if (!this.initialized) return;

    if (Platform.OS === "web") {
      const osWeb = this.getOneSignalWeb();
      if (!osWeb) return;
      try {
        osWeb.User.removeTag(key);
      } catch (error) {
        if (__DEV__) {
          logger.error("OneSignal: Failed to remove web tag", error);
        }
      }
      return;
    }

    const os = this.getOneSignal();
    if (!os) return;

    try {
      os.User.removeTag(key);
    } catch (error) {
      if (__DEV__) {
        logger.error("OneSignal: Failed to remove tag", error);
      }
    }
  }

  /**
   * Get the OneSignal subscription ID (player ID)
   */
  getSubscriptionId(): string | null {
    if (!this.initialized) return null;

    if (Platform.OS === "web") {
      const osWeb = this.getOneSignalWeb();
      if (!osWeb) return null;
      try {
        return osWeb.User.PushSubscription.id ?? null;
      } catch (error) {
        if (__DEV__) {
          logger.error("OneSignal: Failed to get web subscription ID", error);
        }
        return null;
      }
    }

    const os = this.getOneSignal();
    if (!os) return null;

    try {
      return os.User.pushSubscription.getPushSubscriptionId() ?? null;
    } catch (error) {
      if (__DEV__) {
        logger.error("OneSignal: Failed to get subscription ID", error);
      }
      return null;
    }
  }

  /**
   * Check if push notifications are enabled
   */
  async hasPermission(): Promise<boolean> {
    if (Platform.OS === "web") {
      const osWeb = this.getOneSignalWeb();
      if (!osWeb) return false;
      try {
        return osWeb.Notifications.permission;
      } catch (error) {
        if (__DEV__) {
          logger.error("OneSignal: Failed to check web permission", error);
        }
        return false;
      }
    }

    const os = this.getOneSignal();
    if (!os) return false;

    try {
      return os.Notifications.getPermissionAsync();
    } catch (error) {
      if (__DEV__) {
        logger.error("OneSignal: Failed to check permission", error);
      }
      return false;
    }
  }

  /**
   * Request push notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === "web") {
      const osWeb = this.getOneSignalWeb();
      if (!osWeb) return false;
      try {
        await osWeb.Notifications.requestPermission();
        return osWeb.Notifications.permission;
      } catch (error) {
        if (__DEV__) {
          logger.error("OneSignal: Failed to request web permission", error);
        }
        return false;
      }
    }

    const os = this.getOneSignal();
    if (!os) return false;

    try {
      const granted = await os.Notifications.requestPermission(true);
      if (!granted) return false;

      os.User.pushSubscription.optIn();
      await this.syncUser();
      return true;
    } catch (error) {
      if (__DEV__) {
        logger.error("OneSignal: Failed to request permission", error);
      }
      return false;
    }
  }

  /**
   * Sync user with OneSignal after login
   */
  async syncUser(): Promise<void> {
    if (!this.initialized) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await this.setExternalUserId(user.id);

        // Add user email if available
        if (user.email) {
          if (Platform.OS === "web") {
            const osWeb = this.getOneSignalWeb();
            if (osWeb) {
              osWeb.User.addEmail(user.email);
            }
          } else {
            const os = this.getOneSignal();
            if (os) {
              os.User.addEmail(user.email);
            }
          }
        }

        // Add useful tags for segmentation
        await this.addTags({
          user_id: user.id,
          platform: Platform.OS,
        });
      }
    } catch (error) {
      if (__DEV__) {
        logger.error("OneSignal: Failed to sync user", error);
      }
    }
  }

  /**
   * Sync notification preference toggles as OneSignal tags for server-side filtering
   */
  async syncPreferenceTags(prefs: {
    push_notifications_enabled?: boolean;
    log_updates_enabled?: boolean;
    group_members_enabled?: boolean;
    invitations_enabled?: boolean;
    service_reminders_enabled?: boolean;
    mileage_reminders_enabled?: boolean;
    cost_alerts_enabled?: boolean;
    analytics_insights_enabled?: boolean;
    quiet_hours_enabled?: boolean;
  }): Promise<void> {
    if (!this.initialized) return;

    const tags: Record<string, string> = {
      push_enabled: String(prefs.push_notifications_enabled ?? true),
      log_updates: String(prefs.log_updates_enabled ?? true),
      group_members: String(prefs.group_members_enabled ?? true),
      invitations: String(prefs.invitations_enabled ?? true),
      service_reminders: String(prefs.service_reminders_enabled ?? true),
      mileage_reminders: String(prefs.mileage_reminders_enabled ?? true),
      cost_alerts: String(prefs.cost_alerts_enabled ?? true),
      analytics_insights: String(prefs.analytics_insights_enabled ?? true),
      quiet_hours: String(prefs.quiet_hours_enabled ?? false),
    };

    await this.addTags(tags);
  }

  /**
   * Clean up on logout
   */
  async onLogout(): Promise<void> {
    if (!this.initialized) return;

    await this.clearExternalUserId();
  }
}

export const oneSignalService = new OneSignalService();
