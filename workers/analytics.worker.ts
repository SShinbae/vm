/**
 * Analytics Calculation Web Worker
 *
 * This worker handles CPU-intensive analytics calculations off the main thread
 * to prevent UI blocking and improve app responsiveness.
 *
 * Supports:
 * - Fuel efficiency calculations
 * - Cost metrics processing
 * - Service metrics analysis
 * - Vehicle comparison
 * - Trend data generation
 */

import type { FuelLog, ServiceLog, MileageLog, Vehicle } from "../types";
import type {
  FuelEfficiencyMetrics,
  CostMetrics,
  ServiceMetrics,
  VehiclePerformance,
  TrendDataPoint,
  AnalyticsPeriod,
  VehicleWithLogs,
} from "../types/analytics";

// Import calculation functions
import {
  calculateFuelEfficiency,
  calculateCostMetrics,
  calculateServiceMetrics,
  calculateTotalDistance,
  calculateVehicleComparison,
  generateTrendData,
} from "../lib/analytics/calculations";

// Message types for worker communication
export type WorkerMessage =
  | {
      type: "CALCULATE_FUEL_EFFICIENCY";
      payload: { fuelLogs: FuelLog[]; mileageLogs: MileageLog[] };
    }
  | {
      type: "CALCULATE_COST_METRICS";
      payload: {
        fuelLogs: FuelLog[];
        serviceLogs: ServiceLog[];
        totalDistance: number;
      };
    }
  | {
      type: "CALCULATE_SERVICE_METRICS";
      payload: { serviceLogs: ServiceLog[]; vehicles: Vehicle[] };
    }
  | {
      type: "CALCULATE_VEHICLE_COMPARISON";
      payload: { vehiclesWithLogs: VehicleWithLogs[] };
    }
  | {
      type: "GENERATE_TREND_DATA";
      payload: {
        logs: any[];
        period: AnalyticsPeriod;
        metricType: "cost" | "efficiency" | "frequency";
      };
    }
  | {
      type: "CALCULATE_ALL_METRICS";
      payload: {
        fuelLogs: FuelLog[];
        serviceLogs: ServiceLog[];
        mileageLogs: MileageLog[];
        vehicles: Vehicle[];
        vehiclesWithLogs?: VehicleWithLogs[];
      };
    };

export type WorkerResponse<T = any> =
  | { type: "SUCCESS"; taskType: string; result: T }
  | { type: "ERROR"; taskType: string; error: string };

// Worker message handler
self.addEventListener("message", async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  try {
    switch (message.type) {
      case "CALCULATE_FUEL_EFFICIENCY": {
        const { fuelLogs, mileageLogs } = message.payload;
        const result = calculateFuelEfficiency(fuelLogs, mileageLogs);
        self.postMessage({
          type: "SUCCESS",
          taskType: "CALCULATE_FUEL_EFFICIENCY",
          result,
        } as WorkerResponse<FuelEfficiencyMetrics>);
        break;
      }

      case "CALCULATE_COST_METRICS": {
        const { fuelLogs, serviceLogs, totalDistance } = message.payload;
        const result = calculateCostMetrics(
          fuelLogs,
          serviceLogs,
          totalDistance,
        );
        self.postMessage({
          type: "SUCCESS",
          taskType: "CALCULATE_COST_METRICS",
          result,
        } as WorkerResponse<CostMetrics>);
        break;
      }

      case "CALCULATE_SERVICE_METRICS": {
        const { serviceLogs, vehicles } = message.payload;
        const result = calculateServiceMetrics(serviceLogs, vehicles);
        self.postMessage({
          type: "SUCCESS",
          taskType: "CALCULATE_SERVICE_METRICS",
          result,
        } as WorkerResponse<ServiceMetrics>);
        break;
      }

      case "CALCULATE_VEHICLE_COMPARISON": {
        const { vehiclesWithLogs } = message.payload;
        const result = calculateVehicleComparison(vehiclesWithLogs);
        self.postMessage({
          type: "SUCCESS",
          taskType: "CALCULATE_VEHICLE_COMPARISON",
          result,
        } as WorkerResponse<VehiclePerformance[]>);
        break;
      }

      case "GENERATE_TREND_DATA": {
        const { logs, period, metricType } = message.payload;
        const result = generateTrendData(logs, period, metricType);
        self.postMessage({
          type: "SUCCESS",
          taskType: "GENERATE_TREND_DATA",
          result,
        } as WorkerResponse<TrendDataPoint[]>);
        break;
      }

      case "CALCULATE_ALL_METRICS": {
        // OPTIMIZATION: Calculate all metrics in one worker call to reduce message passing overhead
        const {
          fuelLogs,
          serviceLogs,
          mileageLogs,
          vehicles,
          vehiclesWithLogs,
        } = message.payload;

        const totalDistance = calculateTotalDistance(mileageLogs);
        const fuelMetrics = calculateFuelEfficiency(fuelLogs, mileageLogs);
        const costMetrics = calculateCostMetrics(
          fuelLogs,
          serviceLogs,
          fuelMetrics.totalDistance || totalDistance,
        );
        const serviceMetrics = calculateServiceMetrics(serviceLogs, vehicles);
        const vehicleComparison = vehiclesWithLogs
          ? calculateVehicleComparison(vehiclesWithLogs)
          : [];

        self.postMessage({
          type: "SUCCESS",
          taskType: "CALCULATE_ALL_METRICS",
          result: {
            fuelMetrics,
            costMetrics,
            serviceMetrics,
            vehicleComparison,
            totalDistance,
          },
        } as WorkerResponse<{
          fuelMetrics: FuelEfficiencyMetrics;
          costMetrics: CostMetrics;
          serviceMetrics: ServiceMetrics;
          vehicleComparison: VehiclePerformance[];
          totalDistance: number;
        }>);
        break;
      }

      default:
        throw new Error(`Unknown message type: ${(message as any).type}`);
    }
  } catch (error) {
    self.postMessage({
      type: "ERROR",
      taskType: message.type,
      error: error instanceof Error ? error.message : String(error),
    } as WorkerResponse);
  }
});

// Signal that worker is ready
self.postMessage({ type: "READY" });
