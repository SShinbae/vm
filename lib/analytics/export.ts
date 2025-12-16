import { format } from "date-fns";
import * as FileSystem from "expo-file-system/build/legacy/FileSystem";
import * as Sharing from "expo-sharing";
import { FuelLog, MileageLog, ServiceLog } from "../../types";
import {
  AnalyticsPeriod,
  AnalyticsResponse,
  VehiclePerformance,
} from "../../types/analytics";

/**
 * Export analytics data to CSV format
 */
export async function exportAnalyticsToCSV(
  data: {
    fuelLogs: FuelLog[];
    serviceLogs: ServiceLog[];
    mileageLogs: MileageLog[];
  },
  filename: string,
): Promise<void> {
  try {
    const { fuelLogs, serviceLogs, mileageLogs } = data;

    // Create CSV content
    let csvContent = "";

    // Fuel Logs Section
    if (fuelLogs.length > 0) {
      csvContent += "FUEL LOGS\n";
      csvContent +=
        "Date,Vehicle ID,Liters Filled,Cost,Odometer Reading,Location\n";
      fuelLogs.forEach((log) => {
        csvContent += `${log.date},${log.vehicle_id},${log.liters_filled},${log.cost || 0},${log.odometer_reading},"${log.location || ""}"\n`;
      });
      csvContent += "\n";
    }

    // Service Logs Section
    if (serviceLogs.length > 0) {
      csvContent += "SERVICE LOGS\n";
      csvContent +=
        "Date,Vehicle ID,Service Type,Description,Cost,Odometer Reading,Next Service Due\n";
      serviceLogs.forEach((log) => {
        csvContent += `${log.date},${log.vehicle_id},${log.service_type},"${log.description}",${log.cost || 0},${log.odometer_reading},"${log.next_service_due || ""}"\n`;
      });
      csvContent += "\n";
    }

    // Mileage Logs Section
    if (mileageLogs.length > 0) {
      csvContent += "MILEAGE LOGS\n";
      csvContent += "Date,Vehicle ID,Odometer Reading,Notes\n";
      mileageLogs.forEach((log) => {
        csvContent += `${log.date},${log.vehicle_id},${log.odometer_reading},"${log.notes || ""}"\n`;
      });
      csvContent += "\n";
    }

    // Save to file
    const fileUri = `${FileSystem.documentDirectory}${filename}.csv`;
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: "utf8",
    });

    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "text/csv",
        dialogTitle: "Export Analytics Data",
      });
    } else {
      throw new Error("Sharing is not available on this device");
    }
  } catch (error) {
    if (__DEV__) {
      console.error("Error exporting to CSV:", error);
    }
    throw error;
  }
}

/**
 * Generate a formatted analytics report as text
 */
