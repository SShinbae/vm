/**
 * useMileageLogs - React Query hooks for mileage log operations
 *
 * Provides standardized data fetching for mileage logs with proper caching.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/config";
import {
  mileageLogRepository,
  vehicleRepository,
} from "@/src/services/repositories";
import type {
  MileageLog,
  MileageLogInsert,
  MileageLogUpdate,
} from "@/src/types";

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch mileage logs for a specific vehicle
 */
export function useMileageLogs(vehicleId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.mileageLogs.list(vehicleId),
    queryFn: async () => {
      if (!vehicleId) return [];
      const result = await mileageLogRepository.findByVehicleId(vehicleId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!vehicleId,
  });
}

/**
 * Fetch mileage logs for all accessible vehicles
 */
export function useAllMileageLogs(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.mileageLogs.listByUser(userId || ""),
    queryFn: async () => {
      if (!userId) return [];
      // First get accessible vehicles
      const vehiclesResult =
        await vehicleRepository.findAccessibleVehicles(userId);
      if (!vehiclesResult.success) {
        throw new Error(vehiclesResult.error.message);
      }
      const vehicleIds = vehiclesResult.data.map((v) => v.id);

      // Then get mileage logs for those vehicles
      const logsResult =
        await mileageLogRepository.findByAccessibleVehicles(vehicleIds);
      if (!logsResult.success) {
        throw new Error(logsResult.error.message);
      }
      return logsResult.data;
    },
    enabled: !!userId,
  });
}

/**
 * Fetch a single mileage log by ID
 */
export function useMileageLog(mileageLogId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.mileageLogs.detail(mileageLogId || ""),
    queryFn: async () => {
      if (!mileageLogId) return null;
      const result = await mileageLogRepository.findById(mileageLogId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!mileageLogId,
  });
}

/**
 * Fetch the latest mileage log for a vehicle
 */
export function useLatestMileageLog(vehicleId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.mileageLogs.latest(vehicleId || ""),
    queryFn: async () => {
      if (!vehicleId) return null;
      const result = await mileageLogRepository.findLatest(vehicleId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!vehicleId,
  });
}

/**
 * Fetch the max odometer reading for a vehicle
 */
export function useMaxOdometer(vehicleId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.mileageLogs.list(vehicleId), "max"],
    queryFn: async () => {
      if (!vehicleId) return 0;
      const result = await mileageLogRepository.getMaxOdometer(vehicleId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!vehicleId,
  });
}

/**
 * Fetch total distance traveled for a vehicle
 */
export function useTotalDistance(
  vehicleId: string | undefined,
  startDate?: string,
  endDate?: string,
) {
  return useQuery({
    queryKey: [
      ...queryKeys.mileageLogs.list(vehicleId),
      "distance",
      startDate,
      endDate,
    ],
    queryFn: async () => {
      if (!vehicleId) return 0;
      const result = await mileageLogRepository.getTotalDistance(
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
 * Create a new mileage log
 */
export function useCreateMileageLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MileageLogInsert) => {
      const result = await mileageLogRepository.create(data);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (newLog) => {
      // Invalidate mileage log queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.mileageLogs.list(newLog.vehicle_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.mileageLogs.listByUser(newLog.user_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.mileageLogs.latest(newLog.vehicle_id),
      });
      // Update vehicle mileage
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.detail(newLog.vehicle_id),
      });
      // Invalidate analytics
      queryClient.invalidateQueries({
        queryKey: queryKeys.analytics.performance(newLog.vehicle_id),
      });
    },
  });
}

/**
 * Update a mileage log
 */
export function useUpdateMileageLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: MileageLogUpdate;
    }) => {
      const result = await mileageLogRepository.update(id, data);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (updatedLog) => {
      // Update specific log in cache
      queryClient.setQueryData(
        queryKeys.mileageLogs.detail(updatedLog.id),
        updatedLog,
      );
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.mileageLogs.list(updatedLog.vehicle_id),
      });
      // Update vehicle mileage
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.detail(updatedLog.vehicle_id),
      });
    },
  });
}

/**
 * Delete a mileage log
 */
export function useDeleteMileageLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      mileageLogId,
      vehicleId,
      userId,
    }: {
      mileageLogId: string;
      vehicleId: string;
      userId: string;
    }) => {
      const result = await mileageLogRepository.delete(mileageLogId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return { vehicleId, userId };
    },
    onSuccess: ({ vehicleId, userId }, { mileageLogId }) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.mileageLogs.detail(mileageLogId),
      });
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.mileageLogs.list(vehicleId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.mileageLogs.listByUser(userId),
      });
      // Update vehicle mileage
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.detail(vehicleId),
      });
    },
  });
}
