import { oneSignalService } from "./oneSignalService";

/**
 * Lazy initialization wrapper for OneSignal
 * Defers OneSignal initialization to prevent blocking the critical rendering path
 */

let initPromise: Promise<void> | null = null;

/**
 * Initializes OneSignal in a deferred manner (after initial app render)
 * Subsequent calls return the same promise to prevent multiple initializations
 */
export const initializeOneSignalLazy = (): Promise<void> => {
  if (!initPromise) {
    initPromise = new Promise((resolve) => {
      // Defer to next tick to allow initial render to complete
      setTimeout(async () => {
        try {
          await oneSignalService.initialize();
          resolve();
        } catch (error) {
          console.error("OneSignal lazy initialization failed:", error);
          resolve(); // Resolve anyway to prevent blocking
        }
      }, 0);
    });
  }
  return initPromise;
};

/**
 * Resets the initialization promise (useful for testing)
 */
export const resetOneSignalLazy = () => {
  initPromise = null;
};
