/**
 * useVehicles Hook Tests
 *
 * Tests for the vehicle data fetching hook including loading states,
 * data fetching, refresh functionality, and error handling.
 */

import { renderHook, waitFor } from "@testing-library/react-native";
import React, { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NavigationContainer } from "@react-navigation/native";

import { useVehicles } from "@/hooks/useVehicles";
import { VehicleService } from "@/lib/services/vehicleService";

// Mock dependencies
jest.mock("@/lib/services/vehicleService", () => ({
  VehicleService: {
    getVehiclesSeparated: jest.fn(),
  },
}));

jest.mock("@/lib/contexts/DialogContext", () => ({
  useDialog: () => ({
    showError: jest.fn(),
    showConfirm: jest.fn(),
    showSuccess: jest.fn(),
  }),
}));

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useFocusEffect: (callback: () => void) => {
      require("react").useEffect(() => {
        callback();
      }, [callback]);
    },
  };
});

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

const createWrapper = () => {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>{children}</NavigationContainer>
      </QueryClientProvider>
    );
  };
};

describe("useVehicles", () => {
  const mockOwnVehicle = {
    id: "v1",
    make: "Toyota",
    model: "Camry",
    year: 2022,
    is_own_vehicle: true,
  };

  const mockSharedVehicle = {
    id: "v2",
    make: "Honda",
    model: "Civic",
    year: 2021,
    is_own_vehicle: false,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    // Set default mock for all tests
    (VehicleService.getVehiclesSeparated as jest.Mock).mockResolvedValue({
      data: { ownVehicles: [], sharedVehicles: [] },
      error: null,
    });
  });

  describe("Initial State", () => {
    it("should start with loading true", async () => {
      const { result } = renderHook(() => useVehicles(), {
        wrapper: createWrapper(),
      });

      // Initial state should be loading
      expect(result.current.loading).toBe(true);
      expect(result.current.refreshing).toBe(false);
    });
  });

  describe("Data Fetching", () => {
    it("should call VehicleService.getVehiclesSeparated on mount", async () => {
      (VehicleService.getVehiclesSeparated as jest.Mock).mockResolvedValue({
        data: {
          ownVehicles: [mockOwnVehicle],
          sharedVehicles: [mockSharedVehicle],
        },
        error: null,
      });

      renderHook(() => useVehicles(), {
        wrapper: createWrapper(),
      });

      // Wait for the service to be called
      await waitFor(() => {
        expect(VehicleService.getVehiclesSeparated).toHaveBeenCalled();
      });
    });

    it("should update allVehicles after fetch completes", async () => {
      (VehicleService.getVehiclesSeparated as jest.Mock).mockResolvedValue({
        data: {
          ownVehicles: [mockOwnVehicle],
          sharedVehicles: [mockSharedVehicle],
        },
        error: null,
      });

      const { result } = renderHook(() => useVehicles(), {
        wrapper: createWrapper(),
      });

      await waitFor(
        () => {
          expect(result.current.allVehicles.length).toBe(2);
        },
        { timeout: 5000 },
      );

      expect(result.current.allVehicles).toContainEqual(
        expect.objectContaining({ id: "v1", is_own_vehicle: true }),
      );
      expect(result.current.allVehicles).toContainEqual(
        expect.objectContaining({ id: "v2", is_own_vehicle: false }),
      );
    });
  });

  describe("Hook API", () => {
    it("should expose all expected properties and functions", () => {
      const { result } = renderHook(() => useVehicles(), {
        wrapper: createWrapper(),
      });

      // Check functions
      expect(typeof result.current.refetch).toBe("function");
      expect(typeof result.current.onRefresh).toBe("function");

      // Check arrays
      expect(Array.isArray(result.current.allVehicles)).toBe(true);

      // Check booleans
      expect(typeof result.current.loading).toBe("boolean");
      expect(typeof result.current.refreshing).toBe("boolean");
    });
  });

  describe("Error Handling", () => {
    it("should handle error response from service", async () => {
      (VehicleService.getVehiclesSeparated as jest.Mock).mockResolvedValue({
        data: null,
        error: "Failed to fetch",
      });

      const { result } = renderHook(() => useVehicles(), {
        wrapper: createWrapper(),
      });

      // Should still call the service
      await waitFor(() => {
        expect(VehicleService.getVehiclesSeparated).toHaveBeenCalled();
      });

      // Vehicles should remain empty on error
      expect(result.current.allVehicles).toEqual([]);
    });
  });
});
