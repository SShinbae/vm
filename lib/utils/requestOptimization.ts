/**
 * Request Optimization Utilities
 *
 * Based on Chrome Performance best practices:
 * https://developer.chrome.com/docs/performance/insights/document-latency
 *
 * Features:
 * - Request batching to reduce server round trips
 * - Compression support hints
 * - Request prioritization
 * - Connection optimization
 */

/**
 * Request priority levels for resource loading
 */
export enum RequestPriority {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

/**
 * Enhanced fetch wrapper with compression and optimization hints
 *
 * Note: For web platform only. Mobile platforms handle compression natively.
 */
export async function optimizedFetch(
  url: string,
  options: RequestInit = {},
  priority: RequestPriority = RequestPriority.MEDIUM,
): Promise<Response> {
  const headers = new Headers(options.headers);

  // Request compression from server (gzip, brotli, etc.)
  if (!headers.has("Accept-Encoding")) {
    headers.set("Accept-Encoding", "gzip, deflate, br");
  }

  // Prefer efficient content types
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const enhancedOptions: RequestInit = {
    ...options,
    headers,
  };

  // Add priority hint for modern browsers (web only)
  if (typeof window !== "undefined" && "priority" in Request.prototype) {
    (enhancedOptions as any).priority = priority;
  }

  return fetch(url, enhancedOptions);
}

/**
 * Batch multiple requests into a single operation
 * Reduces server round trips and improves performance
 */
export async function batchRequests<T>(
  requests: (() => Promise<T>)[],
  options: {
    maxConcurrent?: number;
    onProgress?: (completed: number, total: number) => void;
  } = {},
): Promise<T[]> {
  const { maxConcurrent = 5, onProgress } = options;
  const results: T[] = [];
  let completed = 0;

  // Execute requests in batches
  for (let i = 0; i < requests.length; i += maxConcurrent) {
    const batch = requests.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(batch.map((fn) => fn()));
    results.push(...batchResults);

    completed += batch.length;
    onProgress?.(completed, requests.length);
  }

  return results;
}

/**
 * Debounce function to prevent excessive API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: any = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit API call frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Create a request queue with priority support
 */
export class RequestQueue {
  private highPriorityQueue: (() => Promise<any>)[] = [];
  private mediumPriorityQueue: (() => Promise<any>)[] = [];
  private lowPriorityQueue: (() => Promise<any>)[] = [];
  private isProcessing = false;
  private maxConcurrent: number;

  constructor(maxConcurrent: number = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Add request to queue with priority
   */
  enqueue<T>(
    request: () => Promise<T>,
    priority: RequestPriority = RequestPriority.MEDIUM,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const wrappedRequest = async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      switch (priority) {
        case RequestPriority.HIGH:
          this.highPriorityQueue.push(wrappedRequest);
          break;
        case RequestPriority.MEDIUM:
          this.mediumPriorityQueue.push(wrappedRequest);
          break;
        case RequestPriority.LOW:
          this.lowPriorityQueue.push(wrappedRequest);
          break;
      }

      this.process();
    });
  }

  /**
   * Process queued requests
   */
  private async process() {
    if (this.isProcessing) return;

    this.isProcessing = true;

    while (this.hasRequests()) {
      const batch: (() => Promise<any>)[] = [];

      // Fill batch with high priority first, then medium, then low
      while (batch.length < this.maxConcurrent && this.hasRequests()) {
        if (this.highPriorityQueue.length > 0) {
          batch.push(this.highPriorityQueue.shift()!);
        } else if (this.mediumPriorityQueue.length > 0) {
          batch.push(this.mediumPriorityQueue.shift()!);
        } else if (this.lowPriorityQueue.length > 0) {
          batch.push(this.lowPriorityQueue.shift()!);
        }
      }

      await Promise.allSettled(batch.map((fn) => fn()));
    }

    this.isProcessing = false;
  }

  /**
   * Check if queue has requests
   */
  private hasRequests(): boolean {
    return (
      this.highPriorityQueue.length > 0 ||
      this.mediumPriorityQueue.length > 0 ||
      this.lowPriorityQueue.length > 0
    );
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      high: this.highPriorityQueue.length,
      medium: this.mediumPriorityQueue.length,
      low: this.lowPriorityQueue.length,
      total:
        this.highPriorityQueue.length +
        this.mediumPriorityQueue.length +
        this.lowPriorityQueue.length,
      processing: this.isProcessing,
    };
  }
}

/**
 * Global request queue instance
 */
export const globalRequestQueue = new RequestQueue(3);
