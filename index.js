import { Platform } from "react-native";

if (Platform.OS !== "web") {
  // On native, Sentry must initialize before React renders
  const { sentryService } = require("./lib/services/sentryService");
  sentryService.initialize();
} else {
  // On web, defer Sentry to avoid blocking the main bundle parse
  setTimeout(() => {
    const { sentryService } = require("./lib/services/sentryService");
    sentryService.initialize();
  }, 0);
}

// eslint-disable-next-line import/first
import "expo-router/entry";
