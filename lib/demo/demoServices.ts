/**
 * Demo Service Layer
 *
 * Provides mock implementations of all service methods.
 * These methods return hardcoded data instead of making real API calls.
 */

import {
  DEMO_USER,
  DEMO_VEHICLES,
  DEMO_FUEL_LOGS,
  DEMO_SERVICE_LOGS,
  DEMO_GROUPS,
  DEMO_DASHBOARD_STATS,
  DEMO_NOTIFICATIONS,
  getMockVehicleById,
  getMockFuelLogsByVehicleId,
  getMockServiceLogsByVehicleId,
  getMockMileageLogsByVehicleId,
  type DemoVehicle,
  type DemoFuelLog,
  type DemoServiceLog,
  type DemoMileageLog,
  type DemoProfile,
} from "./mockData";

// Simulate API delay
const simulateDelay = (ms: number = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Generic API response wrapper
interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Demo Vehicle Service
 */
export const demoVehicleService = {
  /**
   * Get all vehicles for the demo user
   */
  async getVehicles(): Promise<ApiResponse<DemoVehicle[]>> {
    await simulateDelay();
    return {
      data: [...DEMO_VEHICLES],
      error: null,
    };
  },

  /**
   * Get vehicles with sharing information
   */
  async getVehiclesWithSharing(): Promise<ApiResponse<any[]>> {
    await simulateDelay();
    const vehiclesWithSharing = DEMO_VEHICLES.map((vehicle) => ({
      ...vehicle,
      is_owner: true,
      vehicle_images: [],
      vehicle_group_shares: [],
    }));
    return {
      data: vehiclesWithSharing,
      error: null,
    };
  },

  /**
   * Get a single vehicle by ID
   */
  async getVehicleById(id: string): Promise<ApiResponse<DemoVehicle>> {
    await simulateDelay();
    const vehicle = getMockVehicleById(id);
    if (!vehicle) {
      return {
        data: null,
        error: new Error("Vehicle not found"),
      };
    }
    return {
      data: vehicle,
      error: null,
    };
  },

  /**
   * Create a new vehicle (demo mode - doesn't persist)
   */
  async createVehicle(
    vehicleData: Partial<DemoVehicle>,
  ): Promise<ApiResponse<DemoVehicle>> {
    await simulateDelay();
    const newVehicle: DemoVehicle = {
      id: `demo-vehicle-${Date.now()}`,
      user_id: "demo-user-001",
      make: vehicleData.make || "",
      model: vehicleData.model || "",
      year: vehicleData.year || new Date().getFullYear(),
      vin: vehicleData.vin || null,
      license_plate: vehicleData.license_plate || "",
      color: vehicleData.color || null,
      current_mileage: vehicleData.current_mileage || 0,
      fuel_type: vehicleData.fuel_type || null,
      notes: vehicleData.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return {
      data: newVehicle,
      error: null,
    };
  },

  /**
   * Update a vehicle (demo mode - doesn't persist)
   */
  async updateVehicle(
    id: string,
    updates: Partial<DemoVehicle>,
  ): Promise<ApiResponse<DemoVehicle>> {
    await simulateDelay();
    const vehicle = getMockVehicleById(id);
    if (!vehicle) {
      return {
        data: null,
        error: new Error("Vehicle not found"),
      };
    }
    const updated = {
      ...vehicle,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return {
      data: updated,
      error: null,
    };
  },

  /**
   * Delete a vehicle (demo mode - doesn't persist)
   */
  async deleteVehicle(_id: string): Promise<ApiResponse<void>> {
    await simulateDelay();
    return {
      data: null,
      error: null,
    };
  },
};

/**
 * Demo Logging Service
 */
export const demoLoggingService = {
  /**
   * Get fuel logs for a vehicle
   */
  async getFuelLogs(vehicleId: string): Promise<ApiResponse<DemoFuelLog[]>> {
    await simulateDelay();
    const logs = getMockFuelLogsByVehicleId(vehicleId);
    return {
      data: logs,
      error: null,
    };
  },

  /**
   * Get all fuel logs for all demo vehicles
   */
  async getAllFuelLogs(): Promise<ApiResponse<DemoFuelLog[]>> {
    await simulateDelay();
    return {
      data: [...DEMO_FUEL_LOGS],
      error: null,
    };
  },

  /**
   * Create a fuel log (demo mode - doesn't persist)
   */
  async createFuelLog(
    logData: Partial<DemoFuelLog>,
  ): Promise<ApiResponse<DemoFuelLog>> {
    await simulateDelay();
    const newLog: DemoFuelLog = {
      id: `demo-fuel-${Date.now()}`,
      vehicle_id: logData.vehicle_id || "",
      user_id: "demo-user-001",
      date: logData.date || new Date().toISOString(),
      odometer_reading: logData.odometer_reading || 0,
      liters_filled: logData.liters_filled || 0,
      cost: logData.cost || null,
      location: logData.location || null,
      created_at: new Date().toISOString(),
    };
    return {
      data: newLog,
      error: null,
    };
  },

  /**
   * Get service logs for a vehicle
   */
  async getServiceLogs(
    vehicleId: string,
  ): Promise<ApiResponse<DemoServiceLog[]>> {
    await simulateDelay();
    const logs = getMockServiceLogsByVehicleId(vehicleId);
    return {
      data: logs,
      error: null,
    };
  },

  /**
   * Get all service logs for all demo vehicles
   */
  async getAllServiceLogs(): Promise<ApiResponse<DemoServiceLog[]>> {
    await simulateDelay();
    return {
      data: [...DEMO_SERVICE_LOGS],
      error: null,
    };
  },

  /**
   * Create a service log (demo mode - doesn't persist)
   */
  async createServiceLog(
    logData: Partial<DemoServiceLog>,
  ): Promise<ApiResponse<DemoServiceLog>> {
    await simulateDelay();
    const newLog: DemoServiceLog = {
      id: `demo-service-${Date.now()}`,
      vehicle_id: logData.vehicle_id || "",
      user_id: "demo-user-001",
      date: logData.date || new Date().toISOString(),
      odometer_reading: logData.odometer_reading || 0,
      service_type: logData.service_type || "",
      description: logData.description || "",
      cost: logData.cost || null,
      next_service_due: logData.next_service_due || null,
      created_at: new Date().toISOString(),
    };
    return {
      data: newLog,
      error: null,
    };
  },

  /**
   * Get mileage logs for a vehicle
   */
  async getMileageLogs(
    vehicleId: string,
  ): Promise<ApiResponse<DemoMileageLog[]>> {
    await simulateDelay();
    const logs = getMockMileageLogsByVehicleId(vehicleId);
    return {
      data: logs,
      error: null,
    };
  },

  /**
   * Create a mileage log (demo mode - doesn't persist)
   */
  async createMileageLog(
    logData: Partial<DemoMileageLog>,
  ): Promise<ApiResponse<DemoMileageLog>> {
    await simulateDelay();
    const newLog: DemoMileageLog = {
      id: `demo-mileage-${Date.now()}`,
      vehicle_id: logData.vehicle_id || "",
      user_id: "demo-user-001",
      date: logData.date || new Date().toISOString(),
      odometer_reading: logData.odometer_reading || 0,
      notes: logData.notes || null,
      created_at: new Date().toISOString(),
    };
    return {
      data: newLog,
      error: null,
    };
  },
};

/**
 * Demo Analytics Service
 */
export const demoAnalyticsService = {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<ApiResponse<typeof DEMO_DASHBOARD_STATS>> {
    await simulateDelay();
    return {
      data: { ...DEMO_DASHBOARD_STATS },
      error: null,
    };
  },

  /**
   * Calculate fuel economy for a vehicle
   */
  async calculateFuelEconomy(vehicleId: string): Promise<ApiResponse<number>> {
    await simulateDelay();
    // Simple calculation based on demo data
    const fuelLogs = getMockFuelLogsByVehicleId(vehicleId);
    if (fuelLogs.length < 2) {
      return { data: 0, error: null };
    }

    // Calculate average MPG
    const avgMPG = 28.5; // Simplified for demo
    return {
      data: avgMPG,
      error: null,
    };
  },

  /**
   * Get cost breakdown by category
   */
  async getCostBreakdown(): Promise<ApiResponse<any>> {
    await simulateDelay();
    const breakdown = {
      fuel: DEMO_DASHBOARD_STATS.totalCosts.fuel,
      service: DEMO_DASHBOARD_STATS.totalCosts.service,
      total: DEMO_DASHBOARD_STATS.totalCosts.total,
    };
    return {
      data: breakdown,
      error: null,
    };
  },
};

/**
 * Demo Group Service
 */
export const demoGroupService = {
  /**
   * Get all groups
   */
  async getGroups(): Promise<ApiResponse<typeof DEMO_GROUPS>> {
    await simulateDelay();
    return {
      data: [...DEMO_GROUPS],
      error: null,
    };
  },

  /**
   * Create a group (demo mode - doesn't persist)
   */
  async createGroup(groupData: any): Promise<ApiResponse<any>> {
    await simulateDelay();
    const newGroup = {
      id: `demo-group-${Date.now()}`,
      name: groupData.name,
      description: groupData.description,
      owner_id: "demo-user-001",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return {
      data: newGroup,
      error: null,
    };
  },
};

/**
 * Demo Auth Service
 */
export const demoAuthService = {
  /**
   * Get demo user profile
   */
  async getProfile(): Promise<ApiResponse<DemoProfile>> {
    await simulateDelay();
    return {
      data: { ...DEMO_USER },
      error: null,
    };
  },

  /**
   * Sign in (demo mode)
   */
  async signIn(_email: string, _password: string): Promise<ApiResponse<any>> {
    await simulateDelay();
    // Accept any credentials in demo mode
    return {
      data: {
        user: DEMO_USER,
        session: {
          access_token: "demo-token",
          refresh_token: "demo-refresh-token",
        },
      },
      error: null,
    };
  },

  /**
   * Get current session (demo mode)
   */
  async getSession(): Promise<ApiResponse<any>> {
    return {
      data: {
        user: DEMO_USER,
        session: {
          access_token: "demo-token",
          refresh_token: "demo-refresh-token",
        },
      },
      error: null,
    };
  },
};

/**
 * Demo Notification Service
 */
export const demoNotificationService = {
  /**
   * Get all notifications
   */
  async getNotifications(): Promise<ApiResponse<typeof DEMO_NOTIFICATIONS>> {
    await simulateDelay();
    return {
      data: [...DEMO_NOTIFICATIONS],
      error: null,
    };
  },

  /**
   * Mark notification as read (demo mode - doesn't persist)
   */
  async markAsRead(_notificationId: string): Promise<ApiResponse<void>> {
    await simulateDelay();
    return {
      data: null,
      error: null,
    };
  },
};
