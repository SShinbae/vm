/**
 * React Query configuration for optimal performance
 *
 * Key features:
 * - Stale-while-revalidate: Shows cached data immediately while fetching fresh data
 * - Smart retry logic: Retries failed requests but not auth errors
 * - Background refetching: Keeps data fresh without blocking UI
 * - Request deduplication: Prevents duplicate requests for same data
 * - Optimized cache times based on Chrome Performance best practices
 */

import { QueryClient, QueryClientConfig } from "@tanstack/react-query";

// Error type for retry logic
interface QueryError {
  status?: number;
  message?: string;
}

// Query client configuration
const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Show cached data immediately, then refetch in background
      staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
      gcTime: 15 * 60 * 1000, // Keep unused data in cache for 15 minutes

      // Retry logic - don't retry auth errors
      retry: (failureCount, error) => {
        const queryError = error as QueryError;
        // Don't retry on 401 (auth errors) or 404 (not found)
        if (queryError?.status === 401 || queryError?.status === 404) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Background refetching for fresh data
      refetchOnWindowFocus: true, // Refetch when user returns to app
      refetchOnReconnect: true, // Refetch when internet reconnects
      refetchOnMount: true, // Use cached data immediately, refetch in background if stale

      // Network mode
      networkMode: "online", // Only fetch when online

      // Performance optimizations
      structuralSharing: true, // Share unchanged data between queries
      refetchInterval: false, // Disable auto-refetch unless specifically enabled
    },
    mutations: {
      // Don't retry mutations by default (user actions should be explicit)
      retry: false,

      // Network mode
      networkMode: "online",
    },
  },
};

// Create and export the query client instance
export const queryClient = new QueryClient(queryClientConfig);

// Export the config for testing
export { queryClientConfig };

// Re-export query keys from the same location for convenience
export { queryKeys } from "./queryKeys";
