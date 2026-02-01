/**
 * useFuelLogs - React Query hooks for fuel log operations
 *
 * Provides standardized data fetching for fuel logs with proper caching.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/config";
import {
  fuelLogRepository,
  vehicleRepository,
} from "@/src/services/repositories";
import type { FuelLogInsert, FuelLogUpdate } from "@/src/types";

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch fuel logs for a specific vehicle
 */
export function useFuelLogs(vehicleId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.fuelLogs.list(vehicleId),
    queryFn: async () => {
      if (!vehicleId) return [];
      const result = await fuelLogRepository.findByVehicleId(vehicleId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!vehicleId,
  });
}

/**
 * Fetch fuel logs for all accessible vehicles
 */
export function useAllFuelLogs(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.fuelLogs.listByUser(userId || ""),
    queryFn: async () => {
      if (!userId) return [];
      // First get accessible vehicles
      const vehiclesResult =
        await vehicleRepository.findAccessibleVehicles(userId);
      if (!vehiclesResult.success) {
        throw new Error(vehiclesResult.error.message);
      }
      const vehicleIds = vehiclesResult.data.map((v) => v.id);

      // Then get fuel logs for those vehicles
      const logsResult =
        await fuelLogRepository.findByAccessibleVehicles(vehicleIds);
      if (!logsResult.success) {
        throw new Error(logsResult.error.message);
      }
      return logsResult.data;
    },
    enabled: !!userId,
  });
}

/**
 * Fetch a single fuel log by ID
 */
export function useFuelLog(fuelLogId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.fuelLogs.detail(fuelLogId || ""),
    queryFn: async () => {
      if (!fuelLogId) return null;
      const result = await fuelLogRepository.findById(fuelLogId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!fuelLogId,
  });
}

/**
 * Fetch fuel logs within a date range
 */
export function useFuelLogsByDateRange(
  vehicleId: string | undefined,
  startDate: string | undefined,
  endDate: string | undefined,
) {
  return useQuery({
    queryKey: queryKeys.fuelLogs.listByDateRange(
      vehicleId || "",
      startDate || "",
      endDate || "",
    ),
    queryFn: async () => {
      if (!vehicleId || !startDate || !endDate) return [];
      const result = await fuelLogRepository.findByDateRange(
        vehicleId,
        startDate,
        endDate,
      );
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!vehicleId && !!startDate && !!endDate,
  });
}

/**
 * Fetch the latest fuel log for a vehicle
 */
export function useLatestFuelLog(vehicleId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.fuelLogs.latest(vehicleId || ""),
    queryFn: async () => {
      if (!vehicleId) return null;
      const result = await fuelLogRepository.findLatest(vehicleId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!vehicleId,
  });
}

/**
 * Fetch fuel statistics for a vehicle
 */
export function useFuelStats(
  vehicleId: string | undefined,
  startDate?: string,
  endDate?: string,
) {
  return useQuery({
    queryKey: [
      ...queryKeys.fuelLogs.list(vehicleId),
      "stats",
      startDate,
      endDate,
    ],
    queryFn: async () => {
      if (!vehicleId) return null;
      const result = await fuelLogRepository.getStats(
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
 * Create a new fuel log
 */
export function useCreateFuelLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FuelLogInsert) => {
      const result = await fuelLogRepository.create(data);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (newLog) => {
      // Invalidate fuel log queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.fuelLogs.list(newLog.vehicle_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.fuelLogs.listByUser(newLog.user_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.fuelLogs.latest(newLog.vehicle_id),
      });
      // Invalidate analytics
      queryClient.invalidateQueries({
        queryKey: queryKeys.analytics.fuel(newLog.user_id),
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
 * Update a fuel log
 */
export function useUpdateFuelLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FuelLogUpdate }) => {
      const result = await fuelLogRepository.update(id, data);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (updatedLog) => {
      // Update specific log in cache
      queryClient.setQueryData(
        queryKeys.fuelLogs.detail(updatedLog.id),
        updatedLog,
      );
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.fuelLogs.list(updatedLog.vehicle_id),
      });
    },
  });
}

/**
 * Delete a fuel log
 */
export function useDeleteFuelLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fuelLogId,
      vehicleId,
      userId,
    }: {
      fuelLogId: string;
      vehicleId: string;
      userId: string;
    }) => {
      const result = await fuelLogRepository.delete(fuelLogId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return { vehicleId, userId };
    },
    onSuccess: ({ vehicleId, userId }, { fuelLogId }) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.fuelLogs.detail(fuelLogId),
      });
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.fuelLogs.list(vehicleId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.fuelLogs.listByUser(userId),
      });
      // Invalidate analytics
      queryClient.invalidateQueries({
        queryKey: queryKeys.analytics.fuel(userId),
      });
    },
  });
}
