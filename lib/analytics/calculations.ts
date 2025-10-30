import {
  FuelLog,
  ServiceLog,
  MileageLog,
  Vehicle,
  ServiceType,
} from "../../types";
import {
  FuelEfficiencyMetrics,
  CostMetrics,
  ServiceMetrics,
  UpcomingService,
  VehiclePerformance,
  TrendDataPoint,
  AnalyticsPeriod,
  VehicleWithLogs,
  LocationCostData,
} from "../../types/analytics";

/**
 * Calculate fuel efficiency metrics from fuel logs
 * Formula: (liters_filled / distance_traveled) * 100 = L/100km
 */
export function calculateFuelEfficiency(
  fuelLogs: FuelLog[],
  mileageLogs: MileageLog[],
): FuelEfficiencyMetrics {
  if (fuelLogs.length === 0) {
    return {
      averageConsumption: 0,
      averageFuelPrice: 0,
      totalLitersFilled: 0,
      totalDistance: 0,
      fuelUps: 0,
      bestEfficiency: 0,
      worstEfficiency: 0,
    };
  }

  // Sort fuel logs by date and odometer reading
  const sortedFuelLogs = [...fuelLogs].sort(
    (a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime() ||
      a.odometer_reading - b.odometer_reading,
  );

  let totalLitersFilled = 0;
  let totalCost = 0;
  let totalDistance = 0;
  let validEfficiencyReadings = 0;
  let bestEfficiency = Infinity;
  let worstEfficiency = 0;
  let totalConsumption = 0;

  for (let i = 0; i < sortedFuelLogs.length; i++) {
    const currentLog = sortedFuelLogs[i];
    totalLitersFilled += currentLog.liters_filled;
    totalCost += currentLog.cost || 0;

    // Calculate efficiency only if we have a previous reading
    if (i > 0) {
      const previousLog = sortedFuelLogs[i - 1];
      const distance =
        currentLog.odometer_reading - previousLog.odometer_reading;

      // Only calculate if distance is positive and reasonable (less than 10000 km between fill-ups)
      if (distance > 0 && distance < 10000) {
        // Validate liters filled is positive
        if (currentLog.liters_filled <= 0) {
          console.warn(
            `Invalid fuel data: Log ${currentLog.id || i} has non-positive liters (${currentLog.liters_filled})`,
          );
          continue;
        }

        totalDistance += distance;
        // L/100km calculation
        const consumption = (currentLog.liters_filled / distance) * 100;

        // Only count reasonable consumption values (between 2 and 50 L/100km)
        if (consumption >= 2 && consumption <= 50) {
          totalConsumption += consumption;
          validEfficiencyReadings++;

          if (consumption < bestEfficiency) bestEfficiency = consumption;
          if (consumption > worstEfficiency) worstEfficiency = consumption;
        } else {
          console.warn(
            `Unrealistic fuel consumption calculated: ${consumption.toFixed(2)} L/100km for log ${currentLog.id || i}`,
          );
        }
      }
    }
  }

  const averageConsumption =
    validEfficiencyReadings > 0
      ? totalConsumption / validEfficiencyReadings
      : 0;
  const averageFuelPrice =
    totalLitersFilled > 0 ? totalCost / totalLitersFilled : 0;

  return {
    averageConsumption: parseFloat(averageConsumption.toFixed(2)),
    averageFuelPrice: parseFloat(averageFuelPrice.toFixed(2)),
    totalLitersFilled: parseFloat(totalLitersFilled.toFixed(2)),
    totalDistance: parseFloat(totalDistance.toFixed(2)),
    fuelUps: fuelLogs.length,
    bestEfficiency:
      bestEfficiency === Infinity ? 0 : parseFloat(bestEfficiency.toFixed(2)),
    worstEfficiency: parseFloat(worstEfficiency.toFixed(2)),
  };
}

/**
 * Calculate cost metrics across fuel and service logs
 */
export function calculateCostMetrics(
  fuelLogs: FuelLog[],
  serviceLogs: ServiceLog[],
  totalDistance: number,
): CostMetrics {
  const totalFuelCost = fuelLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
  const totalServiceCost = serviceLogs.reduce(
    (sum, log) => sum + (log.cost || 0),
    0,
  );
  const totalCost = totalFuelCost + totalServiceCost;

  const costPerKm = totalDistance > 0 ? totalCost / totalDistance : 0;
  const averageFuelCost =
    fuelLogs.length > 0 ? totalFuelCost / fuelLogs.length : 0;
  const averageServiceCost =
    serviceLogs.length > 0 ? totalServiceCost / serviceLogs.length : 0;

  return {
    totalFuelCost: parseFloat(totalFuelCost.toFixed(2)),
    totalServiceCost: parseFloat(totalServiceCost.toFixed(2)),
    totalCost: parseFloat(totalCost.toFixed(2)),
    costPerKm: parseFloat(costPerKm.toFixed(2)),
    averageFuelCost: parseFloat(averageFuelCost.toFixed(2)),
    averageServiceCost: parseFloat(averageServiceCost.toFixed(2)),
  };
}

/**
 * Calculate service-related metrics
 */
export function calculateServiceMetrics(
  serviceLogs: ServiceLog[],
  vehicles: Vehicle[],
): ServiceMetrics {
  const servicesByType: Record<ServiceType, number> = {
    oil_change: 0,
    tire_rotation: 0,
    brake_service: 0,
    general_maintenance: 0,
    repair: 0,
    inspection: 0,
    other: 0,
  };

  const costByServiceType: Record<ServiceType, number> = {
    oil_change: 0,
    tire_rotation: 0,
    brake_service: 0,
    general_maintenance: 0,
    repair: 0,
    inspection: 0,
    other: 0,
  };

  serviceLogs.forEach((log) => {
    const serviceType = log.service_type as ServiceType;
    servicesByType[serviceType] = (servicesByType[serviceType] || 0) + 1;
    costByServiceType[serviceType] =
      (costByServiceType[serviceType] || 0) + (log.cost || 0);
  });

  // Calculate average service interval
  const sortedLogs = [...serviceLogs].sort(
    (a, b) => a.odometer_reading - b.odometer_reading,
  );
  let totalIntervals = 0;
  let intervalCount = 0;

  for (let i = 1; i < sortedLogs.length; i++) {
    const interval =
      sortedLogs[i].odometer_reading - sortedLogs[i - 1].odometer_reading;
    if (interval > 0 && interval < 50000) {
      // Reasonable interval
      totalIntervals += interval;
      intervalCount++;
    }
  }

  const averageServiceInterval =
    intervalCount > 0 ? totalIntervals / intervalCount : 0;

  const upcomingServices = getUpcomingServices(serviceLogs, vehicles);

  return {
    totalServices: serviceLogs.length,
    servicesByType,
    costByServiceType,
    averageServiceInterval: parseFloat(averageServiceInterval.toFixed(2)),
    upcomingServices,
  };
}

/**
 * Get upcoming services based on next_service_due field
 */
export function getUpcomingServices(
  serviceLogs: ServiceLog[],
  vehicles: Vehicle[],
): UpcomingService[] {
  const upcomingServices: UpcomingService[] = [];

  serviceLogs.forEach((log) => {
    if (log.next_service_due) {
      const vehicle = vehicles.find((v) => v.id === log.vehicle_id);
      if (!vehicle) return;

      try {
        // Parse next_service_due - could be JSON or simple string
        let serviceDueAt: number;
        let daysUntilDue: number | undefined;

        if (typeof log.next_service_due === "string") {
          try {
            const parsed = JSON.parse(log.next_service_due);
            serviceDueAt = parsed.mileage || parsed.odometer;
            if (parsed.date) {
              const dueDate = new Date(parsed.date);
              const today = new Date();
              daysUntilDue = Math.ceil(
                (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
              );
            }
          } catch {
            // If not JSON, try to parse as number
            serviceDueAt = parseInt(log.next_service_due, 10);
          }
        } else {
          serviceDueAt = log.next_service_due as number;
        }

        const currentMileage = vehicle.current_mileage || log.odometer_reading;
        const kmUntilDue = serviceDueAt - currentMileage;

        let status: "overdue" | "due_soon" | "upcoming";
        if (
          kmUntilDue < 0 ||
          (daysUntilDue !== undefined && daysUntilDue < 0)
        ) {
          status = "overdue";
        } else if (
          kmUntilDue < 1000 ||
          (daysUntilDue !== undefined && daysUntilDue < 30)
        ) {
          status = "due_soon";
        } else {
          status = "upcoming";
        }

        upcomingServices.push({
          vehicleId: vehicle.id,
          vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          serviceType: log.service_type as ServiceType,
          currentMileage,
          serviceDueAt,
          daysUntilDue,
          kmUntilDue,
          status,
        });
      } catch (error) {
        console.error("Error parsing next_service_due:", error);
      }
    }
  });

  // Sort by urgency
  return upcomingServices.sort((a, b) => {
    const statusOrder = { overdue: 0, due_soon: 1, upcoming: 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return a.kmUntilDue - b.kmUntilDue;
  });
}

/**
 * Calculate vehicle comparison metrics
 */
export function calculateVehicleComparison(
  vehiclesWithLogs: VehicleWithLogs[],
): VehiclePerformance[] {
  return vehiclesWithLogs.map((vehicle) => {
    const fuelMetrics = calculateFuelEfficiency(
      vehicle.fuel_logs,
      vehicle.mileage_logs,
    );
    const costMetrics = calculateCostMetrics(
      vehicle.fuel_logs,
      vehicle.service_logs,
      fuelMetrics.totalDistance,
    );

    return {
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      totalDistance: fuelMetrics.totalDistance,
      fuelEfficiency: fuelMetrics.averageConsumption,
      totalCost: costMetrics.totalCost,
      costPerKm: costMetrics.costPerKm,
      serviceCount: vehicle.service_logs.length,
    };
  });
}

/**
 * Generate trend data for charts
 */
export function generateTrendData(
  logs: (FuelLog | ServiceLog)[],
  period: AnalyticsPeriod,
  metric: "cost" | "efficiency" | "frequency",
): TrendDataPoint[] {
  const filteredLogs = filterLogsByPeriod(
    logs,
    period.startDate,
    period.endDate,
  );
  const groupedByMonth = groupLogsByMonth(filteredLogs);

  const trendData: TrendDataPoint[] = [];

  Object.entries(groupedByMonth).forEach(([monthKey, monthLogs]) => {
    let value = 0;

    switch (metric) {
      case "cost":
        value = monthLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
        break;
      case "efficiency":
        // For fuel logs only
        if (monthLogs.length > 0 && "liters_filled" in monthLogs[0]) {
          const fuelLogs = monthLogs as FuelLog[];
          const efficiency = calculateFuelEfficiency(fuelLogs, []);
          value = efficiency.averageConsumption;
        }
        break;
      case "frequency":
        value = monthLogs.length;
        break;
    }

    trendData.push({
      date: monthKey,
      value: parseFloat(value.toFixed(2)),
      label: formatMonthLabel(monthKey),
    });
  });

  return trendData.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

/**
 * Filter logs by date period
 */
export function filterLogsByPeriod<T extends { date: string }>(
  logs: T[],
  startDate: Date,
  endDate: Date,
): T[] {
  return logs.filter((log) => {
    const logDate = new Date(log.date);
    return logDate >= startDate && logDate <= endDate;
  });
}

/**
 * Group logs by month
 */
export function groupLogsByMonth<T extends { date: string }>(
  logs: T[],
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};

  logs.forEach((log) => {
    const date = new Date(log.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    grouped[monthKey].push(log);
  });

  return grouped;
}

/**
 * Calculate location-based cost comparison
 */
export function calculateLocationCosts(
  fuelLogs: FuelLog[],
): LocationCostData[] {
  const locationMap: Record<
    string,
    { totalCost: number; visits: number; totalLiters: number }
  > = {};

  fuelLogs.forEach((log) => {
    const location = log.location || "Unknown";
    if (!locationMap[location]) {
      locationMap[location] = { totalCost: 0, visits: 0, totalLiters: 0 };
    }

    locationMap[location].totalCost += log.cost || 0;
    locationMap[location].visits += 1;
    locationMap[location].totalLiters += log.liters_filled;
  });

  return Object.entries(locationMap)
    .map(([location, data]) => ({
      location,
      averageCost: parseFloat((data.totalCost / data.visits).toFixed(2)),
      totalVisits: data.visits,
      totalSpent: parseFloat(data.totalCost.toFixed(2)),
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent);
}

/**
 * Helper function to format month labels
 */
function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/**
 * Calculate total distance from mileage logs
 */
export function calculateTotalDistance(mileageLogs: MileageLog[]): number {
  if (mileageLogs.length < 2) return 0;

  const sorted = [...mileageLogs].sort(
    (a, b) => a.odometer_reading - b.odometer_reading,
  );
  return (
    sorted[sorted.length - 1].odometer_reading - sorted[0].odometer_reading
  );
}

/**
 * Get period options
 */
export function getPeriodOptions(): AnalyticsPeriod[] {
  const now = new Date();

  return [
    {
      label: "7 Days",
      days: 7,
      startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      endDate: now,
    },
    {
      label: "30 Days",
      days: 30,
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: now,
    },
    {
      label: "3 Months",
      days: 90,
      startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      endDate: now,
    },
    {
      label: "6 Months",
      days: 180,
      startDate: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
      endDate: now,
    },
    {
      label: "1 Year",
      days: 365,
      startDate: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      endDate: now,
    },
  ];
}
