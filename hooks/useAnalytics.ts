import { useCallback, useEffect, useMemo, useState } from "react";
import {
  calculateCostMetrics,
  calculateFuelEfficiency,
  calculateServiceMetrics,
  calculateTotalDistance,
  calculateVehicleComparison,
  generateTrendData,
  getPeriodOptions,
} from "../lib/analytics/calculations";
import { generateCostChartData } from "../lib/analytics/chart-helpers";
import { useAuth } from "../lib/contexts/AuthContext";
import {
  fetchAccessibleVehicles,
  fetchAnalyticsData,
  fetchVehiclesWithLogs,
} from "../lib/supabase/analytics-queries";
import { Vehicle } from "../types";
import {
  AnalyticsFilters,
  AnalyticsPeriod,
  AnalyticsResponse,
  ChartDataset,
  CostMetrics,
  FuelEfficiencyMetrics,
  ServiceMetrics,
  TrendAnalysis,
  TrendDataPoint,
  VehiclePerformance,
} from "../types/analytics";

/**
 * Main hook for analytics data
 */
export function useAnalyticsData(filters: AnalyticsFilters) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [costMetrics, setCostMetrics] = useState<CostMetrics | null>(null);
  const [fuelMetrics, setFuelMetrics] = useState<FuelEfficiencyMetrics | null>(
    null,
  );
  const [serviceMetrics, setServiceMetrics] = useState<ServiceMetrics | null>(
    null,
  );
  const [vehicleComparison, setVehicleComparison] = useState<
    VehiclePerformance[]
  >([]);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const data = await fetchAnalyticsData(user.id, filters);

      // Calculate metrics
      const totalDistance = calculateTotalDistance(data.mileageLogs);
      const fuel = calculateFuelEfficiency(data.fuelLogs, data.mileageLogs);
      const cost = calculateCostMetrics(
        data.fuelLogs,
        data.serviceLogs,
        fuel.totalDistance || totalDistance,
      );
      const service = calculateServiceMetrics(data.serviceLogs, data.vehicles);

      // Calculate vehicle comparison if multiple vehicles
      let comparison: VehiclePerformance[] = [];
      if (data.vehicles.length > 0) {
        const vehiclesWithLogs = await fetchVehiclesWithLogs(
          data.vehicles.map((v) => v.id),
          filters.period.startDate,
          filters.period.endDate,
        );
        comparison = calculateVehicleComparison(vehiclesWithLogs);
      }

      setFuelMetrics(fuel);
      setCostMetrics(cost);
      setServiceMetrics(service);
      setVehicleComparison(comparison);
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    error,
    costMetrics,
    fuelMetrics,
    serviceMetrics,
    vehicleComparison,
    refetch: fetchData,
  };
}

/**
 * Hook for analytics trends
 */
