import { config } from "@/lib/config";
import { logger } from "@/lib/utils/logger";

interface PostHogConfig {
  apiKey: string;
  host: string;
}

export function getPostHogConfig(): PostHogConfig | null {
  const { posthogApiKey: apiKey, posthogHost: host } = config;

  if (!apiKey) {
    if (__DEV__) {
      logger.warn(
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
