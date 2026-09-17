import { config } from "@/lib/config";
import { logger } from "@/lib/utils/logger";
import * as Sentry from "@sentry/react-native";

class SentryService {
  private initialized = false;

  initialize(): void {
    if (this.initialized) return;

    const { sentryDsn: dsn } = config;
    if (!dsn) {
      if (__DEV__) {
        logger.warn(
          "Sentry: DSN not configured. Please set SENTRY_DSN in your .env file",
        );
      }
      return;
    }

    Sentry.init({
      dsn,
      enabled: !__DEV__,
      tracesSampleRate: 0.2,
      sendDefaultPii: false,
    });

    this.initialized = true;
    if (__DEV__) {
      logger.log("Sentry: Initialized successfully");
    }
  }

  identifyUser(userId: string, email?: string): void {
    if (!this.initialized) return;

    Sentry.setUser({
      id: userId,
      email: email || undefined,
    });
  }

  clearUser(): void {
    if (!this.initialized) return;

    Sentry.setUser(null);
  }

  captureException(
    error: Error | unknown,
    context?: Record<string, unknown>,
  ): void {
    if (!this.initialized) return;

    if (context) {
      Sentry.withScope((scope) => {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
        Sentry.captureException(error);
      });
    } else {
      Sentry.captureException(error);
    }
  }

  addBreadcrumb(
    category: string,
    message: string,
    level: Sentry.SeverityLevel = "info",
  ): void {
    if (!this.initialized) return;

    Sentry.addBreadcrumb({
      category,
      message,
      level,
    });
  }
}

export const sentryService = new SentryService();
