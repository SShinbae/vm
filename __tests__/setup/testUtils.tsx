/**
 * Test Utilities
 *
 * Provides helper functions for testing React components and hooks.
 */

import React, { ReactElement, ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/lib/contexts/ThemeContext";

// ============================================================================
// Query Client for Tests
// ============================================================================

/**
 * Create a fresh QueryClient for each test
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// ============================================================================
// Test Providers
// ============================================================================

interface TestProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

/**
 * Wrapper component with all providers needed for testing
 */
function TestProviders({ children, queryClient }: TestProvidersProps) {
  const client = queryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryClientProvider>
  );
}

// ============================================================================
// Custom Render Function
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}

/**
 * Custom render function that wraps components with test providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {},
): ReturnType<typeof render> & { queryClient: QueryClient } {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <TestProviders queryClient={queryClient}>{children}</TestProviders>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// ============================================================================
// Mock Data Factories
// ============================================================================

/**
 * Create a mock user
 */
export function createMockUser(overrides = {}) {
  return {
    id: "test-user-id",
    email: "test@example.com",
    username: "testuser",
    profile: {
      id: "test-user-id",
      email: "test@example.com",
      full_name: "Test User",
      username: "testuser",
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    ...overrides,
  };
}

/**
 * Create a mock vehicle
 */
export function createMockVehicle(overrides = {}) {
  return {
    id: "test-vehicle-id",
    user_id: "test-user-id",
    make: "Toyota",
    model: "Camry",
    year: 2022,
    license_plate: "ABC123",
    vin: null,
    main_image_url: null,
    color: "Blue",
    current_mileage: 50000,
    shared_with_groups: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock fuel log
 */
export function createMockFuelLog(overrides = {}) {
  return {
    id: "test-fuel-log-id",
    vehicle_id: "test-vehicle-id",
    user_id: "test-user-id",
    liters_filled: 45.5,
    cost: 95.0,
    date: new Date().toISOString().split("T")[0],
    odometer_reading: 51000,
    location: "Shell Gas Station",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock service log
 */
export function createMockServiceLog(overrides = {}) {
  return {
    id: "test-service-log-id",
    vehicle_id: "test-vehicle-id",
    user_id: "test-user-id",
    service_type: "oil_change",
    description: "Regular oil change",
    cost: 75.0,
    date: new Date().toISOString().split("T")[0],
    odometer_reading: 50000,
    next_service_due: null,
    next_service_mileage: null,
    receipt_image_url: null,
    ocr_extracted_data: null,
    auto_filled: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock mileage log
 */
export function createMockMileageLog(overrides = {}) {
  return {
    id: "test-mileage-log-id",
    vehicle_id: "test-vehicle-id",
    user_id: "test-user-id",
    odometer_reading: 50500,
    date: new Date().toISOString().split("T")[0],
    notes: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock group
 */
export function createMockGroup(overrides = {}) {
  return {
    id: "test-group-id",
    name: "Test Group",
    description: "A test group",
    owner_id: "test-user-id",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// Async Utilities
// ============================================================================

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  { timeout = 5000, interval = 50 } = {},
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Flush all pending promises
 */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

// ============================================================================
// Re-exports
// ============================================================================

export * from "@testing-library/react-native";
export { renderWithProviders as render };
