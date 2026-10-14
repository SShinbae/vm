export type FuelCostPoint = { month: string; label: string; value: number };

export function buildFuelCostTrend(
  logs: { date: string; cost: number | null }[],
  months: 6 | 12,
  today: Date = new Date(),
): FuelCostPoint[] {
  const totals = new Map<string, number>();
  for (let offset = months - 1; offset >= 0; offset--) {
    const date = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    totals.set(month, 0);
  }
  for (const log of logs) {
    const month = log.date.slice(0, 7);
    if (totals.has(month))
      totals.set(month, totals.get(month)! + (log.cost || 0));
  }
  return [...totals].map(([month, value]) => ({
    month,
    label: new Date(
      Number(month.slice(0, 4)),
      Number(month.slice(5)) - 1,
      1,
    ).toLocaleString("en", { month: "short" }),
    value: Math.round(value * 100) / 100,
  }));
}

export function searchHomeVehicles<
  T extends {
    year: number | null;
    make: string | null;
    model: string | null;
    license_plate: string | null;
  },
>(vehicles: T[], query: string): T[] {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  return vehicles.filter((vehicle) =>
    [vehicle.year, vehicle.make, vehicle.model, vehicle.license_plate].some(
      (value) =>
        String(value || "")
          .toLowerCase()
          .includes(term),
    ),
  );
}
