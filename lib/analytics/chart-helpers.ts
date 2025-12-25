/**
 * Chart data transformation helpers for cost visualization
 * Handles grouping, aggregation, and formatting of cost data for charts
 */

import { FuelLog, ServiceLog } from "../../types";
import {
  ChartGrouping,
  CostChartDataPoint,
  ChartDataset,
  PieChartDataPoint,
  AnalyticsPeriod,
} from "../../types/analytics";

/**
 * Determines the optimal grouping based on date range
 * Auto-selects: day (<14 days), week (14-90 days), month (>90 days)
 */
export function determineOptimalGrouping(
  startDate: Date,
  endDate: Date,
): ChartGrouping {
  const diffInDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffInDays < 14) {
    return "day";
  } else if (diffInDays <= 90) {
    return "week";
  } else {
    return "month";
  }
}

/**
 * Formats a date label based on grouping type
 */
export function formatChartLabel(date: Date, grouping: ChartGrouping): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  switch (grouping) {
    case "day":
      // Format: "Mon 15" or "Jan 15" for different months
      const day = date.getDate();
      const month = months[date.getMonth()];
      return `${month} ${day}`;

    case "week":
      // Format: "Week 1" or "Jan W1"
      const weekNum = getWeekNumber(date);
      return `W${weekNum}`;

    case "month":
      // Format: "Jan 24" or "Jan 2024"
      const monthName = months[date.getMonth()];
      const year = date.getFullYear().toString().slice(-2);
      return `${monthName} ${year}`;

    default:
      return date.toISOString().split("T")[0];
  }
}

/**
 * Gets ISO week number for a date
 */
function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Gets the start of a period (day/week/month) for a given date
 */
function getGroupStartDate(date: Date, grouping: ChartGrouping): Date {
  const d = new Date(date);

  switch (grouping) {
    case "day":
      d.setHours(0, 0, 0, 0);
      return d;

    case "week":
      const day = d.getDay();
      const diff = d.getDate() - day; // Start on Sunday
      d.setDate(diff);
      d.setHours(0, 0, 0, 0);
      return d;

    case "month":
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;

    default:
      return d;
  }
}

/**
 * Groups fuel and service logs by period and aggregates costs
 */
