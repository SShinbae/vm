/**
 * Network utility functions for handling timeouts and error recovery
 */

/**
 * Wraps a promise with a timeout to prevent hanging requests
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds (default: 10000ms)
 * @returns Promise that resolves/rejects within the timeout period
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 10000,
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`Request timeout after ${timeoutMs}ms`)),
      timeoutMs,
    ),
  );
  return Promise.race([promise, timeoutPromise]);
}

/**
 * Safely executes multiple promises with individual timeout protection
 * Uses Promise.allSettled to prevent one failure from blocking others
 * @param promises Array of promises to execute
 * @param timeoutMs Timeout for each promise (default: 8000ms)
 * @returns Promise that resolves with array of PromiseSettledResult
 */
export async function safePromiseAll<T>(
  promises: Promise<T>[],
  timeoutMs: number = 8000,
): Promise<PromiseSettledResult<T>[]> {
  const wrappedPromises = promises.map((promise) =>
    withTimeout(promise, timeoutMs),
  );
  return Promise.allSettled(wrappedPromises);
}

/**
 * Executes a promise with retry logic
 * @param promiseFactory Function that returns a promise
 * @param maxRetries Maximum number of retries (default: 2)
 * @param timeoutMs Timeout for each attempt (default: 8000ms)
 * @param retryDelay Delay between retries in ms (default: 1000ms)
 * @returns Promise that resolves or rejects after all retries exhausted
 */
export async function withRetry<T>(
  promiseFactory: () => Promise<T>,
  maxRetries: number = 2,
  timeoutMs: number = 8000,
  retryDelay: number = 1000,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await withTimeout(promiseFactory(), timeoutMs);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't delay after the last attempt
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

/**
 * Type guard to check if a PromiseSettledResult is fulfilled
 * @param result The PromiseSettledResult to check
 * @returns true if the result is fulfilled
 */
export function isFulfilled<T>(
  result: PromiseSettledResult<T>,
): result is PromiseFulfilledResult<T> {
  return result.status === "fulfilled";
}

/**
 * Type guard to check if a PromiseSettledResult is rejected
 * @param result The PromiseSettledResult to check
 * @returns true if the result is rejected
 */
export function isRejected<T>(
  result: PromiseSettledResult<T>,
): result is PromiseRejectedResult {
  return result.status === "rejected";
}
