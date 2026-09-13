import Constants from "expo-constants";

interface AppConfig {
  supabaseUrl: string;
  supabaseKey: string;
  siteUrl: string;
  oneSignalAppId: string;
  sentryDsn: string;
  posthogApiKey: string;
  posthogHost: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AppConfig>;

export const config: Readonly<AppConfig> = {
  supabaseUrl: extra.supabaseUrl ?? "",
  supabaseKey: extra.supabaseKey ?? "",
  siteUrl: extra.siteUrl ?? "",
  oneSignalAppId:
    extra.oneSignalAppId ||
    process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID ||
    process.env.ONESIGNAL_APP_ID ||
    "",
  sentryDsn: extra.sentryDsn || process.env.EXPO_PUBLIC_SENTRY_DSN || "",
  posthogApiKey:
    extra.posthogApiKey || process.env.EXPO_PUBLIC_POSTHOG_API_KEY || "",
  posthogHost: extra.posthogHost || process.env.EXPO_PUBLIC_POSTHOG_HOST || "",
};
