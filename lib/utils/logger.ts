/**
 * Centralized Logger Utility
 *
 * Provides environment-aware logging that:
 * - Only outputs logs in development mode
 * - Supports different log levels
 * - Can be easily imported throughout the codebase
 *
 * Usage:
 *   import { logger } from '@/lib/utils/logger';
 *   logger.log('Debug info', data);
 *   logger.error('Error occurred', error);
 */

type LogLevel = "debug" | "log" | "info" | "warn" | "error";

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  prefix?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  log: 1,
  info: 2,
  warn: 3,
  error: 4,
};

class Logger {
  private config: LoggerConfig;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      enabled: __DEV__,
      minLevel: __DEV__ ? "debug" : "error",
      prefix: "",
      ...config,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled && level !== "error") {
      return false;
    }
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  private formatMessage(prefix: string, args: unknown[]): unknown[] {
    const fullPrefix = this.config.prefix
      ? `[${this.config.prefix}] ${prefix}`
      : prefix;
    return fullPrefix ? [fullPrefix, ...args] : args;
  }

  debug(...args: unknown[]): void {
    if (this.shouldLog("debug")) {
      console.debug(...this.formatMessage("", args));
    }
  }

  log(...args: unknown[]): void {
    if (this.shouldLog("log")) {
      console.log(...this.formatMessage("", args));
    }
  }

  info(...args: unknown[]): void {
    if (this.shouldLog("info")) {
      console.info(...this.formatMessage("ℹ️", args));
    }
  }

  warn(...args: unknown[]): void {
    if (this.shouldLog("warn")) {
      console.warn(...this.formatMessage("⚠️", args));
    }
  }

  error(...args: unknown[]): void {
    // Errors always log (for production debugging)
    console.error(...this.formatMessage("❌", args));
  }

  /**
   * Create a child logger with a specific prefix
   * Useful for service-specific logging
   */
  child(prefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix: this.config.prefix ? `${this.config.prefix}:${prefix}` : prefix,
    });
  }

  /**
   * Group related logs together (dev only)
   */
  group(label: string, fn: () => void): void {
    if (__DEV__) {
      console.group(label);
      try {
        fn();
      } finally {
        console.groupEnd();
      }
    }
  }

  /**
   * Time an operation (dev only)
   */
  time<T>(label: string, fn: () => T): T {
    if (__DEV__) {
      console.time(label);
      try {
        return fn();
      } finally {
        console.timeEnd(label);
      }
    }
    return fn();
  }

  /**
   * Async version of time
   */
  async timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    if (__DEV__) {
      console.time(label);
      try {
        return await fn();
      } finally {
        console.timeEnd(label);
      }
    }
    return fn();
  }
}

// Default logger instance
export const logger = new Logger();

// Pre-configured loggers for common services
export const authLogger = logger.child("Auth");
export const vehicleLogger = logger.child("Vehicle");
export const notificationLogger = logger.child("Notification");
export const imageLogger = logger.child("Image");
export const groupLogger = logger.child("Group");
export const analyticsLogger = logger.child("Analytics");
export const serviceLogger = logger.child("Service");

// Export class for custom instances
export { Logger };

// Type exports
export type { LogLevel, LoggerConfig };