export function useAnalyticsTrends(
  filters: AnalyticsFilters,
  metric: "fuel" | "service" | "cost",
) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(
    null,
  );

  useEffect(() => {
    async function fetchTrends() {
      if (!user?.id) return;

      try {
        setLoading(true);
        const data = await fetchAnalyticsData(user.id, filters);

        let trends: TrendDataPoint[] = [];
        let metricType: "cost" | "efficiency" | "frequency" = "cost";

        switch (metric) {
          case "fuel":
            trends = generateTrendData(
              data.fuelLogs,
              filters.period,
              "efficiency",
            );
            metricType = "efficiency";
            break;
          case "service":
            trends = generateTrendData(
              data.serviceLogs,
              filters.period,
              "frequency",
            );
            metricType = "frequency";
            break;
          case "cost":
            trends = generateTrendData(
              [...data.fuelLogs, ...data.serviceLogs],
              filters.period,
              "cost",
            );
            metricType = "cost";
            break;
        }

        setTrendData(trends);

        // Calculate trend analysis (compare first half vs second half)
        if (trends.length >= 2) {
          const midPoint = Math.floor(trends.length / 2);
          const firstHalf = trends.slice(0, midPoint);
          const secondHalf = trends.slice(midPoint);

          // Calculate with NaN filtering
          const getValidAverage = (data: TrendDataPoint[]) => {
            const validValues = data
              .map((t) => t.value)
              .filter((v) => !isNaN(v) && isFinite(v));
            if (validValues.length === 0) return 0;
            return (
              validValues.reduce((sum, v) => sum + v, 0) / validValues.length
            );
          };

          const firstAvg = getValidAverage(firstHalf);
          const secondAvg = getValidAverage(secondHalf);

          // Avoid division by zero and handle edge cases
          let percentageChange = 0;
          if (firstAvg > 0 && isFinite(secondAvg)) {
            percentageChange = ((secondAvg - firstAvg) / firstAvg) * 100;
            // Cap extreme percentages
            percentageChange = Math.max(-999, Math.min(999, percentageChange));
          }

          const direction: "up" | "down" | "neutral" =
            Math.abs(percentageChange) < 5
              ? "neutral"
              : percentageChange > 0
                ? "up"
                : "down";

          setTrendAnalysis({
            direction,
            percentage: Math.abs(parseFloat(percentageChange.toFixed(1))),
            comparisonPeriod: `${filters.period.label} period`,
          });
        }
      } catch (err) {
        console.error("Error fetching trends:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTrends();
  }, [user?.id, filters, metric]);

  return { loading, trendData, trendAnalysis };
}

/**
 * Hook for period selector state management
 */
export function usePeriodSelector() {
  const periods = useMemo(() => getPeriodOptions(), []);
  const [period, setPeriod] = useState<AnalyticsPeriod>(periods[1]); // Default to 30 days

  return { period, setPeriod, periods };
}

/**
 * Hook for vehicle filter state management
 */
export function useVehicleFilter() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVehicles() {
      if (!user?.id) return;

      try {
        setLoading(true);
        const accessibleVehicles = await fetchAccessibleVehicles(user.id);
        setVehicles(accessibleVehicles);
        // By default, select all vehicles
        setSelectedVehicleIds([]);
      } catch (err) {
        console.error("Error fetching vehicles:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchVehicles();
  }, [user?.id]);

  const toggleVehicle = useCallback((vehicleId: string) => {
    setSelectedVehicleIds((prev) => {
      if (prev.includes(vehicleId)) {
        return prev.filter((id) => id !== vehicleId);
      } else {
        return [...prev, vehicleId];
      }
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedVehicleIds([]);
  }, []);

  const clearAll = useCallback(() => {
    setSelectedVehicleIds(vehicles.length > 0 ? [vehicles[0].id] : []);
  }, [vehicles]);

  return {
    vehicles,
    selectedVehicleIds,
    toggleVehicle,
    selectAll,
    clearAll,
    loading,
  };
}

/**
 * Hook for complete analytics response with all metrics
 */
export function useCompleteAnalytics(filters: AnalyticsFilters) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const data = await fetchAnalyticsData(user.id, filters);

      // Calculate all metrics
      const totalDistance = calculateTotalDistance(data.mileageLogs);
      const fuelMetrics = calculateFuelEfficiency(
        data.fuelLogs,
        data.mileageLogs,
      );
      const costMetrics = calculateCostMetrics(
        data.fuelLogs,
        data.serviceLogs,
        fuelMetrics.totalDistance || totalDistance,
      );
      const serviceMetrics = calculateServiceMetrics(
        data.serviceLogs,
        data.vehicles,
      );

      // Vehicle comparison
      const vehiclesWithLogs = await fetchVehiclesWithLogs(
        data.vehicles.map((v) => v.id),
        filters.period.startDate,
        filters.period.endDate,
      );
      const vehicleComparison = calculateVehicleComparison(vehiclesWithLogs);

      // Trend analysis
      const costTrend = generateTrendData(
        [...data.fuelLogs, ...data.serviceLogs],
        filters.period,
        "cost",
      );
      const fuelTrend = generateTrendData(
        data.fuelLogs,
        filters.period,
        "efficiency",
      );
      const serviceTrend = generateTrendData(
        data.serviceLogs,
        filters.period,
        "frequency",
      );

      const calculateTrend = (trends: TrendDataPoint[]): TrendAnalysis => {
        if (trends.length < 2) {
          return {
            direction: "neutral",
            percentage: 0,
            comparisonPeriod: filters.period.label,
          };
        }

        const midPoint = Math.floor(trends.length / 2);
        const firstHalf = trends.slice(0, midPoint);
        const secondHalf = trends.slice(midPoint);

        // Calculate with NaN filtering
        const getValidAverage = (data: TrendDataPoint[]) => {
          const validValues = data
            .map((t) => t.value)
            .filter((v) => !isNaN(v) && isFinite(v));
          if (validValues.length === 0) return 0;
          return (
            validValues.reduce((sum, v) => sum + v, 0) / validValues.length
          );
        };

        const firstAvg = getValidAverage(firstHalf);
        const secondAvg = getValidAverage(secondHalf);

        // Avoid division by zero and handle edge cases
        let percentageChange = 0;
        if (firstAvg > 0 && isFinite(secondAvg)) {
          percentageChange = ((secondAvg - firstAvg) / firstAvg) * 100;
          // Cap extreme percentages
          percentageChange = Math.max(-999, Math.min(999, percentageChange));
        }

        const direction: "up" | "down" | "neutral" =
          Math.abs(percentageChange) < 5
            ? "neutral"
            : percentageChange > 0
              ? "up"
              : "down";

        return {
          direction,
          percentage: Math.abs(parseFloat(percentageChange.toFixed(1))),
          comparisonPeriod: filters.period.label,
        };
      };

      setAnalytics({
        costMetrics,
        fuelMetrics,
        serviceMetrics,
        vehicleComparison,
        trends: {
          cost: calculateTrend(costTrend),
          fuelEfficiency: calculateTrend(fuelTrend),
          serviceFrequency: calculateTrend(serviceTrend),
        },
      });
    } catch (err) {
      console.error("Error fetching complete analytics:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    error,
    analytics,
    refetch: fetchData,
  };
}

/**
 * Hook for cost chart data
 * Fetches and transforms data specifically for cost visualization charts
 */
export function useCostChartData(filters: AnalyticsFilters) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [chartDataset, setChartDataset] = useState<ChartDataset | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const data = await fetchAnalyticsData(user.id, filters);

      // Generate chart dataset with auto-grouping
      const dataset = generateCostChartData(
        data.fuelLogs,
        data.serviceLogs,
        filters.period,
      );

      setChartDataset(dataset);
    } catch (err) {
      console.error("Error fetching cost chart data:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    error,
    chartDataset,
    refetch: fetchData,
  };
}
