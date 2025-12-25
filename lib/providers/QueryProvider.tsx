import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { queryClient } from "../config/queryClient";

/**
 * React Query Provider for caching and request deduplication
 *
 * Benefits:
 * - Automatic caching with stale-while-revalidate pattern
 * - Request deduplication (prevents duplicate API calls)
 * - Background refetching
 * - Automatic garbage collection of unused cache
 * - Optimistic updates support
 */

export const QueryProvider = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

export { queryClient };
