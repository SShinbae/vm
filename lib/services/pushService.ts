import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { Linking, Platform } from "react-native";
import { logger } from "@/lib/utils/logger";
import { getPushNotificationRoute } from "@/lib/utils/notificationNavigation";
import { supabase } from "@/services/supabaseClient";

const isSupported = Platform.OS !== "web";
let handlersReady = false;
let currentToken: string | null = null;

function routeFromResponse(
  response: Notifications.NotificationResponse | null,
): string | null {
  const data = response?.notification.request.content.data as
    | Record<string, unknown>
    | undefined;
  return getPushNotificationRoute(data);
}

function openFromResponse(response: Notifications.NotificationResponse | null) {
  const route = routeFromResponse(response);
  if (route) router.push(route as never);
}

function ensureHandlers() {
  if (handlersReady || !isSupported) return;
  handlersReady = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  Notifications.addNotificationResponseReceivedListener(openFromResponse);

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
    }).catch(() => {});
  }
}

async function registerToken(): Promise<void> {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) {
    logger.warn("Push: EAS projectId missing; cannot get Expo push token");
    return;
  }
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    currentToken = token;
    const { error } = await (supabase as any).rpc("register_push_token", {
      p_token: token,
      p_device_type: Platform.OS,
    });
    if (error) logger.error("Push: failed to save token", error);
  } catch (error) {
    // Simulators and devices without push entitlements throw here.
    logger.warn("Push: could not get Expo push token", error);
  }
}

async function hasPermission(): Promise<boolean> {
  if (!isSupported) return false;
  return (await Notifications.getPermissionsAsync()).granted;
}

export const pushService = {
  isSupported,
  hasPermission,

  async requestPermission(): Promise<boolean> {
    if (!isSupported) return false;
    ensureHandlers();
    // Once denied, iOS never shows the prompt again; only Settings can turn
    // notifications back on (OneSignal's requestPermission(true) did the same).
    const current = await Notifications.getPermissionsAsync();
    if (!current.granted && current.canAskAgain === false) {
      await Linking.openSettings().catch(() => {});
      return false;
    }
    const { granted } = await Notifications.requestPermissionsAsync();
    if (!granted) return false;
    await registerToken();
    return true;
  },

  /** Re-registers this device for the signed-in user. Never prompts. */
  async syncUser(): Promise<void> {
    if (!isSupported) return;
    ensureHandlers();
    if (await hasPermission()) await registerToken();
  },

  /** Stops this device receiving the user's pushes. Never throws. */
  async onLogout(): Promise<void> {
    if (!currentToken) return;
    const token = currentToken;
    currentToken = null;
    try {
      const { error } = await supabase
        .from("push_tokens")
        .delete()
        .eq("token", token);
      if (error) logger.error("Push: failed to remove token on logout", error);
    } catch (error) {
      logger.error("Push: failed to remove token on logout", error);
    }
  },

  /**
   * Route for the notification tap that launched the app, or null. Call it
   * once the main navigator is mounted (the tabs layout); navigating earlier
   * loses the race with the index screen's redirect to the dashboard.
   * Clears the response so a JS reload doesn't re-open it.
   */
  consumeLaunchRoute(): string | null {
    if (!isSupported) return null;
    try {
      const last = Notifications.getLastNotificationResponse();
      if (!last) return null;
      Notifications.clearLastNotificationResponse();
      return routeFromResponse(last);
    } catch {
      return null;
    }
  },
};
