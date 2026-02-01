/**
 * useVehicles - React Query hook for vehicle queries
 *
 * Provides standardized data fetching for vehicles with proper caching.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/config";
import { vehicleRepository } from "@/src/services/repositories";
import type {
  Vehicle,
  VehicleInsert,
  VehicleUpdate,
  VehicleWithGroupInfo,
  VehicleWithLogs,
  VehicleFilters,
} from "@/src/types";

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all vehicles for a user
 */
export function useVehicles(
  userId: string | undefined,
  filters?: VehicleFilters,
) {
  return useQuery({
    queryKey: queryKeys.vehicles.list(
      userId || "",
      filters as Record<string, unknown> | undefined,
    ),
    queryFn: async () => {
      if (!userId) return [];
      const result = await vehicleRepository.findByUserId(userId, {
        orderBy: filters?.sortBy
          ? { column: filters.sortBy, ascending: filters.sortOrder === "asc" }
          : { column: "created_at", ascending: false },
      });
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!userId,
  });
}

/**
 * Fetch accessible vehicles (owned + shared via groups)
 */
export function useAccessibleVehicles(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.vehicles.accessible(userId || ""),
    queryFn: async () => {
      if (!userId) return [];
      const result = await vehicleRepository.findAccessibleVehicles(userId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!userId,
  });
}

/**
 * Fetch a single vehicle by ID
 */
export function useVehicle(vehicleId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.vehicles.detail(vehicleId || ""),
    queryFn: async () => {
      if (!vehicleId) return null;
      const result = await vehicleRepository.findById(vehicleId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!vehicleId,
  });
}

/**
 * Fetch a vehicle with all its logs
 */
export function useVehicleWithLogs(vehicleId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.vehicles.detail(vehicleId || ""), "logs"],
    queryFn: async () => {
      if (!vehicleId) return null;
      const result = await vehicleRepository.findWithLogs(vehicleId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!vehicleId,
  });
}

/**
 * Fetch vehicles with sharing information
 */
export function useVehiclesWithSharing(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.vehicles.withSharing(userId || ""),
    queryFn: async () => {
      if (!userId) return [];
      const result = await vehicleRepository.findWithSharingInfo(userId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!userId,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new vehicle
 */
export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: VehicleInsert) => {
      const result = await vehicleRepository.create(data);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (newVehicle) => {
      // Invalidate vehicle lists
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.accessible(newVehicle.user_id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.withSharing(newVehicle.user_id),
      });
    },
  });
}

/**
 * Update a vehicle
 */
export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: VehicleUpdate }) => {
      const result = await vehicleRepository.update(id, data);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (updatedVehicle) => {
      // Update the specific vehicle in cache
      queryClient.setQueryData(
        queryKeys.vehicles.detail(updatedVehicle.id),
        updatedVehicle,
      );
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.lists() });
    },
  });
}

/**
 * Delete a vehicle
 */
export function useDeleteVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vehicleId: string) => {
      const result = await vehicleRepository.delete(vehicleId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
    },
    onSuccess: (_, vehicleId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.vehicles.detail(vehicleId),
      });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.lists() });
      // Invalidate related logs
      queryClient.invalidateQueries({
        queryKey: queryKeys.fuelLogs.list(vehicleId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.serviceLogs.list(vehicleId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.mileageLogs.list(vehicleId),
      });
    },
  });
}

/**
 * Share a vehicle with groups
 */
export function useShareVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      vehicleId,
      groupIds,
    }: {
      vehicleId: string;
      groupIds: string[];
    }) => {
      const result = await vehicleRepository.shareWithGroups(
        vehicleId,
        groupIds,
      );
      if (!result.success) {
        throw new Error(result.error.message);
      }
    },
    onSuccess: () => {
      // Invalidate sharing queries
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
    },
  });
}

/**
 * Update vehicle mileage
 */
export function useUpdateVehicleMileage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      vehicleId,
      mileage,
    }: {
      vehicleId: string;
      mileage: number;
    }) => {
      const result = await vehicleRepository.updateMileage(vehicleId, mileage);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (updatedVehicle) => {
      queryClient.setQueryData(
        queryKeys.vehicles.detail(updatedVehicle.id),
        updatedVehicle,
      );
    },
  });
}

/**
 * Search vehicles
 */
export function useSearchVehicles(
  userId: string | undefined,
  searchTerm: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [...queryKeys.vehicles.list(userId || ""), "search", searchTerm],
    queryFn: async () => {
      if (!userId || !searchTerm) return [];
      const result = await vehicleRepository.search(userId, searchTerm);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!userId && !!searchTerm && enabled,
  });
}
