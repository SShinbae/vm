import { AnalyticsService } from "@/lib/services/analyticsService";
import {
  FuelLogService,
  ServiceLogService,
} from "@/lib/services/loggingService";

describe("AnalyticsService", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("aggregates expenses by category and vehicle", async () => {
    const date = new Date().toISOString().slice(0, 10);
    const vehicles = { year: 2024, make: "Toyota", model: "Corolla" };
    jest.spyOn(FuelLogService, "getFuelLogs").mockResolvedValue({
      data: [{ vehicle_id: "vehicle-1", date, cost: 100, vehicles }],
    } as any);
    jest.spyOn(ServiceLogService, "getServiceLogs").mockResolvedValue({
      data: [{ vehicle_id: "vehicle-1", date, cost: 50, vehicles }],
    } as any);

    const result = await AnalyticsService.getAnalytics("alltime");

    expect(result.totalExpenses).toBe(150);
    expect(result.expenseBreakdown).toEqual([
      { category: "Fuel", amount: 100, percentage: 67, color: "#10B981" },
      { category: "Service", amount: 50, percentage: 33, color: "#F59E0B" },
    ]);
    expect(result.vehicleAnalytics).toEqual([
      {
        vehicleId: "vehicle-1",
        vehicleName: "2024 Toyota Corolla",
        fuelCosts: 100,
        serviceCosts: 50,
        totalExpenses: 150,
      },
    ]);
  });

  it("returns an empty result when loading logs fails", async () => {
    jest
      .spyOn(FuelLogService, "getFuelLogs")
      .mockRejectedValue(new Error("offline"));
    jest.spyOn(ServiceLogService, "getServiceLogs").mockResolvedValue({
      data: [],
    } as any);

    await expect(AnalyticsService.getAnalytics("last3months")).resolves.toEqual(
      expect.objectContaining({
        totalExpenses: 0,
        monthlyTrends: [],
        expenseBreakdown: [],
        vehicleAnalytics: [],
        period: "last3months",
      }),
    );
  });
});
