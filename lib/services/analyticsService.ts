import { FuelLogService, ServiceLogService } from "./loggingService";
import { FuelLog, ServiceLog, Vehicle } from "../../types";

// Extended types with vehicle relation
type FuelLogWithVehicle = FuelLog & { vehicles?: Vehicle };
type ServiceLogWithVehicle = ServiceLog & { vehicles?: Vehicle };

export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
}

export interface MonthlyTrend {
  month: string;
  fuel: number;
  service: number;
  total: number;
}

export interface ExpenseBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface VehicleAnalytics {
  vehicleId: string;
  vehicleName: string;
  totalExpenses: number;
  fuelCosts: number;
  serviceCosts: number;
  averageMileage?: number;
}

export interface AnalyticsData {
  monthlyTrends: MonthlyTrend[];
  expenseBreakdown: ExpenseBreakdown[];
  vehicleAnalytics: VehicleAnalytics[];
  totalExpenses: number;
  fuelTrend: number;
  serviceTrend: number;
  period: "last3months" | "last6months" | "lastyear" | "alltime";
}

export class AnalyticsService {
  /**
   * Get comprehensive analytics data for the specified period
   */
  static async getAnalytics(
    period:
      | "last3months"
      | "last6months"
      | "lastyear"
      | "alltime" = "last6months",
  ): Promise<AnalyticsData> {
    try {
      // Fetch all data in parallel
      const [fuelResponse, serviceResponse] = await Promise.all([
        FuelLogService.getFuelLogs(),
        ServiceLogService.getServiceLogs(),
      ]);

      const fuelLogs = fuelResponse.data || [];
      const serviceLogs = serviceResponse.data || [];

      // Filter data based on period
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case "last3months":
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          break;
        case "last6months":
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
          break;
        case "lastyear":
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
          break;
        case "alltime":
        default:
          startDate = new Date(2020, 0, 1); // Very old date to include all data
          break;
      }

      const filteredFuelLogs = fuelLogs.filter(
        (log) => new Date(log.date) >= startDate,
      );
      const filteredServiceLogs = serviceLogs.filter(
        (log) => new Date(log.date) >= startDate,
      );

      // Calculate analytics
      const monthlyTrends = this.calculateMonthlyTrends(
        filteredFuelLogs,
        filteredServiceLogs,
        period,
      );
      const expenseBreakdown = this.calculateExpenseBreakdown(
        filteredFuelLogs,
        filteredServiceLogs,
      );
      const vehicleAnalytics = this.calculateVehicleAnalytics(
        filteredFuelLogs,
        filteredServiceLogs,
      );

      // Calculate trends (comparing last month to previous month)
      const trends = this.calculateTrends(monthlyTrends);

      const totalExpenses =
        filteredFuelLogs.reduce((sum, log) => sum + (log.cost || 0), 0) +
        filteredServiceLogs.reduce((sum, log) => sum + (log.cost || 0), 0);

      return {
        monthlyTrends,
        expenseBreakdown,
        vehicleAnalytics,
        totalExpenses,
        fuelTrend: trends.fuelTrend,
        serviceTrend: trends.serviceTrend,
        period,
      };
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      return {
        monthlyTrends: [],
        expenseBreakdown: [],
        vehicleAnalytics: [],
        totalExpenses: 0,
        fuelTrend: 0,
        serviceTrend: 0,
        period,
      };
    }
  }

  /**
   * Calculate monthly expense trends
   */
  private static calculateMonthlyTrends(
    fuelLogs: FuelLog[],
    serviceLogs: ServiceLog[],
    period: string,
  ): MonthlyTrend[] {
    const monthlyData = new Map<string, { fuel: number; service: number }>();

    // Initialize months based on period
    const now = new Date();
    const months =
      period === "last3months" ? 3 : period === "last6months" ? 6 : 12;

    for (let i = 0; i < months; i++) {
      const year = now.getFullYear();
      const month = now.getMonth() - i;
      const date = new Date(year, month, 1);
      // Format manually to avoid timezone issues with toISOString()
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyData.set(monthKey, { fuel: 0, service: 0 });
    }

    // Aggregate fuel costs by month
    fuelLogs.forEach((log) => {
      const monthKey = log.date.slice(0, 7);
      if (monthlyData.has(monthKey)) {
        const current = monthlyData.get(monthKey)!;
        current.fuel += log.cost || 0;
      }
    });

    // Aggregate service costs by month
    serviceLogs.forEach((log) => {
      const monthKey = log.date.slice(0, 7);
      if (monthlyData.has(monthKey)) {
        const current = monthlyData.get(monthKey)!;
        current.service += log.cost || 0;
      }
    });

    // Convert to array format and sort by date (newest first)
    return Array.from(monthlyData.entries())
      .sort((a, b) => b[0].localeCompare(a[0])) // Sort descending by monthKey (YYYY-MM)
      .map(([monthKey, data]) => ({
        month: this.formatMonthLabel(monthKey),
        fuel: Math.round(data.fuel * 100) / 100,
        service: Math.round(data.service * 100) / 100,
        total: Math.round((data.fuel + data.service) * 100) / 100,
      }));
  }

  /**
   * Calculate expense breakdown by category
   */
  private static calculateExpenseBreakdown(
    fuelLogs: FuelLog[],
    serviceLogs: ServiceLog[],
  ): ExpenseBreakdown[] {
    const totalFuelCosts = fuelLogs.reduce(
      (sum, log) => sum + (log.cost || 0),
      0,
    );
    const totalServiceCosts = serviceLogs.reduce(
      (sum, log) => sum + (log.cost || 0),
      0,
    );
    const totalExpenses = totalFuelCosts + totalServiceCosts;

    if (totalExpenses === 0) {
      return [];
    }

    const breakdown: ExpenseBreakdown[] = [];

    if (totalFuelCosts > 0) {
      breakdown.push({
        category: "Fuel",
        amount: Math.round(totalFuelCosts * 100) / 100,
        percentage: Math.round((totalFuelCosts / totalExpenses) * 100),
        color: "#10B981", // Green for fuel
      });
    }

    if (totalServiceCosts > 0) {
      breakdown.push({
        category: "Service",
        amount: Math.round(totalServiceCosts * 100) / 100,
        percentage: Math.round((totalServiceCosts / totalExpenses) * 100),
        color: "#F59E0B", // Orange for service
      });
    }

    return breakdown;
  }

  /**
   * Calculate analytics per vehicle
   */
  private static calculateVehicleAnalytics(
    fuelLogs: FuelLogWithVehicle[],
    serviceLogs: ServiceLogWithVehicle[],
  ): VehicleAnalytics[] {
    const vehicleData = new Map<
      string,
      {
        name: string;
        fuelCosts: number;
        serviceCosts: number;
      }
    >();

    // Aggregate fuel costs by vehicle
    (fuelLogs as FuelLogWithVehicle[]).forEach((log) => {
      if (log.vehicles) {
        const vehicleKey = log.vehicle_id;
        const vehicleName = `${log.vehicles.year} ${log.vehicles.make} ${log.vehicles.model}`;

        if (!vehicleData.has(vehicleKey)) {
          vehicleData.set(vehicleKey, {
            name: vehicleName,
            fuelCosts: 0,
            serviceCosts: 0,
          });
        }

        const current = vehicleData.get(vehicleKey)!;
        current.fuelCosts += log.cost || 0;
      }
    });

    // Aggregate service costs by vehicle
    (serviceLogs as ServiceLogWithVehicle[]).forEach((log) => {
      if (log.vehicles) {
        const vehicleKey = log.vehicle_id;
        const vehicleName = `${log.vehicles.year} ${log.vehicles.make} ${log.vehicles.model}`;

        if (!vehicleData.has(vehicleKey)) {
          vehicleData.set(vehicleKey, {
            name: vehicleName,
            fuelCosts: 0,
            serviceCosts: 0,
          });
        }

        const current = vehicleData.get(vehicleKey)!;
        current.serviceCosts += log.cost || 0;
      }
    });

    // Convert to array format
    return Array.from(vehicleData.entries()).map(([vehicleId, data]) => ({
      vehicleId,
      vehicleName: data.name,
      fuelCosts: Math.round(data.fuelCosts * 100) / 100,
      serviceCosts: Math.round(data.serviceCosts * 100) / 100,
      totalExpenses:
        Math.round((data.fuelCosts + data.serviceCosts) * 100) / 100,
    }));
  }

  /**
   * Calculate percentage trends comparing recent periods
   */
  private static calculateTrends(monthlyTrends: MonthlyTrend[]): {
    fuelTrend: number;
    serviceTrend: number;
  } {
    if (monthlyTrends.length < 2) {
      return { fuelTrend: 0, serviceTrend: 0 };
    }

    const lastMonth = monthlyTrends[monthlyTrends.length - 1];
    const previousMonth = monthlyTrends[monthlyTrends.length - 2];

    const fuelTrend =
      previousMonth.fuel > 0
        ? ((lastMonth.fuel - previousMonth.fuel) / previousMonth.fuel) * 100
        : 0;

    const serviceTrend =
      previousMonth.service > 0
        ? ((lastMonth.service - previousMonth.service) /
            previousMonth.service) *
          100
        : 0;

    return {
      fuelTrend: Math.round(fuelTrend * 10) / 10,
      serviceTrend: Math.round(serviceTrend * 10) / 10,
    };
  }

  /**
   * Format month key to readable label
   */
  private static formatMonthLabel(monthKey: string): string {
    const date = new Date(monthKey + "-01");
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }

  /**
   * Get data formatted for line charts
   */
  static formatForLineChart(
    monthlyTrends: MonthlyTrend[],
    dataType: "fuel" | "service" | "total",
  ): ChartDataPoint[] {
    return monthlyTrends.map((trend, index) => ({
      x: index,
      y: trend[dataType],
      label: trend.month,
    }));
  }

  /**
   * Get data formatted for pie charts
   */
  static formatForPieChart(
    expenseBreakdown: ExpenseBreakdown[],
  ): ChartDataPoint[] {
    return expenseBreakdown.map((item) => ({
      x: item.category,
      y: item.amount,
      label: `${item.category} (${item.percentage}%)`,
    }));
  }

  /**
   * Get data formatted for bar charts
   */
  static formatForBarChart(
    vehicleAnalytics: VehicleAnalytics[],
  ): ChartDataPoint[] {
    return vehicleAnalytics.map((vehicle, index) => ({
      x: index,
      y: vehicle.totalExpenses,
      label: vehicle.vehicleName,
    }));
  }
}
