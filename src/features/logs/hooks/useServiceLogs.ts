/**
 * useServiceLogs - React Query hooks for service log operations
 *
 * Provides standardized data fetching for service logs with proper caching.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/config";
import {
  serviceLogRepository,
  vehicleRepository,
} from "@/src/services/repositories";
import type {
  ServiceLogInsert,
  ServiceLogUpdate,
  ServiceType,
} from "@/src/types";

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch service logs for a specific vehicle
 */
export function useServiceLogs(vehicleId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.serviceLogs.list(vehicleId),
    queryFn: async () => {
      if (!vehicleId) return [];
      const result = await serviceLogRepository.findByVehicleId(vehicleId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!vehicleId,
  });
}

/**
 * Fetch service logs for all accessible vehicles
 */
export function useAllServiceLogs(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.serviceLogs.listByUser(userId || ""),
    queryFn: async () => {
      if (!userId) return [];
      // First get accessible vehicles
      const vehiclesResult =
        await vehicleRepository.findAccessibleVehicles(userId);
      if (!vehiclesResult.success) {
        throw new Error(vehiclesResult.error.message);
      }
      const vehicleIds = vehiclesResult.data.map((v) => v.id);

      // Then get service logs for those vehicles
      const logsResult =
        await serviceLogRepository.findByAccessibleVehicles(vehicleIds);
      if (!logsResult.success) {
        throw new Error(logsResult.error.message);
      }
      return logsResult.data;
    },
    enabled: !!userId,
  });
}

/**
 * Fetch a single service log by ID
 */
export function useServiceLog(serviceLogId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.serviceLogs.detail(serviceLogId || ""),
    queryFn: async () => {
      if (!serviceLogId) return null;
      const result = await serviceLogRepository.findById(serviceLogId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!serviceLogId,
  });
}

/**
 * Fetch service logs by type
 */
export function useServiceLogsByType(
  vehicleId: string | undefined,
  serviceType: ServiceType | undefined,
) {
  return useQuery({
    queryKey: queryKeys.serviceLogs.listByType(
      vehicleId || "",
      serviceType || "",
    ),
    queryFn: async () => {
      if (!vehicleId || !serviceType) return [];
      const result = await serviceLogRepository.findByType(
        vehicleId,
        serviceType,
      );
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!vehicleId && !!serviceType,
  });
}

/**
 * Fetch the latest service log for a vehicle
 */
export function useLatestServiceLog(vehicleId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.serviceLogs.list(vehicleId), "latest"],
    queryFn: async () => {
      if (!vehicleId) return null;
      const result = await serviceLogRepository.findLatest(vehicleId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!vehicleId,
  });
}

/**
 * Fetch upcoming services
 */
export function useUpcomingServices(vehicleIds: string[], limit = 10) {
  return useQuery({
    queryKey: queryKeys.serviceLogs.upcoming(vehicleIds.join(",")),
    queryFn: async () => {
      if (vehicleIds.length === 0) return [];
      const result = await serviceLogRepository.findUpcoming(vehicleIds, limit);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: vehicleIds.length > 0,
  });
}

/**
 * Fetch service statistics for a vehicle
 */
export function useServiceStats(
  vehicleId: string | undefined,
  startDate?: string,
  endDate?: string,
) {
  return useQuery({
    queryKey: [
      ...queryKeys.serviceLogs.list(vehicleId),
      "stats",
      startDate,
      endDate,
    ],
    queryFn: async () => {
      if (!vehicleId) return null;
      const result = await serviceLogRepository.getStats(
        vehicleId,
        startDate,
        endDate,
      );
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!vehicleId,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new service log
 */
export function useCreateServiceLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ServiceLogInsert) => {
      const result = await serviceLogRepository.create(data);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (newLog) => {
      // Invalidate service log queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.serviceLogs.list(newLog.vehicle_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.serviceLogs.listByUser(newLog.user_id),
      });
      // Invalidate analytics
      queryClient.invalidateQueries({
        queryKey: queryKeys.analytics.service(newLog.user_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.analytics.costs(newLog.user_id),
      });
      // Update vehicle mileage if needed
      if (newLog.odometer_reading) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.vehicles.detail(newLog.vehicle_id),
        });
      }
    },
  });
}

/**
 * Update a service log
 */
export function useUpdateServiceLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: ServiceLogUpdate;
    }) => {
      const result = await serviceLogRepository.update(id, data);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (updatedLog) => {
      // Update specific log in cache
      queryClient.setQueryData(
        queryKeys.serviceLogs.detail(updatedLog.id),
        updatedLog,
      );
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.serviceLogs.list(updatedLog.vehicle_id),
      });
    },
  });
}

/**
 * Delete a service log
 */
export function useDeleteServiceLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      serviceLogId,
      vehicleId,
      userId,
    }: {
      serviceLogId: string;
      vehicleId: string;
      userId: string;
    }) => {
      const result = await serviceLogRepository.delete(serviceLogId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return { vehicleId, userId };
    },
    onSuccess: ({ vehicleId, userId }, { serviceLogId }) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.serviceLogs.detail(serviceLogId),
      });
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.serviceLogs.list(vehicleId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.serviceLogs.listByUser(userId),
      });
      // Invalidate analytics
      queryClient.invalidateQueries({
        queryKey: queryKeys.analytics.service(userId),
      });
    },
  });
}
