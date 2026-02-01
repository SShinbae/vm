/**
 * Analytics-specific types for the vehicles management app
 */

import type {
  FuelLog,
  MileageLog,
  ServiceLog,
  ServiceType,
  Vehicle,
} from "./index";

// ============================================================================
// Analytics Period Types
// ============================================================================

export interface AnalyticsPeriod {
  label: string;
  days: number;
  startDate: Date;
  endDate: Date;
}

export interface CustomDateRange {
  startDate: Date;
  endDate: Date;
  isCustom: boolean;
}

// ============================================================================
// Cost Metrics Types
// ============================================================================

export interface CostMetrics {
  totalFuelCost: number;
  totalServiceCost: number;
  totalCost: number;
  costPerKm: number;
  averageFuelCost: number;
  averageServiceCost: number;
}

// ============================================================================
// Fuel Efficiency Types
// ============================================================================

export interface FuelEfficiencyMetrics {
  averageConsumption: number; // liters per 100km
  averageFuelPrice: number;
  totalLitersFilled: number;
  totalDistance: number;
  fuelUps: number;
  bestEfficiency: number;
  worstEfficiency: number;
}

// ============================================================================
// Service Metrics Types
// ============================================================================

export interface ServiceMetrics {
  totalServices: number;
  servicesByType: Record<ServiceType, number>;
  costByServiceType: Record<ServiceType, number>;
  averageServiceInterval: number; // in km
  upcomingServices: UpcomingService[];
}

export interface UpcomingService {
  vehicleId: string;
  vehicleName: string;
  serviceType: ServiceType;
  currentMileage: number;
  serviceDueAt: number;
  daysUntilDue?: number;
  kmUntilDue: number;
  other?: string;
  odometer?: number;
  status: "overdue" | "due_soon" | "upcoming";
}

// ============================================================================
// Vehicle Performance Types
// ============================================================================

export interface VehiclePerformance {
  vehicleId: string;
  vehicleName: string;
  totalDistance: number;
  fuelEfficiency: number;
  totalCost: number;
  costPerKm: number;
  serviceCount: number;
}

// ============================================================================
// Trend Analysis Types
// ============================================================================

export interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface TrendAnalysis {
  direction: "up" | "down" | "neutral";
  percentage: number;
  comparisonPeriod: string;
}

// ============================================================================
// Chart Data Types
// ============================================================================

export type ChartGrouping = "day" | "week" | "month";

export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
}

export interface CostChartDataPoint {
  date: string; // ISO string
  timestamp: number; // For sorting
  fuelCost: number;
  serviceCost: number;
  totalCost: number;
  label: string; // Formatted display label (e.g., "Jan 15", "Week 3")
  grouping: ChartGrouping;
}

export interface ChartDataset {
  data: CostChartDataPoint[];
  grouping: ChartGrouping;
  dateRange: {
    start: Date;
    end: Date;
  };
  summary: {
    totalFuelCost: number;
    totalServiceCost: number;
    totalCost: number;
    averageDailyCost: number;
  };
}

export interface PieChartDataPoint {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

// ============================================================================
// Location Analytics Types
// ============================================================================

export interface LocationCostData {
  location: string;
  averageCost: number;
  totalVisits: number;
  totalSpent: number;
}

// ============================================================================
// Analytics Filter Types
// ============================================================================

export interface AnalyticsFilters {
  period: AnalyticsPeriod;
  vehicleIds: string[]; // empty array means all vehicles
  groupId?: string; // for group-based analytics
}

// ============================================================================
// Analytics Data Types
// ============================================================================

export interface AnalyticsData {
  fuelLogs: FuelLog[];
  serviceLogs: ServiceLog[];
  mileageLogs: MileageLog[];
  vehicles: Vehicle[];
}

export interface VehicleWithAnalyticsLogs extends Vehicle {
  fuel_logs: FuelLog[];
  service_logs: ServiceLog[];
  mileage_logs: MileageLog[];
}

// ============================================================================
// Complete Analytics Response
// ============================================================================

export interface AnalyticsResponse {
  costMetrics: CostMetrics;
  fuelMetrics: FuelEfficiencyMetrics;
  serviceMetrics: ServiceMetrics;
  vehicleComparison: VehiclePerformance[];
  trends: {
    cost: TrendAnalysis;
    fuelEfficiency: TrendAnalysis;
    serviceFrequency: TrendAnalysis;
  };
  locationData?: LocationCostData[];
}
