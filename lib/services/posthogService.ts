import Constants from "expo-constants";

interface PostHogConfig {
  apiKey: string;
  host: string;
}

export function getPostHogConfig(): PostHogConfig | null {
  const apiKey =
    Constants.expoConfig?.extra?.posthogApiKey ||
    process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
  const host =
    Constants.expoConfig?.extra?.posthogHost ||
    process.env.EXPO_PUBLIC_POSTHOG_HOST;

  if (!apiKey) {
    if (__DEV__) {
      console.warn(
        "PostHog: API key not configured. Please set POSTHOG_API_KEY in your .env file",
      );
    }
    return null;
  }

  return {
    apiKey,
    host: host || "https://us.i.posthog.com",
  };
}
