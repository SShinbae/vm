import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
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
// OPTIMIZATION: Import Web Worker hook for off-thread calculations
import { useAnalyticsWorker } from "./useAnalyticsWorker";

/**
 * Main hook for analytics data
 * OPTIMIZATION: Now uses Web Workers for heavy calculations
 */
export function useAnalyticsData(filters: AnalyticsFilters, enabled = true) {
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
  const [chartDataset, setChartDataset] = useState<ChartDataset | null>(null);
  // Latest request wins: a slow response must not overwrite newer/cleared state.
  const requestId = useRef(0);

  // OPTIMIZATION: Use Web Worker for calculations
  const { calculateAllMetrics, isReady } = useAnalyticsWorker();

  const fetchData = useCallback(async () => {
    const id = ++requestId.current;
    if (!enabled) {
      setChartDataset(null);
      setCostMetrics(null);
      setFuelMetrics(null);
      setServiceMetrics(null);
      setVehicleComparison([]);
      setError(null);
      setLoading(false);
      return;
    }
    if (!user?.id || !isReady) return;

    try {
      setLoading(true);
      setError(null);

      const data = await fetchAnalyticsData(user.id, filters);

      // Fetch vehicle logs if needed
      let vehiclesWithLogs;
      if (data.vehicles.length > 0) {
        vehiclesWithLogs = await fetchVehiclesWithLogs(
          data.vehicles.map((v) => v.id),
          filters.period.startDate,
          filters.period.endDate,
        );
      }

      // OPTIMIZATION: Calculate all metrics in Web Worker
      const metrics = await calculateAllMetrics({
        fuelLogs: data.fuelLogs,
        serviceLogs: data.serviceLogs,
        mileageLogs: data.mileageLogs,
        vehicles: data.vehicles,
        vehiclesWithLogs,
        baselineFuelLogs: data.baselineFuelLogs,
      });
      if (id !== requestId.current) return;

      setChartDataset(
        generateCostChartData(data.fuelLogs, data.serviceLogs, filters.period),
      );
      setFuelMetrics(metrics.fuelMetrics);
      setCostMetrics(metrics.costMetrics);
      setServiceMetrics(metrics.serviceMetrics);
      setVehicleComparison(metrics.vehicleComparison);
    } catch (err) {
      if (id !== requestId.current) return;
      console.error("Error fetching analytics data:", err);
      setError(err as Error);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [user?.id, filters, isReady, calculateAllMetrics, enabled]);

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
    chartDataset,
    refetch: fetchData,
  };
}

/**
 * Hook for analytics trends
 * OPTIMIZATION: Now uses Web Workers for trend generation
 */
export function useAnalyticsTrends(
  filters: AnalyticsFilters,
  metric: "fuel" | "service" | "service_cost" | "cost",
) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(
    null,
  );

  // OPTIMIZATION: Use Web Worker for trend calculations
  const { generateTrendDataAsync, isReady } = useAnalyticsWorker();

  const requestId = useRef(0);
  const [error, setError] = useState<Error | null>(null);
  const fetchTrends = useCallback(async () => {
    const request = ++requestId.current;
    if (!user?.id || !isReady) {
      setLoading(false);
      setTrendData([]);
      setTrendAnalysis(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setTrendAnalysis(null);
      const data = await fetchAnalyticsData(user.id, filters);
      if (request !== requestId.current) return;

      let trends: TrendDataPoint[] = [];
      let logs: any[] = [];
      let metricType: "cost" | "efficiency" | "frequency" = "cost";

      switch (metric) {
        case "fuel":
          logs = data.fuelLogs;
          metricType = "efficiency";
          break;
        case "service":
        case "service_cost":
          logs = data.serviceLogs;
          metricType = metric === "service_cost" ? "cost" : "frequency";
          break;
        case "cost":
          logs = [...data.fuelLogs, ...data.serviceLogs];
          metricType = "cost";
          break;
      }

      // OPTIMIZATION: Generate trends in Web Worker
      trends = await generateTrendDataAsync(logs, filters.period, metricType);
      if (request !== requestId.current) return;
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
      if (request !== requestId.current) return;
      setError(err instanceof Error ? err : new Error("Couldn't load trend"));
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  }, [user?.id, filters, metric, isReady, generateTrendDataAsync]);

  useEffect(() => {
    const generation = requestId;
    void fetchTrends();
    return () => {
      generation.current++;
    };
  }, [fetchTrends]);

  return { loading, error, trendData, trendAnalysis, refetch: fetchTrends };
}

/**
 * Hook for period selector state management
 */
const AnalyticsPeriodContext = createContext<{
  period: AnalyticsPeriod;
  setPeriod: Dispatch<SetStateAction<AnalyticsPeriod>>;
  periods: AnalyticsPeriod[];
} | null>(null);

export function AnalyticsPeriodProvider({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const periods = useMemo(() => getPeriodOptions(), []);
  const [period, setPeriod] = useState<AnalyticsPeriod>(periods[1]);
  if (!enabled) return children;
  return createElement(
    AnalyticsPeriodContext.Provider,
    { value: { period, setPeriod, periods } },
    children,
  );
}

export function usePeriodSelector() {
  const periods = useMemo(() => getPeriodOptions(), []);
  const [localPeriod, setLocalPeriod] = useState<AnalyticsPeriod>(periods[1]);
  return (
    useContext(AnalyticsPeriodContext) || {
      period: localPeriod,
      setPeriod: setLocalPeriod,
      periods,
    }
  );
}

/**
 * Hook for vehicle filter state management
 */
const AnalyticsVehicleContext = createContext<ReturnType<
  typeof useLocalVehicleFilter
> | null>(null);

export function AnalyticsVehicleProvider({
  children,
}: {
  children: ReactNode;
}) {
  const value = useLocalVehicleFilter(true);
  return createElement(AnalyticsVehicleContext.Provider, { value }, children);
}

export function useVehicleFilter() {
  const shared = useContext(AnalyticsVehicleContext);
  const local = useLocalVehicleFilter(!shared);
  return shared || local;
}

function useLocalVehicleFilter(enabled: boolean) {
  const { user } = useAuth();
  const [data, setData] = useState<{ userId?: string; vehicles: Vehicle[] }>({
    vehicles: [],
  });
  const [selection, setSelection] = useState<{
    userId?: string;
    ids: string[];
  }>({ ids: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const request = useRef(0);
  const vehicles = useMemo(
    () => (data.userId === user?.id ? data.vehicles : []),
    [data, user?.id],
  );
  const selectedVehicleIds = useMemo(
    () => (selection.userId === user?.id ? selection.ids : []),
    [selection, user?.id],
  );

  const refetch = useCallback(async () => {
    const id = ++request.current;
    if (!enabled || !user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const vehicles = await fetchAccessibleVehicles(user.id);
      if (id !== request.current) return;
      setData({ userId: user.id, vehicles });
      setSelection((prev) => ({
        userId: user.id,
        ids:
          prev.userId === user.id
            ? prev.ids.filter((id) => vehicles.some((v) => v.id === id))
            : [],
      }));
    } catch (error) {
      if (id === request.current)
        setError(
          error instanceof Error ? error : new Error("Couldn't load vehicles"),
        );
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, [enabled, user?.id]);

  useEffect(() => {
    const generation = request;
    void refetch();
    return () => {
      generation.current++;
    };
  }, [refetch]);

  const toggleVehicle = useCallback(
    (vehicleId: string) => {
      if (!vehicles.some((v) => v.id === vehicleId)) return;
      setSelection((prev) => {
        const ids = prev.userId === user?.id ? prev.ids : [];
        return {
          userId: user?.id,
          ids: ids.includes(vehicleId)
            ? ids.filter((id) => id !== vehicleId)
            : [...ids, vehicleId],
        };
      });
    },
    [vehicles, user?.id],
  );
  const selectAll = useCallback(
    () => setSelection({ userId: user?.id, ids: [] }),
    [user?.id],
  );
  const clearAll = useCallback(
    () =>
      setSelection({
        userId: user?.id,
        ids: vehicles.length ? [vehicles[0].id] : [],
      }),
    [vehicles, user?.id],
  );

  return {
    vehicles,
    selectedVehicleIds,
    toggleVehicle,
    selectAll,
    clearAll,
    loading,
    error,
    refetch,
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
        data.baselineFuelLogs,
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
export function useCostChartData(filters: AnalyticsFilters, enabled = true) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [chartDataset, setChartDataset] = useState<ChartDataset | null>(null);
  const requestId = useRef(0);

  const fetchData = useCallback(async () => {
    const id = ++requestId.current;
    if (!enabled) {
      setChartDataset(null);
      setError(null);
      setLoading(false);
      return;
    }
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

      if (id !== requestId.current) return;
      setChartDataset(dataset);
    } catch (err) {
      if (id !== requestId.current) return;
      console.error("Error fetching cost chart data:", err);
      setError(err as Error);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [user?.id, filters, enabled]);

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
