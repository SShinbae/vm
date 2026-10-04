import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { Platform } from "react-native";
import { logger } from "@/lib/utils/logger";
import { getPushNotificationRoute } from "@/lib/utils/notificationNavigation";
import { supabase } from "@/services/supabaseClient";

const isSupported = Platform.OS !== "web";
let handlersReady = false;
let currentToken: string | null = null;

function openFromResponse(response: Notifications.NotificationResponse | null) {
  const data = response?.notification.request.content.data as
    | Record<string, unknown>
    | undefined;
  const route = getPushNotificationRoute(data);
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
  Notifications.getLastNotificationResponseAsync()
    .then(openFromResponse)
    .catch(() => {});

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
    if (__DEV__) logger.warn("Push: could not get Expo push token", error);
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
      await supabase.from("push_tokens").delete().eq("token", token);
    } catch (error) {
      logger.error("Push: failed to remove token on logout", error);
    }
  },
};
