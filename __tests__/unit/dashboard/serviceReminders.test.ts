import { selectServiceReminders } from "@/lib/dashboard/serviceReminders";

const vehicles = [
  {
    id: "own",
    year: 2020,
    make: "Honda",
    model: "Civic",
    current_mileage: 50000,
  },
  {
    id: "shared",
    year: 2022,
    make: "Toyota",
    model: "Vios",
    current_mileage: 60000,
  },
];

const log = (overrides: Record<string, unknown>) => ({
  id: "log-1",
  vehicle_id: "own",
  service_type: "oil_change",
  date: "2026-09-01",
  created_at: "2026-09-01T10:00:00Z",
  next_service_due: null,
  next_service_mileage: null,
  ...overrides,
});

describe("selectServiceReminders", () => {
  const today = new Date(2026, 9, 13);

  it("includes overdue and 30-day or 1,000-km reminders, including shared vehicles", () => {
    const result = selectServiceReminders(
      [
        log({ id: "overdue", next_service_due: "2026-10-12" }),
        log({
          id: "date-boundary",
          service_type: "brake_service",
          next_service_due: "2026-11-12",
        }),
        log({
          id: "km-boundary",
          vehicle_id: "shared",
          next_service_mileage: 61000,
        }),
        log({
          id: "later",
          service_type: "inspection",
          next_service_due: "2026-11-13",
        }),
      ],
      vehicles,
      today,
    );

    expect(result.map(({ logId, status }) => [logId, status])).toEqual([
      ["overdue", "overdue"],
      ["date-boundary", "due_soon"],
      ["km-boundary", "due_soon"],
    ]);
    expect(result[2].vehicleName).toBe("2022 Toyota Vios");
  });

  it("uses the latest log per vehicle and service type even when it has no next due value", () => {
    const result = selectServiceReminders(
      [
        log({ id: "old", date: "2026-09-01", next_service_due: "2026-10-01" }),
        log({ id: "new", date: "2026-10-02", next_service_due: null }),
        log({
          id: "other-vehicle",
          vehicle_id: "shared",
          next_service_due: "2026-10-20",
        }),
      ],
      vehicles,
      today,
    );

    expect(result.map(({ logId }) => logId)).toEqual(["other-vehicle"]);
  });

  it("ignores inaccessible vehicles and sorts nearest mileage reminders first", () => {
    const result = selectServiceReminders(
      [
        log({ id: "far", next_service_mileage: 50900 }),
        log({
          id: "near",
          service_type: "inspection",
          next_service_mileage: 50100,
        }),
        log({
          id: "inaccessible",
          vehicle_id: "unknown",
          next_service_due: "2026-10-13",
        }),
      ],
      vehicles,
      today,
    );

    expect(result.map(({ logId }) => logId)).toEqual(["near", "far"]);
  });

  it("does not infer mileage urgency when current mileage is unknown", () => {
    const result = selectServiceReminders(
      [log({ next_service_mileage: 800 })],
      [{ ...vehicles[0], current_mileage: null }],
      today,
    );

    expect(result).toEqual([]);
  });
});
