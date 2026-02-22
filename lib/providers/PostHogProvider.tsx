import React from "react";
import { PostHogProvider as PHProvider } from "posthog-react-native";
import { getPostHogConfig } from "../services/posthogService";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const config = getPostHogConfig();
  if (!config) {
    return <>{children}</>;
  }

  return (
    <PHProvider
      apiKey={config.apiKey}
      options={{
        host: config.host,
        enableSessionReplay: false,
      }}
      autocapture={false}
    >
      {children}
    </PHProvider>
  );
}