export function groupByPeriod(
  fuelLogs: FuelLog[],
  serviceLogs: ServiceLog[],
  startDate: Date,
  endDate: Date,
  grouping: ChartGrouping,
): CostChartDataPoint[] {
  const groupedData = new Map<string, CostChartDataPoint>();

  // Process fuel logs
  fuelLogs.forEach((log) => {
    const logDate = new Date(log.date);
    if (logDate >= startDate && logDate <= endDate) {
      const groupDate = getGroupStartDate(logDate, grouping);
      const key = groupDate.toISOString();

      const existing = groupedData.get(key) || {
        date: key,
        timestamp: groupDate.getTime(),
        fuelCost: 0,
        serviceCost: 0,
        totalCost: 0,
        label: formatChartLabel(groupDate, grouping),
        grouping,
      };

      existing.fuelCost += log.cost || 0;
      existing.totalCost += log.cost || 0;
      groupedData.set(key, existing);
    }
  });

  // Process service logs
  serviceLogs.forEach((log) => {
    const logDate = new Date(log.date);
    if (logDate >= startDate && logDate <= endDate) {
      const groupDate = getGroupStartDate(logDate, grouping);
      const key = groupDate.toISOString();

      const existing = groupedData.get(key) || {
        date: key,
        timestamp: groupDate.getTime(),
        fuelCost: 0,
        serviceCost: 0,
        totalCost: 0,
        label: formatChartLabel(groupDate, grouping),
        grouping,
      };

      existing.serviceCost += log.cost || 0;
      existing.totalCost += log.cost || 0;
      groupedData.set(key, existing);
    }
  });

  // Fill in missing periods with zero values
  const filledData = fillMissingPeriods(
    Array.from(groupedData.values()),
    startDate,
    endDate,
    grouping,
  );

  // Sort by timestamp
  return filledData.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Fills in missing periods with zero-cost data points
 * Ensures continuous chart data even when there are no transactions
 */
function fillMissingPeriods(
  data: CostChartDataPoint[],
  startDate: Date,
  endDate: Date,
  grouping: ChartGrouping,
): CostChartDataPoint[] {
  if (data.length === 0) {
    // Create at least one data point if there's no data
    const groupDate = getGroupStartDate(startDate, grouping);
    return [
      {
        date: groupDate.toISOString(),
        timestamp: groupDate.getTime(),
        fuelCost: 0,
        serviceCost: 0,
        totalCost: 0,
        label: formatChartLabel(groupDate, grouping),
        grouping,
      },
    ];
  }

  const result: CostChartDataPoint[] = [];
  const existingMap = new Map(data.map((d) => [d.date, d]));

  let currentDate = getGroupStartDate(startDate, grouping);
  const end = getGroupStartDate(endDate, grouping);

  while (currentDate <= end) {
    const key = currentDate.toISOString();
    const existing = existingMap.get(key);

    if (existing) {
      result.push(existing);
    } else {
      result.push({
        date: key,
        timestamp: currentDate.getTime(),
        fuelCost: 0,
        serviceCost: 0,
        totalCost: 0,
        label: formatChartLabel(currentDate, grouping),
        grouping,
      });
    }

    // Move to next period
    currentDate = getNextPeriod(currentDate, grouping);
  }

  return result;
}

/**
 * Gets the next period date based on grouping
 */
function getNextPeriod(date: Date, grouping: ChartGrouping): Date {
  const next = new Date(date);

  switch (grouping) {
    case "day":
      next.setDate(next.getDate() + 1);
      break;
    case "week":
      next.setDate(next.getDate() + 7);
      break;
    case "month":
      next.setMonth(next.getMonth() + 1);
      break;
  }

  return next;
}

/**
 * Generates complete chart dataset with data and summary
 */
export function generateCostChartData(
  fuelLogs: FuelLog[],
  serviceLogs: ServiceLog[],
  period: AnalyticsPeriod,
): ChartDataset {
  const { startDate, endDate } = period;
  const grouping = determineOptimalGrouping(startDate, endDate);
  const data = groupByPeriod(
    fuelLogs,
    serviceLogs,
    startDate,
    endDate,
    grouping,
  );

  // Calculate summary
  const totalFuelCost = data.reduce((sum, d) => sum + d.fuelCost, 0);
  const totalServiceCost = data.reduce((sum, d) => sum + d.serviceCost, 0);
  const totalCost = totalFuelCost + totalServiceCost;

  const daysInRange = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const averageDailyCost = daysInRange > 0 ? totalCost / daysInRange : 0;

  return {
    data,
    grouping,
    dateRange: {
      start: startDate,
      end: endDate,
    },
    summary: {
      totalFuelCost,
      totalServiceCost,
      totalCost,
      averageDailyCost,
    },
  };
}

/**
 * Generates pie chart data for fuel vs service cost breakdown
 */
export function generatePieChartData(
  totalFuelCost: number,
  totalServiceCost: number,
  colors: { fuel: string; service: string },
): PieChartDataPoint[] {
  const total = totalFuelCost + totalServiceCost;

  if (total === 0) {
    return [];
  }

  const fuelPercentage = (totalFuelCost / total) * 100;
  const servicePercentage = (totalServiceCost / total) * 100;

  return [
    {
      label: "Fuel",
      value: totalFuelCost,
      percentage: fuelPercentage,
      color: colors.fuel,
    },
    {
      label: "Service",
      value: totalServiceCost,
      percentage: servicePercentage,
      color: colors.service,
    },
  ];
}

/**
 * Transforms chart data for Victory Native line/area charts
 */
export function transformToVictoryData(
  data: CostChartDataPoint[],
  type: "fuel" | "service" | "total",
): { x: string; y: number }[] {
  return data.map((d) => ({
    x: d.label,
    y:
      type === "fuel"
        ? d.fuelCost
        : type === "service"
          ? d.serviceCost
          : d.totalCost,
  }));
}

/**
 * Transforms chart data for Victory Native stacked bar charts
 */
export function transformToStackedData(
  data: CostChartDataPoint[],
): { x: string; fuel: number; service: number }[] {
  return data.map((d) => ({
    x: d.label,
    fuel: d.fuelCost,
    service: d.serviceCost,
  }));
}

/**
 * Transforms pie chart data for Victory Native
 */
export function transformToPieData(
  data: PieChartDataPoint[],
): { x: string; y: number; label: string }[] {
  return data.map((d) => ({
    x: d.label,
    y: d.value,
    label: `${d.label}\n${d.percentage.toFixed(1)}%`,
  }));
}

/**
 * Calculates cumulative cost data for area charts
 */
export function calculateCumulativeCosts(
  data: CostChartDataPoint[],
): CostChartDataPoint[] {
  let cumulativeFuel = 0;
  let cumulativeService = 0;
  let cumulativeTotal = 0;

  return data.map((d) => {
    cumulativeFuel += d.fuelCost;
    cumulativeService += d.serviceCost;
    cumulativeTotal += d.totalCost;

    return {
      ...d,
      fuelCost: cumulativeFuel,
      serviceCost: cumulativeService,
      totalCost: cumulativeTotal,
    };
  });
}
