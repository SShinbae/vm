import { calculateDelta, generateInsights } from "@/lib/analytics/overview";
import { getPreviousPeriod } from "@/lib/analytics/calculations";
import type { CostChartDataPoint } from "@/types/analytics";

const fuel = (c: number) => ({
  averageConsumption: c,
  averageFuelPrice: 2,
  totalLitersFilled: 10,
  totalDistance: 100,
  fuelUps: 2,
  bestEfficiency: c,
  worstEfficiency: c,
});
const point = (label: string, totalCost: number): CostChartDataPoint => ({
  date: "2026-01-01",
  timestamp: 0,
  fuelCost: totalCost,
  serviceCost: 0,
  totalCost,
  label,
  grouping: "month",
});

describe("getPreviousPeriod", () => {
  it("is adjacent, non-overlapping and the same length", () => {
    const p = {
      label: "30 Days",
      days: 30,
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-10-01"),
    };
    const prev = getPreviousPeriod(p);
    expect(prev.endDate.getTime()).toBe(p.startDate.getTime());
    expect(prev.endDate.getTime() - prev.startDate.getTime()).toBe(
      p.endDate.getTime() - p.startDate.getTime(),
    );
    expect(prev.days).toBe(30);
    expect(prev.label).toBe("Previous 30 Days");
  });
});

describe("calculateDelta", () => {
  it("returns null for zero or missing previous", () => {
    expect(calculateDelta(10, 0)).toBeNull();
    expect(calculateDelta(10, null)).toBeNull();
    expect(calculateDelta(10, undefined)).toBeNull();
  });
  it("computes percent change and direction", () => {
    expect(calculateDelta(120, 100)).toEqual({ pct: 20, direction: "up" });
    expect(calculateDelta(75, 100)).toEqual({ pct: 25, direction: "down" });
    expect(calculateDelta(100, 100)).toEqual({ pct: 0, direction: "neutral" });
  });
});

describe("generateInsights", () => {
  const base = {
    fuelMetrics: fuel(8),
    serviceMetrics: null,
    series: [] as CostChartDataPoint[],
  };
  it("is empty with no inputs", () => {
    expect(generateInsights(base)).toEqual([]);
  });
  it("reports efficiency change only when previous exists and is non-zero", () => {
    expect(
      generateInsights({ ...base, previousFuelMetrics: fuel(10) }).join(),
    ).toMatch(/efficiency/i);
    expect(generateInsights({ ...base, previousFuelMetrics: fuel(0) })).toEqual(
      [],
    );
  });
  it("reports the lowest-cost bucket", () => {
    const out = generateInsights({
      ...base,
      series: [point("Jan", 200), point("Feb", 50)],
    });
    expect(out.join()).toMatch(/Feb/);
    expect(out.join()).toMatch(/50/);
  });
  it("ignores zero-cost buckets for lowest-cost", () => {
    const out = generateInsights({
      ...base,
      series: [point("Jan", 0), point("Feb", 200), point("Mar", 50)],
    });
    expect(out.join()).toMatch(/Mar/);
    expect(out.join()).not.toMatch(/RM0\.00/);
  });
  it("omits lowest-cost with fewer than 2 non-zero buckets", () => {
    expect(
      generateInsights({
        ...base,
        series: [point("Jan", 0), point("Feb", 200)],
      }).join(),
    ).not.toMatch(/Lowest/);
  });
  it("reports the next upcoming service", () => {
    const out = generateInsights({
      ...base,
      serviceMetrics: {
        totalServices: 1,
        servicesByType: {} as any,
        costByServiceType: {} as any,
        averageServiceInterval: 0,
        upcomingServices: [
          {
            vehicleId: "v",
            vehicleName: "Myvi",
            serviceType: "oil_change" as any,
            currentMileage: 0,
            serviceDueAt: 0,
            kmUntilDue: 500,
            daysUntilDue: 12,
            status: "upcoming",
          },
        ],
      },
    });
    expect(out.join()).toMatch(/Myvi/);
    expect(out.join()).toMatch(/12/);
  });
});
