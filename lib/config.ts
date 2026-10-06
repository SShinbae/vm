import Constants from "expo-constants";
import { Platform } from "react-native";

interface AppConfig {
  supabaseUrl: string;
  supabaseKey: string;
  siteUrl: string;
  sentryDsn: string;
  posthogApiKey: string;
  posthogHost: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AppConfig>;

/**
 * In dev on Android, 127.0.0.1/localhost is the emulator itself, so point
 * them at 10.0.2.2 (the emulator's alias for the host Mac running local Supabase).
 * ponytail: emulator only; a physical phone needs the Mac's LAN IP in .env.local.
 */
export function resolveLocalHostUrl(
  url: string,
  os: string = Platform.OS,
  isDev: boolean = __DEV__,
): string {
  if (!isDev || os !== "android") return url;
  return url.replace(
    /^(https?:\/\/)(?:127\.0\.0\.1|localhost)(?=[:/]|$)/,
    (_, scheme: string) => `${scheme}10.0.2.2`,
  );
}

export const config: Readonly<AppConfig> = {
  supabaseUrl: resolveLocalHostUrl(extra.supabaseUrl ?? ""),
  supabaseKey: extra.supabaseKey ?? "",
  siteUrl: extra.siteUrl ?? "",
  sentryDsn: extra.sentryDsn || process.env.EXPO_PUBLIC_SENTRY_DSN || "",
  posthogApiKey:
    extra.posthogApiKey || process.env.EXPO_PUBLIC_POSTHOG_API_KEY || "",
  posthogHost: extra.posthogHost || process.env.EXPO_PUBLIC_POSTHOG_HOST || "",
};
