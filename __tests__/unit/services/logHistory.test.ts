import {
  FuelLogService,
  MileageLogService,
  ServiceLogService,
} from "@/lib/services/loggingService";
import { supabase } from "@/services/supabaseClient";
import { canUserAccessVehicle } from "@/lib/utils/serviceUtils";

jest.mock("@/services/supabaseClient", () => ({
  supabase: { auth: { getUser: jest.fn() }, from: jest.fn() },
}));
jest.mock("@/lib/utils/serviceUtils", () => ({
  canUserAccessVehicle: jest.fn(),
}));

const rows = [
  {
    id: "a",
    vehicle_id: "owned",
    date: "2026-10-15",
    vehicles: { user_id: "me" },
  },
  {
    id: "b",
    vehicle_id: "shared",
    date: "2026-10-15",
    vehicles: { user_id: "other" },
  },
  {
    id: "c",
    vehicle_id: "shared",
    date: "2026-10-14",
    vehicles: { user_id: "other" },
  },
  {
    id: "d",
    vehicle_id: "owned",
    date: "2026-10-13",
    vehicles: { user_id: "me" },
  },
  {
    id: "e",
    vehicle_id: "private",
    date: "2026-10-16",
    vehicles: { user_id: "stranger" },
  },
];
let failedTable: string | undefined;
beforeEach(() => {
  jest.clearAllMocks();
  failedTable = undefined;
  (supabase.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: { id: "me" } },
    error: null,
  });
  (canUserAccessVehicle as jest.Mock).mockImplementation(async (id) =>
    ["owned", "shared"].includes(id),
  );
  (supabase.from as jest.Mock).mockImplementation((table: string) => {
    let data: any[] =
      table === "vehicles"
        ? [{ id: "owned", user_id: "me" }]
        : table === "group_members"
          ? [{ group_id: "group", user_id: "me" }]
          : table === "vehicle_group_shares"
            ? [{ vehicle_id: "shared", group_id: "group" }]
            : [...rows];
    const order: { field: string; ascending: boolean }[] = [];
    const value = (row: any, field: string) =>
      field.split(".").reduce((v, part) => v?.[part], row);
    const result = () => ({
      data: failedTable === table ? null : data,
      error: failedTable === table ? { message: "Offline" } : null,
    });
    const query: any = {
      select: jest.fn(() => query),
      eq: jest.fn((field, val) => {
        data = data.filter((row) => value(row, field) === val);
        return query;
      }),
      in: jest.fn((field, vals) => {
        data = data.filter((row) => vals.includes(value(row, field)));
        return query;
      }),
      order: jest.fn((field, options) => {
        order.push({ field, ascending: options.ascending });
        return query;
      }),
      range: jest.fn((start, end) => {
        data.sort((a, b) => {
          for (const item of order) {
            const cmp = String(value(a, item.field)).localeCompare(
              String(value(b, item.field)),
            );
            if (cmp) return item.ascending ? cmp : -cmp;
          }
          return 0;
        });
        data = data.slice(start, end + 1);
        return query;
      }),
      then: (resolve: any, reject: any) =>
        Promise.resolve(result()).then(resolve, reject),
    };
    return query;
  });
});

describe.each([
  ["fuel", FuelLogService.getFuelLogs],
  ["mileage", MileageLogService.getMileageLogs],
  ["service", ServiceLogService.getServiceLogs],
] as const)("%s history", (_name, getLogs) => {
  it("filters shared history at the server without the owner's restriction", async () => {
    const result = await getLogs("shared", { limit: 20 });
    expect(result.error).toBeNull();
    expect(result.data?.map((row) => row.id)).toEqual(["b", "c"]);
    expect((result.data?.[0] as any).is_shared_vehicle).toBe(true);
  });
  it("paginates one stable order across owned and shared vehicles", async () => {
    const first = await getLogs(undefined, { limit: 2, offset: 0 });
    const second = await getLogs(undefined, { limit: 2, offset: 2 });
    expect(first.data?.map((row) => row.id)).toEqual(["b", "a"]);
    expect(second.data?.map((row) => row.id)).toEqual(["c", "d"]);
  });
  it("supports oldest first across the full accessible scope", async () => {
    const result = await getLogs(undefined, { limit: 2, ascending: true });
    expect(result.data?.map((row) => row.id)).toEqual(["d", "c"]);
  });
  it("rejects a selected vehicle without access", async () => {
    const result = await getLogs("private");
    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });
  it("does not silently omit shared history when membership loading fails", async () => {
    failedTable = "group_members";
    const result = await getLogs();
    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });
});
