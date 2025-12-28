/**
 * Performance Monitoring Utilities
 *
 * Based on Chrome Performance best practices:
 * https://developer.chrome.com/docs/performance/insights/document-latency
 *
 * Features:
 * - Measure API response times
 * - Track component render times
 * - Monitor network performance
 * - Detect performance regressions
 */

import React from "react";
import { Platform } from "react-native";

/**
 * Performance metric types
 */
export enum MetricType {
  API_CALL = "api_call",
  COMPONENT_RENDER = "component_render",
  NAVIGATION = "navigation",
  IMAGE_LOAD = "image_load",
  DATA_FETCH = "data_fetch",
}

interface PerformanceMetric {
  type: MetricType;
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  private enabled: boolean = __DEV__; // Only enabled in development
  private maxMetrics: number = 100; // Keep last 100 metrics

  /**
   * Start timing an operation
   */
  startTiming(key: string): void {
    if (!this.enabled) return;
    this.timers.set(key, Date.now());
  }

  /**
   * End timing and record metric
   */
  endTiming(
    key: string,
    type: MetricType,
    name: string,
    metadata?: Record<string, any>,
  ): number | null {
    if (!this.enabled) return null;

    const startTime = this.timers.get(key);
    if (!startTime) {
      console.warn(`[Performance] No start time found for key: ${key}`);
      return null;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(key);

    this.recordMetric({
      type,
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    });

    return duration;
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only the last N metrics to prevent memory issues
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log slow operations
    if (metric.duration > this.getThreshold(metric.type)) {
      console.warn(
        `[Performance] Slow ${metric.type}: ${metric.name} took ${metric.duration}ms`,
        metric.metadata,
      );
    }
  }

  /**
   * Get performance threshold for metric type
   */
  private getThreshold(type: MetricType): number {
    const thresholds = {
      [MetricType.API_CALL]: 600, // Chrome recommends < 600ms server response
      [MetricType.COMPONENT_RENDER]: 100,
      [MetricType.NAVIGATION]: 300,
      [MetricType.IMAGE_LOAD]: 1000,
      [MetricType.DATA_FETCH]: 500,
    };

    return thresholds[type] || 500;
  }

  /**
   * Get metrics by type
   */
  getMetrics(type?: MetricType): PerformanceMetric[] {
    if (type) {
      return this.metrics.filter((m) => m.type === type);
    }
    return [...this.metrics];
  }

  /**
   * Get average duration for a metric type
   */
  getAverageDuration(type: MetricType): number {
    const typeMetrics = this.getMetrics(type);
    if (typeMetrics.length === 0) return 0;

    const sum = typeMetrics.reduce((acc, m) => acc + m.duration, 0);
    return sum / typeMetrics.length;
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalMetrics: number;
    averages: Record<MetricType, number>;
    slowOperations: PerformanceMetric[];
  } {
    const averages = Object.values(MetricType).reduce(
      (acc, type) => {
        acc[type] = this.getAverageDuration(type);
        return acc;
      },
      {} as Record<MetricType, number>,
    );

    const slowOperations = this.metrics.filter(
      (m) => m.duration > this.getThreshold(m.type),
    );

    return {
      totalMetrics: this.metrics.length,
      averages,
      slowOperations,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.timers.clear();
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if monitoring is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator to measure function execution time
 */
export function measurePerformance(type: MetricType, name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const key = `${metricName}-${Date.now()}`;
      performanceMonitor.startTiming(key);

      try {
        const result = await originalMethod.apply(this, args);
        performanceMonitor.endTiming(key, type, metricName);
        return result;
      } catch (error) {
        performanceMonitor.endTiming(key, type, metricName, {
          error: true,
        });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Hook to measure component render time
 */
export function usePerformanceTracking(componentName: string) {
  const isEnabled = performanceMonitor.isEnabled();
  const key = React.useMemo(
    () => `${componentName}-${Date.now()}`,
    [componentName],
  );

  React.useEffect(() => {
    if (!isEnabled) return;

    performanceMonitor.startTiming(key);

    return () => {
      performanceMonitor.endTiming(
        key,
        MetricType.COMPONENT_RENDER,
        componentName,
      );
    };
  }, [key, componentName, isEnabled]);
}

/**
 * Measure API call performance
 */
export async function measureApiCall<T>(
  name: string,
  apiCall: () => Promise<T>,
  metadata?: Record<string, any>,
): Promise<T> {
  const key = `api-${name}-${Date.now()}`;
  performanceMonitor.startTiming(key);

  try {
    const result = await apiCall();
    performanceMonitor.endTiming(key, MetricType.API_CALL, name, {
      ...metadata,
      success: true,
    });
    return result;
  } catch (error) {
    performanceMonitor.endTiming(key, MetricType.API_CALL, name, {
      ...metadata,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

/**
 * Web Performance API integration (for web platform)
 */
export function getWebPerformanceMetrics() {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return null;
  }

  const performance = window.performance;

  // Get navigation timing
  const navigationTiming = performance.getEntriesByType(
    "navigation",
  )[0] as PerformanceNavigationTiming;

  if (!navigationTiming) return null;

  return {
    // Document latency metrics (from Chrome Performance docs)
    serverResponseTime:
      navigationTiming.responseStart - navigationTiming.requestStart,
    domContentLoaded:
      navigationTiming.domContentLoadedEventEnd -
      navigationTiming.domContentLoadedEventStart,
    totalLoadTime: navigationTiming.loadEventEnd - navigationTiming.fetchStart,

    // Redirect metrics
    redirectCount: navigationTiming.redirectCount || 0,
    redirectTime: navigationTiming.redirectEnd - navigationTiming.redirectStart,

    // DNS and connection
    dnsTime:
      navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart,
    tcpTime: navigationTiming.connectEnd - navigationTiming.connectStart,

    // Transfer
    transferSize: (navigationTiming as any).transferSize || 0,
    encodedBodySize: (navigationTiming as any).encodedBodySize || 0,
    decodedBodySize: (navigationTiming as any).decodedBodySize || 0,

    // Compression ratio
    compressionRatio: (navigationTiming as any).encodedBodySize
      ? (
          (navigationTiming as any).decodedBodySize /
          (navigationTiming as any).encodedBodySize
        ).toFixed(2)
      : "N/A",
  };
}

/**
 * Log performance report to console
 */
export function logPerformanceReport(): void {
  if (!performanceMonitor.isEnabled()) {
    console.log("[Performance] Monitoring is disabled");
    return;
  }

  const summary = performanceMonitor.getSummary();

  console.group("📊 Performance Report");
  console.log("Total Metrics:", summary.totalMetrics);

  console.group("📈 Average Durations (ms)");
  Object.entries(summary.averages).forEach(([type, avg]) => {
    if (avg > 0) {
      console.log(`${type}: ${avg.toFixed(2)}ms`);
    }
  });
  console.groupEnd();

  if (summary.slowOperations.length > 0) {
    console.group("⚠️ Slow Operations");
    summary.slowOperations.forEach((op) => {
      console.log(`${op.name} (${op.type}): ${op.duration}ms`, op.metadata);
    });
    console.groupEnd();
  }

  // Web performance metrics
  if (Platform.OS === "web") {
    const webMetrics = getWebPerformanceMetrics();
    if (webMetrics) {
      console.group("🌐 Web Performance Metrics");
      console.log(
        "Server Response Time:",
        `${webMetrics.serverResponseTime.toFixed(2)}ms`,
      );
      console.log("Redirect Count:", webMetrics.redirectCount);
      console.log("Redirect Time:", `${webMetrics.redirectTime.toFixed(2)}ms`);
      console.log("DNS Time:", `${webMetrics.dnsTime.toFixed(2)}ms`);
      console.log("TCP Time:", `${webMetrics.tcpTime.toFixed(2)}ms`);
      console.log("Compression Ratio:", webMetrics.compressionRatio);
      console.groupEnd();
    }
  }

  console.groupEnd();
}

// Auto-log performance report every 30 seconds in dev mode
if (__DEV__) {
  if (typeof setInterval !== "undefined") {
    setInterval(() => {
      const summary = performanceMonitor.getSummary();
      if (summary.totalMetrics > 0) {
        logPerformanceReport();
        performanceMonitor.clear();
      }
    }, 30000); // 30 seconds
  }
}
