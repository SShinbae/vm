import { sentryService } from "./lib/services/sentryService";
sentryService.initialize();

// eslint-disable-next-line import/first -- Sentry must initialize before React renders
import "expo-router/entry";
