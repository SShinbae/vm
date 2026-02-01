/**
 * Analytics Calculations Tests
 *
 * Tests for fuel efficiency calculations, cost metrics, service metrics,
 * trend generation, and data filtering utilities.
 */

import {
  calculateFuelEfficiency,
  calculateCostMetrics,
  calculateServiceMetrics,
  getUpcomingServices,
  generateTrendData,
  filterLogsByPeriod,
  groupLogsByMonth,
  calculateLocationCosts,
  calculateTotalDistance,
  getPeriodOptions,
} from "@/lib/analytics/calculations";
import { FuelLog, MileageLog, ServiceLog, Vehicle } from "@/types";

describe("Analytics Calculations", () => {
  // ==========================================================================
  // Test Data Factories
  // ==========================================================================

  const createFuelLog = (overrides: Partial<FuelLog> = {}): FuelLog => ({
    id: `fuel-${Math.random().toString(36).substr(2, 9)}`,
    vehicle_id: "vehicle-1",
    user_id: "user-1",
    liters_filled: 45,
    cost: 95,
    date: new Date().toISOString().split("T")[0],
    odometer_reading: 50000,
    location: "Shell Station",
    created_at: new Date().toISOString(),
    ...overrides,
  });

  const createMileageLog = (
    overrides: Partial<MileageLog> = {},
  ): MileageLog => ({
    id: `mileage-${Math.random().toString(36).substr(2, 9)}`,
    vehicle_id: "vehicle-1",
    user_id: "user-1",
    odometer_reading: 50000,
    date: new Date().toISOString().split("T")[0],
    notes: null,
    created_at: new Date().toISOString(),
    ...overrides,
  });

  const createServiceLog = (
    overrides: Partial<ServiceLog> = {},
  ): ServiceLog => ({
    id: `service-${Math.random().toString(36).substr(2, 9)}`,
    vehicle_id: "vehicle-1",
    user_id: "user-1",
    service_type: "oil_change",
    description: "Regular oil change",
    cost: 75,
    date: new Date().toISOString().split("T")[0],
    odometer_reading: 50000,
    next_service_due: null,
    receipt_image_url: null,
    ocr_extracted_data: null,
    auto_filled: false,
    created_at: new Date().toISOString(),
    ...overrides,
  });

  const createVehicle = (overrides: Partial<Vehicle> = {}): Vehicle => ({
    id: "vehicle-1",
    user_id: "user-1",
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
  });

  // ==========================================================================
  // calculateFuelEfficiency Tests
  // ==========================================================================

  describe("calculateFuelEfficiency", () => {
    it("should return zeros for empty fuel logs", () => {
      const result = calculateFuelEfficiency([], []);

      expect(result.averageConsumption).toBe(0);
      expect(result.averageFuelPrice).toBe(0);
      expect(result.totalLitersFilled).toBe(0);
      expect(result.totalDistance).toBe(0);
      expect(result.fuelUps).toBe(0);
      expect(result.bestEfficiency).toBe(0);
      expect(result.worstEfficiency).toBe(0);
    });

    it("should calculate L/100km correctly", () => {
      const fuelLogs = [
        createFuelLog({
          odometer_reading: 50000,
          liters_filled: 0,
          date: "2024-01-01",
        }),
        createFuelLog({
          odometer_reading: 50500,
          liters_filled: 45,
          date: "2024-01-15",
        }),
        createFuelLog({
          odometer_reading: 51000,
          liters_filled: 40,
          date: "2024-01-30",
        }),
      ];

      const result = calculateFuelEfficiency(fuelLogs, []);

      // (45/500)*100 = 9 L/100km, (40/500)*100 = 8 L/100km
      // Average = (9 + 8) / 2 = 8.5
      expect(result.averageConsumption).toBe(8.5);
    });

    it("should track best and worst efficiency", () => {
      const fuelLogs = [
        createFuelLog({
          odometer_reading: 50000,
          liters_filled: 0,
          date: "2024-01-01",
        }),
        createFuelLog({
          odometer_reading: 50500,
          liters_filled: 45,
          date: "2024-01-15",
        }), // 9 L/100km
        createFuelLog({
          odometer_reading: 51000,
          liters_filled: 35,
          date: "2024-01-30",
        }), // 7 L/100km
        createFuelLog({
          odometer_reading: 51500,
          liters_filled: 55,
          date: "2024-02-15",
        }), // 11 L/100km
      ];

      const result = calculateFuelEfficiency(fuelLogs, []);

      expect(result.bestEfficiency).toBe(7); // Lower is better
      expect(result.worstEfficiency).toBe(11);
    });

    it("should calculate total liters and distance", () => {
      const fuelLogs = [
        createFuelLog({
          odometer_reading: 50000,
          liters_filled: 0,
          date: "2024-01-01",
        }),
        createFuelLog({
          odometer_reading: 50500,
          liters_filled: 45,
          date: "2024-01-15",
        }),
        createFuelLog({
          odometer_reading: 51000,
          liters_filled: 40,
          date: "2024-01-30",
        }),
      ];

      const result = calculateFuelEfficiency(fuelLogs, []);

      expect(result.totalLitersFilled).toBe(85);
      expect(result.totalDistance).toBe(1000);
      expect(result.fuelUps).toBe(3);
    });

    it("should calculate average fuel price", () => {
      const fuelLogs = [
        createFuelLog({ liters_filled: 50, cost: 100 }), // RM2/L
        createFuelLog({ liters_filled: 50, cost: 150 }), // RM3/L
      ];

      const result = calculateFuelEfficiency(fuelLogs, []);

      expect(result.averageFuelPrice).toBe(2.5); // (100+150)/(50+50) = 2.5
    });

    it("should ignore unrealistic consumption values", () => {
      const fuelLogs = [
        createFuelLog({
          odometer_reading: 50000,
          liters_filled: 0,
          date: "2024-01-01",
        }),
        createFuelLog({
          odometer_reading: 50500,
          liters_filled: 40,
          date: "2024-01-15",
        }), // 8 L/100km (valid)
        createFuelLog({
          odometer_reading: 50510,
          liters_filled: 40,
          date: "2024-01-16",
        }), // 400 L/100km (invalid)
      ];

      const result = calculateFuelEfficiency(fuelLogs, []);

      // Only the valid reading should be counted
      expect(result.averageConsumption).toBe(8);
    });

    it("should ignore very large distance jumps (>10000km)", () => {
      const fuelLogs = [
        createFuelLog({
          odometer_reading: 50000,
          liters_filled: 0,
          date: "2024-01-01",
        }),
        createFuelLog({
          odometer_reading: 65000,
          liters_filled: 45,
          date: "2024-01-15",
        }), // 15000km jump - ignored
      ];

      const result = calculateFuelEfficiency(fuelLogs, []);

      expect(result.totalDistance).toBe(0);
    });

    it("should sort logs by date before calculation", () => {
      const fuelLogs = [
        createFuelLog({
          odometer_reading: 51000,
          liters_filled: 40,
          date: "2024-01-30",
        }),
        createFuelLog({
          odometer_reading: 50000,
          liters_filled: 0,
          date: "2024-01-01",
        }),
        createFuelLog({
          odometer_reading: 50500,
          liters_filled: 45,
          date: "2024-01-15",
        }),
      ];

      const result = calculateFuelEfficiency(fuelLogs, []);

      expect(result.averageConsumption).toBe(8.5);
    });
  });

  // ==========================================================================
  // calculateCostMetrics Tests
  // ==========================================================================

  describe("calculateCostMetrics", () => {
    it("should calculate total costs correctly", () => {
      const fuelLogs = [
        createFuelLog({ cost: 100 }),
        createFuelLog({ cost: 150 }),
      ];
      const serviceLogs = [
        createServiceLog({ cost: 200 }),
        createServiceLog({ cost: 75 }),
      ];

      const result = calculateCostMetrics(fuelLogs, serviceLogs, 1000);

      expect(result.totalFuelCost).toBe(250);
      expect(result.totalServiceCost).toBe(275);
      expect(result.totalCost).toBe(525);
    });

    it("should calculate cost per km", () => {
      const fuelLogs = [createFuelLog({ cost: 200 })];
      const serviceLogs = [createServiceLog({ cost: 300 })];

      const result = calculateCostMetrics(fuelLogs, serviceLogs, 1000);

      expect(result.costPerKm).toBe(0.5); // 500/1000
    });

    it("should calculate average costs", () => {
      const fuelLogs = [
        createFuelLog({ cost: 100 }),
        createFuelLog({ cost: 150 }),
      ];
      const serviceLogs = [
        createServiceLog({ cost: 200 }),
        createServiceLog({ cost: 100 }),
        createServiceLog({ cost: 150 }),
      ];

      const result = calculateCostMetrics(fuelLogs, serviceLogs, 1000);

      expect(result.averageFuelCost).toBe(125);
      expect(result.averageServiceCost).toBe(150);
    });

    it("should handle empty logs", () => {
      const result = calculateCostMetrics([], [], 0);

      expect(result.totalFuelCost).toBe(0);
      expect(result.totalServiceCost).toBe(0);
      expect(result.totalCost).toBe(0);
      expect(result.costPerKm).toBe(0);
      expect(result.averageFuelCost).toBe(0);
      expect(result.averageServiceCost).toBe(0);
    });

    it("should handle zero distance", () => {
      const fuelLogs = [createFuelLog({ cost: 100 })];
      const serviceLogs = [createServiceLog({ cost: 200 })];

      const result = calculateCostMetrics(fuelLogs, serviceLogs, 0);

      expect(result.costPerKm).toBe(0);
    });

    it("should handle null costs", () => {
      const fuelLogs = [createFuelLog({ cost: null as any })];
      const serviceLogs = [createServiceLog({ cost: undefined as any })];

      const result = calculateCostMetrics(fuelLogs, serviceLogs, 1000);

      expect(result.totalCost).toBe(0);
    });
  });

  // ==========================================================================
  // calculateServiceMetrics Tests
  // ==========================================================================

  describe("calculateServiceMetrics", () => {
    it("should count services by type", () => {
      const serviceLogs = [
        createServiceLog({ service_type: "oil_change" }),
        createServiceLog({ service_type: "oil_change" }),
        createServiceLog({ service_type: "tire_rotation" }),
        createServiceLog({ service_type: "brake_service" }),
      ];

      const result = calculateServiceMetrics(serviceLogs, [createVehicle()]);

      expect(result.servicesByType.oil_change).toBe(2);
      expect(result.servicesByType.tire_rotation).toBe(1);
      expect(result.servicesByType.brake_service).toBe(1);
      expect(result.totalServices).toBe(4);
    });

    it("should calculate cost by service type", () => {
      const serviceLogs = [
        createServiceLog({ service_type: "oil_change", cost: 75 }),
        createServiceLog({ service_type: "oil_change", cost: 80 }),
        createServiceLog({ service_type: "brake_service", cost: 500 }),
      ];

      const result = calculateServiceMetrics(serviceLogs, [createVehicle()]);

      expect(result.costByServiceType.oil_change).toBe(155);
      expect(result.costByServiceType.brake_service).toBe(500);
    });

    it("should calculate average service interval", () => {
      const serviceLogs = [
        createServiceLog({ odometer_reading: 50000 }),
        createServiceLog({ odometer_reading: 55000 }),
        createServiceLog({ odometer_reading: 60000 }),
      ];

      const result = calculateServiceMetrics(serviceLogs, [createVehicle()]);

      expect(result.averageServiceInterval).toBe(5000);
    });

    it("should handle empty service logs", () => {
      const result = calculateServiceMetrics([], [createVehicle()]);

      expect(result.totalServices).toBe(0);
      expect(result.averageServiceInterval).toBe(0);
    });
  });

  // ==========================================================================
  // getUpcomingServices Tests
  // ==========================================================================

  describe("getUpcomingServices", () => {
    it("should identify overdue services", () => {
      const vehicle = createVehicle({
        id: "vehicle-1",
        current_mileage: 55000,
      });
      const serviceLogs = [
        createServiceLog({
          vehicle_id: "vehicle-1",
          next_service_due: JSON.stringify({ mileage: 50000 }),
          service_type: "oil_change",
          odometer_reading: 45000,
        }),
      ];

      const result = getUpcomingServices(serviceLogs, [vehicle]);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("overdue");
    });

    it("should identify services due soon (within 1000km)", () => {
      const vehicle = createVehicle({
        id: "vehicle-1",
        current_mileage: 54500,
      });
      const serviceLogs = [
        createServiceLog({
          vehicle_id: "vehicle-1",
          next_service_due: JSON.stringify({ mileage: 55000 }),
          service_type: "oil_change",
          odometer_reading: 50000,
        }),
      ];

      const result = getUpcomingServices(serviceLogs, [vehicle]);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("due_soon");
    });

    it("should identify upcoming services", () => {
      const vehicle = createVehicle({
        id: "vehicle-1",
        current_mileage: 50000,
      });
      const serviceLogs = [
        createServiceLog({
          vehicle_id: "vehicle-1",
          next_service_due: JSON.stringify({ mileage: 55000 }),
          service_type: "oil_change",
          odometer_reading: 45000,
        }),
      ];

      const result = getUpcomingServices(serviceLogs, [vehicle]);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("upcoming");
      expect(result[0].kmUntilDue).toBe(5000);
    });

    it("should parse JSON next_service_due format", () => {
      const vehicle = createVehicle({
        id: "vehicle-1",
        current_mileage: 50000,
      });
      const serviceLogs = [
        createServiceLog({
          vehicle_id: "vehicle-1",
          next_service_due: JSON.stringify({ mileage: 55000 }),
          service_type: "oil_change",
          odometer_reading: 45000,
        }),
      ];

      const result = getUpcomingServices(serviceLogs, [vehicle]);

      expect(result).toHaveLength(1);
      expect(result[0].serviceDueAt).toBe(55000);
    });

    it("should sort by urgency (overdue > due_soon > upcoming)", () => {
      const vehicle = createVehicle({
        id: "vehicle-1",
        current_mileage: 52000,
      });
      const serviceLogs = [
        createServiceLog({
          vehicle_id: "vehicle-1",
          next_service_due: JSON.stringify({ mileage: 60000 }),
          service_type: "inspection",
          odometer_reading: 50000,
        }), // upcoming
        createServiceLog({
          vehicle_id: "vehicle-1",
          next_service_due: JSON.stringify({ mileage: 50000 }),
          service_type: "oil_change",
          odometer_reading: 45000,
        }), // overdue
        createServiceLog({
          vehicle_id: "vehicle-1",
          next_service_due: JSON.stringify({ mileage: 52500 }),
          service_type: "tire_rotation",
          odometer_reading: 50000,
        }), // due_soon
      ];

      const result = getUpcomingServices(serviceLogs, [vehicle]);

      expect(result[0].status).toBe("overdue");
      expect(result[1].status).toBe("due_soon");
      expect(result[2].status).toBe("upcoming");
    });
  });

  // ==========================================================================
  // filterLogsByPeriod Tests
  // ==========================================================================

  describe("filterLogsByPeriod", () => {
    it("should filter logs within date range", () => {
      const logs = [
        { date: "2024-01-15", id: "1" },
        { date: "2024-02-15", id: "2" },
        { date: "2024-03-15", id: "3" },
      ];

      const result = filterLogsByPeriod(
        logs,
        new Date("2024-01-01"),
        new Date("2024-02-28"),
      );

      expect(result).toHaveLength(2);
      expect(result.map((l) => l.id)).toEqual(["1", "2"]);
    });

    it("should include logs on boundary dates", () => {
      const logs = [{ date: "2024-01-01", id: "1" }];

      const result = filterLogsByPeriod(
        logs,
        new Date("2024-01-01"),
        new Date("2024-01-01"),
      );

      expect(result).toHaveLength(1);
    });

    it("should return empty array for no matches", () => {
      const logs = [{ date: "2024-06-15", id: "1" }];

      const result = filterLogsByPeriod(
        logs,
        new Date("2024-01-01"),
        new Date("2024-01-31"),
      );

      expect(result).toHaveLength(0);
    });
  });

  // ==========================================================================
  // groupLogsByMonth Tests
  // ==========================================================================

  describe("groupLogsByMonth", () => {
    it("should group logs by month", () => {
      const logs = [
        { date: "2024-01-15", id: "1" },
        { date: "2024-01-20", id: "2" },
        { date: "2024-02-15", id: "3" },
      ];

      const result = groupLogsByMonth(logs);

      expect(Object.keys(result)).toEqual(["2024-01", "2024-02"]);
      expect(result["2024-01"]).toHaveLength(2);
      expect(result["2024-02"]).toHaveLength(1);
    });

    it("should handle empty array", () => {
      const result = groupLogsByMonth([]);

      expect(result).toEqual({});
    });

    it("should pad single digit months", () => {
      const logs = [{ date: "2024-01-15", id: "1" }];

      const result = groupLogsByMonth(logs);

      expect(result["2024-01"]).toBeDefined();
    });
  });

  // ==========================================================================
  // calculateLocationCosts Tests
  // ==========================================================================

  describe("calculateLocationCosts", () => {
    it("should aggregate costs by location", () => {
      const fuelLogs = [
        createFuelLog({ location: "Shell", cost: 100, liters_filled: 50 }),
        createFuelLog({ location: "Shell", cost: 120, liters_filled: 60 }),
        createFuelLog({ location: "Petronas", cost: 95, liters_filled: 45 }),
      ];

      const result = calculateLocationCosts(fuelLogs);

      const shell = result.find((l) => l.location === "Shell");
      const petronas = result.find((l) => l.location === "Petronas");

      expect(shell?.totalVisits).toBe(2);
      expect(shell?.totalSpent).toBe(220);
      expect(shell?.averageCost).toBe(110);
      expect(petronas?.totalVisits).toBe(1);
    });

    it("should sort by total spent descending", () => {
      const fuelLogs = [
        createFuelLog({ location: "A", cost: 50 }),
        createFuelLog({ location: "B", cost: 200 }),
        createFuelLog({ location: "C", cost: 100 }),
      ];

      const result = calculateLocationCosts(fuelLogs);

      expect(result[0].location).toBe("B");
      expect(result[1].location).toBe("C");
      expect(result[2].location).toBe("A");
    });

    it("should handle null location as 'Unknown'", () => {
      const fuelLogs = [createFuelLog({ location: null as any, cost: 100 })];

      const result = calculateLocationCosts(fuelLogs);

      expect(result[0].location).toBe("Unknown");
    });
  });

  // ==========================================================================
  // calculateTotalDistance Tests
  // ==========================================================================

  describe("calculateTotalDistance", () => {
    it("should calculate distance from min to max odometer", () => {
      const mileageLogs = [
        createMileageLog({ odometer_reading: 50000 }),
        createMileageLog({ odometer_reading: 52000 }),
        createMileageLog({ odometer_reading: 51000 }),
      ];

      const result = calculateTotalDistance(mileageLogs);

      expect(result).toBe(2000); // 52000 - 50000
    });

    it("should return 0 for single log", () => {
      const mileageLogs = [createMileageLog({ odometer_reading: 50000 })];

      const result = calculateTotalDistance(mileageLogs);

      expect(result).toBe(0);
    });

    it("should return 0 for empty logs", () => {
      const result = calculateTotalDistance([]);

      expect(result).toBe(0);
    });
  });

  // ==========================================================================
  // getPeriodOptions Tests
  // ==========================================================================

  describe("getPeriodOptions", () => {
    it("should return all period options", () => {
      const options = getPeriodOptions();

      expect(options).toHaveLength(5);
      expect(options.map((o) => o.label)).toEqual([
        "7 Days",
        "30 Days",
        "3 Months",
        "6 Months",
        "1 Year",
      ]);
    });

    it("should have correct day values", () => {
      const options = getPeriodOptions();

      expect(options.map((o) => o.days)).toEqual([7, 30, 90, 180, 365]);
    });

    it("should have valid date ranges", () => {
      const options = getPeriodOptions();

      options.forEach((option) => {
        expect(option.startDate).toBeInstanceOf(Date);
        expect(option.endDate).toBeInstanceOf(Date);
        expect(option.startDate.getTime()).toBeLessThan(
          option.endDate.getTime(),
        );
      });
    });
  });

  // ==========================================================================
  // generateTrendData Tests
  // ==========================================================================

  describe("generateTrendData", () => {
    it("should generate cost trend data", () => {
      const logs = [
        createFuelLog({ date: "2024-01-15", cost: 100 }),
        createFuelLog({ date: "2024-01-20", cost: 150 }),
        createFuelLog({ date: "2024-02-15", cost: 120 }),
      ];

      const period = {
        label: "3 Months",
        days: 90,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
      };

      const result = generateTrendData(logs, period, "cost");

      expect(result).toHaveLength(2);
      expect(result[0].value).toBe(250); // Jan total
      expect(result[1].value).toBe(120); // Feb total
    });

    it("should generate frequency trend data", () => {
      const logs = [
        createFuelLog({ date: "2024-01-15" }),
        createFuelLog({ date: "2024-01-20" }),
        createFuelLog({ date: "2024-02-15" }),
      ];

      const period = {
        label: "3 Months",
        days: 90,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-03-31"),
      };

      const result = generateTrendData(logs, period, "frequency");

      expect(result[0].value).toBe(2); // 2 in Jan
      expect(result[1].value).toBe(1); // 1 in Feb
    });

    it("should sort trend data chronologically", () => {
      const logs = [
        createFuelLog({ date: "2024-03-15", cost: 100 }),
        createFuelLog({ date: "2024-01-15", cost: 100 }),
        createFuelLog({ date: "2024-02-15", cost: 100 }),
      ];

      const period = {
        label: "6 Months",
        days: 180,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-06-30"),
      };

      const result = generateTrendData(logs, period, "cost");

      expect(result[0].date).toBe("2024-01");
      expect(result[1].date).toBe("2024-02");
      expect(result[2].date).toBe("2024-03");
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe("Edge Cases", () => {
    it("should handle negative odometer readings gracefully", () => {
      const fuelLogs = [
        createFuelLog({ odometer_reading: 50000, liters_filled: 0 }),
        createFuelLog({ odometer_reading: 49000, liters_filled: 45 }), // Negative distance
      ];

      const result = calculateFuelEfficiency(fuelLogs, []);

      expect(result.totalDistance).toBe(0);
    });

    it("should handle extremely high fuel consumption values", () => {
      const fuelLogs = [
        createFuelLog({
          odometer_reading: 50000,
          liters_filled: 0,
          date: "2024-01-01",
        }),
        createFuelLog({
          odometer_reading: 50001,
          liters_filled: 100,
          date: "2024-01-02",
        }), // 10000 L/100km
      ];

      const result = calculateFuelEfficiency(fuelLogs, []);

      // Should be filtered out as unrealistic
      expect(result.averageConsumption).toBe(0);
    });

    it("should handle logs with same date and odometer", () => {
      const fuelLogs = [
        createFuelLog({
          odometer_reading: 50000,
          date: "2024-01-15",
          liters_filled: 45,
        }),
        createFuelLog({
          odometer_reading: 50000,
          date: "2024-01-15",
          liters_filled: 40,
        }),
      ];

      const result = calculateFuelEfficiency(fuelLogs, []);

      expect(result.totalDistance).toBe(0);
    });
  });
});
