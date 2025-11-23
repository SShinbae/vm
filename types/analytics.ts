import { FuelLog, MileageLog, ServiceLog, ServiceType, Vehicle } from "./index";

// Analytics-specific types
export interface AnalyticsPeriod {
  label: string;
  days: number;
  startDate: Date;
  endDate: Date;
}

export interface CostMetrics {
  totalFuelCost: number;
  totalServiceCost: number;
  totalCost: number;
  costPerKm: number;
  averageFuelCost: number;
  averageServiceCost: number;
}

export interface FuelEfficiencyMetrics {
  averageConsumption: number; // liters per 100km
  averageFuelPrice: number;
  totalLitersFilled: number;
  totalDistance: number;
  fuelUps: number;
  bestEfficiency: number;
  worstEfficiency: number;
}

export interface ServiceMetrics {
  totalServices: number;
  servicesByType: Record<ServiceType, number>;
  costByServiceType: Record<ServiceType, number>;
  averageServiceInterval: number; // in km
  upcomingServices: UpcomingService[];
}

export interface VehiclePerformance {
  vehicleId: string;
  vehicleName: string;
  totalDistance: number;
  fuelEfficiency: number;
  totalCost: number;
  costPerKm: number;
  serviceCount: number;
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

export interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
}

export interface AnalyticsFilters {
  period: AnalyticsPeriod;
  vehicleIds: string[]; // empty array means all vehicles
  groupId?: string; // for group-based analytics
}

export interface AnalyticsData {
  fuelLogs: FuelLog[];
  serviceLogs: ServiceLog[];
  mileageLogs: MileageLog[];
  vehicles: Vehicle[];
}

export interface VehicleWithLogs extends Vehicle {
  fuel_logs: FuelLog[];
  service_logs: ServiceLog[];
  mileage_logs: MileageLog[];
}

// Location-based analytics
export interface LocationCostData {
  location: string;
  averageCost: number;
  totalVisits: number;
  totalSpent: number;
}

// Trend analysis
export interface TrendAnalysis {
  direction: "up" | "down" | "neutral";
  percentage: number;
  comparisonPeriod: string;
}

// Complete analytics response
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
