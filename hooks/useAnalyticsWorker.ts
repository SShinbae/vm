/**
 * Hook for using Web Workers in analytics calculations
 *
 * This hook provides a simple interface to offload heavy analytics calculations
 * to a Web Worker, preventing UI blocking and improving app responsiveness.
 *
 * Features:
 * - Automatic fallback to main thread if Workers not supported
 * - Type-safe message passing
 * - Promise-based API for easy integration
 * - Automatic worker cleanup
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { FuelLog, MileageLog, ServiceLog, Vehicle } from "../types";
import type {
  AnalyticsPeriod,
  CostMetrics,
  FuelEfficiencyMetrics,
  ServiceMetrics,
  TrendDataPoint,
  VehiclePerformance,
  VehicleWithLogs,
} from "../types/analytics";
import type { WorkerMessage } from "../workers/analytics.worker";

// Import fallback calculations
import {
  calculateCostMetrics,
  calculateFuelEfficiency,
  calculateServiceMetrics,
  calculateTotalDistance,
  calculateVehicleComparison,
  generateTrendData,
} from "../lib/analytics/calculations";

// Check if Web Workers are supported
// Disabled: Metro bundler doesn't support import.meta.url for Worker instantiation
const supportsWorkers = false;

type PendingTask = {
  resolve: (result: any) => void;
  reject: (error: Error) => void;
  taskType: string;
};

export function useAnalyticsWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingTasksRef = useRef<Map<string, PendingTask>>(new Map());
  const [isReady, setIsReady] = useState(false);
  const [usesFallback, setUsesFallback] = useState(!supportsWorkers);

  // Initialize worker
  // Note: Workers disabled due to Metro bundler not supporting import.meta.url
  // The worker initialization code has been removed to prevent bundling errors
  useEffect(() => {
    console.warn(
      "Web Workers not supported, using fallback calculations on main thread",
    );
    setUsesFallback(true);
    setIsReady(true);
  }, []);

  // Generic method to send messages to worker
  const sendMessage = useCallback(
    <T>(message: WorkerMessage): Promise<T> => {
      return new Promise((resolve, reject) => {
        if (usesFallback || !workerRef.current) {
          // Fallback to main thread
          executeFallback<T>(message).then(resolve).catch(reject);
          return;
        }

        pendingTasksRef.current.set(message.type, {
          resolve,
          reject,
          taskType: message.type,
        });

        workerRef.current.postMessage(message);
      });
    },
    [usesFallback],
  );

  // OPTIMIZATION: Calculate all metrics in one call
  const calculateAllMetrics = useCallback(
    async (params: {
      fuelLogs: FuelLog[];
      serviceLogs: ServiceLog[];
      mileageLogs: MileageLog[];
      vehicles: Vehicle[];
      vehiclesWithLogs?: VehicleWithLogs[];
    }) => {
      return sendMessage<{
        fuelMetrics: FuelEfficiencyMetrics;
        costMetrics: CostMetrics;
        serviceMetrics: ServiceMetrics;
        vehicleComparison: VehiclePerformance[];
        totalDistance: number;
      }>({
        type: "CALCULATE_ALL_METRICS",
        payload: params,
      });
    },
    [sendMessage],
  );

  const calculateFuelEfficiencyAsync = useCallback(
    async (fuelLogs: FuelLog[], mileageLogs: MileageLog[]) => {
      return sendMessage<FuelEfficiencyMetrics>({
        type: "CALCULATE_FUEL_EFFICIENCY",
        payload: { fuelLogs, mileageLogs },
      });
    },
    [sendMessage],
  );

  const calculateCostMetricsAsync = useCallback(
    async (
      fuelLogs: FuelLog[],
      serviceLogs: ServiceLog[],
      totalDistance: number,
    ) => {
      return sendMessage<CostMetrics>({
        type: "CALCULATE_COST_METRICS",
        payload: { fuelLogs, serviceLogs, totalDistance },
      });
    },
    [sendMessage],
  );

  const calculateServiceMetricsAsync = useCallback(
    async (serviceLogs: ServiceLog[], vehicles: Vehicle[]) => {
      return sendMessage<ServiceMetrics>({
        type: "CALCULATE_SERVICE_METRICS",
        payload: { serviceLogs, vehicles },
      });
    },
    [sendMessage],
  );

  const calculateVehicleComparisonAsync = useCallback(
    async (vehiclesWithLogs: VehicleWithLogs[]) => {
      return sendMessage<VehiclePerformance[]>({
        type: "CALCULATE_VEHICLE_COMPARISON",
        payload: { vehiclesWithLogs },
      });
    },
    [sendMessage],
  );

  const generateTrendDataAsync = useCallback(
    async (
      logs: any[],
      period: AnalyticsPeriod,
      metricType: "cost" | "efficiency" | "frequency",
    ) => {
      return sendMessage<TrendDataPoint[]>({
        type: "GENERATE_TREND_DATA",
        payload: { logs, period, metricType },
      });
    },
    [sendMessage],
  );

  return {
    isReady,
    usesFallback,
    calculateAllMetrics,
    calculateFuelEfficiencyAsync,
    calculateCostMetricsAsync,
    calculateServiceMetricsAsync,
    calculateVehicleComparisonAsync,
    generateTrendDataAsync,
  };
}

// Fallback execution on main thread
async function executeFallback<T>(message: WorkerMessage): Promise<T> {
  switch (message.type) {
    case "CALCULATE_FUEL_EFFICIENCY": {
      const { fuelLogs, mileageLogs } = message.payload;
      return calculateFuelEfficiency(fuelLogs, mileageLogs) as T;
    }

    case "CALCULATE_COST_METRICS": {
      const { fuelLogs, serviceLogs, totalDistance } = message.payload;
      return calculateCostMetrics(fuelLogs, serviceLogs, totalDistance) as T;
    }

    case "CALCULATE_SERVICE_METRICS": {
      const { serviceLogs, vehicles } = message.payload;
      return calculateServiceMetrics(serviceLogs, vehicles) as T;
    }

    case "CALCULATE_VEHICLE_COMPARISON": {
      const { vehiclesWithLogs } = message.payload;
      return calculateVehicleComparison(vehiclesWithLogs) as T;
    }

    case "GENERATE_TREND_DATA": {
      const { logs, period, metricType } = message.payload;
      return generateTrendData(logs, period, metricType) as T;
    }

    case "CALCULATE_ALL_METRICS": {
      const { fuelLogs, serviceLogs, mileageLogs, vehicles, vehiclesWithLogs } =
        message.payload;

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

      return {
        fuelMetrics,
        costMetrics,
        serviceMetrics,
        vehicleComparison,
        totalDistance,
      } as T;
    }

    default:
      throw new Error(`Unknown message type for fallback`);
  }
}
