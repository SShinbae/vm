import { QueryClient } from "@tanstack/react-query";

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
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Show cached data immediately, then refetch in background
      staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes (increased from 2min)
      gcTime: 15 * 60 * 1000, // Keep unused data in cache for 15 minutes (increased from 10min)

      // Retry logic - don't retry auth errors
      retry: (failureCount, error: any) => {
        // Don't retry on 401 (auth errors) or 404 (not found)
        if (error?.status === 401 || error?.status === 404) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Background refetching for fresh data
      refetchOnWindowFocus: true, // Refetch when user returns to app
      refetchOnReconnect: true, // Refetch when internet reconnects
      refetchOnMount: "always", // Always refetch on mount for fresh data

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
});

/**
 * Query key factory for consistent cache management
 */
export const queryKeys = {
  // Notifications
  notifications: {
    all: ["notifications"] as const,
    list: (userId: string) => ["notifications", "list", userId] as const,
    detail: (notificationId: string) =>
      ["notifications", "detail", notificationId] as const,
  },

  // User data for notification service
  userData: {
    all: ["userData"] as const,
    groups: (userId: string) => ["userData", "groups", userId] as const,
    vehicles: (userId: string) => ["userData", "vehicles", userId] as const,
    sharedVehicles: (groupIds: string[]) =>
      ["userData", "sharedVehicles", groupIds] as const,
  },

  // Invitations
  invitations: {
    all: ["invitations"] as const,
    pending: (userId: string) => ["invitations", "pending", userId] as const,
  },

  // Join requests (for group admins)
  joinRequests: {
    all: ["joinRequests"] as const,
    pending: (userId: string) => ["joinRequests", "pending", userId] as const,
  },
} as const;