export async function generateAnalyticsReport(
  analytics: AnalyticsResponse | null,
  period: AnalyticsPeriod,
  vehiclePerformance: VehiclePerformance[],
): Promise<string> {
  if (!analytics) {
    return "No analytics data available for the selected period.";
  }

  const { costMetrics, fuelMetrics, serviceMetrics, trends } = analytics;

  let report = "";

  // Header
  report += "=".repeat(50) + "\n";
  report += "VEHICLE ANALYTICS REPORT\n";
  report += "=".repeat(50) + "\n\n";

  // Period
  report += `Period: ${period.label}\n`;
  report += `From: ${format(period.startDate, "MMM dd, yyyy")}\n`;
  report += `To: ${format(period.endDate, "MMM dd, yyyy")}\n\n`;

  // Cost Summary
  report += "-".repeat(50) + "\n";
  report += "COST SUMMARY\n";
  report += "-".repeat(50) + "\n";
  report += `Total Cost: $${costMetrics.totalCost.toFixed(2)}\n`;
  report += `  - Fuel Cost: $${costMetrics.totalFuelCost.toFixed(2)}\n`;
  report += `  - Service Cost: $${costMetrics.totalServiceCost.toFixed(2)}\n`;
  report += `Cost per km: $${costMetrics.costPerKm.toFixed(2)}\n`;
  report += `Average Fuel Cost: $${costMetrics.averageFuelCost.toFixed(2)} per fill-up\n`;
  report += `Average Service Cost: $${costMetrics.averageServiceCost.toFixed(2)} per service\n\n`;

  // Fuel Efficiency
  report += "-".repeat(50) + "\n";
  report += "FUEL EFFICIENCY\n";
  report += "-".repeat(50) + "\n";
  report += `Average Consumption: ${fuelMetrics.averageConsumption.toFixed(1)} L/100km\n`;
  report += `Total Distance: ${fuelMetrics.totalDistance.toFixed(0)} km\n`;
  report += `Total Liters Filled: ${fuelMetrics.totalLitersFilled.toFixed(1)} L\n`;
  report += `Total Fill-ups: ${fuelMetrics.fuelUps}\n`;
  report += `Best Efficiency: ${fuelMetrics.bestEfficiency.toFixed(1)} L/100km\n`;
  report += `Worst Efficiency: ${fuelMetrics.worstEfficiency.toFixed(1)} L/100km\n`;
  report += `Average Fuel Price: $${fuelMetrics.averageFuelPrice.toFixed(2)} per liter\n\n`;

  // Service Summary
  report += "-".repeat(50) + "\n";
  report += "SERVICE SUMMARY\n";
  report += "-".repeat(50) + "\n";
  report += `Total Services: ${serviceMetrics.totalServices}\n`;
  report += `Average Service Interval: ${serviceMetrics.averageServiceInterval.toFixed(0)} km\n\n`;

  // Service Breakdown
  report += "Service Type Breakdown:\n";
  Object.entries(serviceMetrics.servicesByType).forEach(([type, count]) => {
    if (count > 0) {
      const cost =
        serviceMetrics.costByServiceType[
          type as keyof typeof serviceMetrics.costByServiceType
        ];
      const typeName = type
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      report += `  - ${typeName}: ${count}x ($${cost.toFixed(2)})\n`;
    }
  });
  report += "\n";

  // Upcoming Services
  if (serviceMetrics.upcomingServices.length > 0) {
    report += "Upcoming Maintenance:\n";
    serviceMetrics.upcomingServices.slice(0, 5).forEach((service) => {
      const typeName = service.serviceType
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      report += `  - ${service.vehicleName}: ${typeName}\n`;
      report += `    Due at: ${service.serviceDueAt.toLocaleString()} km (${service.kmUntilDue} km remaining)\n`;
      report += `    Status: ${service.status.toUpperCase()}\n`;
    });
    report += "\n";
  }

  // Trends
  report += "-".repeat(50) + "\n";
  report += "TRENDS\n";
  report += "-".repeat(50) + "\n";
  report += `Cost Trend: ${trends.cost.direction.toUpperCase()} ${trends.cost.percentage}%\n`;
  report += `Fuel Efficiency Trend: ${trends.fuelEfficiency.direction.toUpperCase()} ${trends.fuelEfficiency.percentage}%\n`;
  report += `Service Frequency Trend: ${trends.serviceFrequency.direction.toUpperCase()} ${trends.serviceFrequency.percentage}%\n\n`;

  // Vehicle Comparison
  if (vehiclePerformance.length > 1) {
    report += "-".repeat(50) + "\n";
    report += "VEHICLE COMPARISON\n";
    report += "-".repeat(50) + "\n";
    vehiclePerformance.forEach((vehicle, index) => {
      report += `${index + 1}. ${vehicle.vehicleName}\n`;
      report += `   Total Cost: $${vehicle.totalCost.toFixed(2)}\n`;
      report += `   Cost per km: $${vehicle.costPerKm.toFixed(2)}\n`;
      report += `   Fuel Efficiency: ${vehicle.fuelEfficiency.toFixed(1)} L/100km\n`;
      report += `   Distance: ${vehicle.totalDistance.toFixed(0)} km\n`;
      report += `   Services: ${vehicle.serviceCount}\n\n`;
    });
  }

  // Footer
  report += "=".repeat(50) + "\n";
  report += `Generated on: ${format(new Date(), "MMM dd, yyyy 'at' HH:mm")}\n`;
  report += "=".repeat(50) + "\n";

  return report;
}

/**
 * Export analytics report as text file
 */
export async function exportAnalyticsReport(
  analytics: AnalyticsResponse | null,
  period: AnalyticsPeriod,
  vehiclePerformance: VehiclePerformance[],
  filename: string,
): Promise<void> {
  try {
    const report = await generateAnalyticsReport(
      analytics,
      period,
      vehiclePerformance,
    );

    // Save to file
    const fileUri = `${FileSystem.documentDirectory}${filename}.txt`;
    await FileSystem.writeAsStringAsync(fileUri, report, {
      encoding: "utf8",
    });

    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "text/plain",
        dialogTitle: "Export Analytics Report",
      });
    } else {
      throw new Error("Sharing is not available on this device");
    }
  } catch (error) {
    if (__DEV__) {
      console.error("Error exporting report:", error);
    }
    throw error;
  }
}

/**
 * Helper function to generate filename with timestamp
 */
export function generateExportFilename(prefix: string = "analytics"): string {
  const timestamp = format(new Date(), "yyyy-MM-dd_HHmmss");
  return `${prefix}_${timestamp}`;
}
