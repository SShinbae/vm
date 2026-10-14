import {
  MileageLogService,
  FuelLogService,
  ServiceLogService,
} from "@/lib/services/loggingService";

const mockOrder = jest.fn();
jest.mock("@/services/supabaseClient", () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: "wan" } } }) },
    from: (table: string) => {
      const data =
        table === "group_members"
          ? [{ group_id: "group" }]
          : table === "vehicle_group_shares"
            ? [{ vehicle_id: "shared" }]
            : [
                { id: "latest", date: "2026-10-08" },
                { id: "oldest", date: "2026-10-01" },
              ];
      const query: any = {
        select: () => query,
        eq: () => query,
        in: () => query,
        order: (column: string, options: any) => {
          mockOrder(column, options);
          return query;
        },
        range: () => query,
        then: (resolve: any) =>
          Promise.resolve({ data, error: null }).then(resolve),
      };
      return query;
    },
  },
}));
jest.mock("@/lib/utils/serviceUtils", () => ({
  canUserAccessVehicle: jest.fn(),
}));

it.each([
  ["mileage", MileageLogService.getMileageLogs],
  ["fuel", FuelLogService.getFuelLogs],
  ["service", ServiceLogService.getServiceLogs],
])(
  "sorts owned and shared %s logs in both directions",
  async (_name, fetchLogs: any) => {
    mockOrder.mockClear();
    const oldest = await fetchLogs(undefined, { ascending: true });
    expect(oldest.data.map((log: any) => log.id)).toEqual(["oldest", "latest"]);
    expect(mockOrder.mock.calls).toEqual([
      ["date", { ascending: true }],
      ["date", { ascending: true }],
    ]);
    mockOrder.mockClear();
    const newest = await fetchLogs();
    expect(newest.data.map((log: any) => log.id)).toEqual(["latest", "oldest"]);
    expect(mockOrder.mock.calls).toEqual([
      ["date", { ascending: false }],
      ["date", { ascending: false }],
    ]);
  },
);
