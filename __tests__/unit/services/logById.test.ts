import {
  MileageLogService,
  ServiceLogService,
} from "@/lib/services/loggingService";
import { canUserAccessVehicle } from "@/lib/utils/serviceUtils";
import { supabase } from "@/services/supabaseClient";
import { createMockQueryBuilder } from "../../setup/supabaseMock";

jest.mock("@/services/supabaseClient", () => ({
  supabase: { auth: { getUser: jest.fn() }, from: jest.fn() },
}));
jest.mock("@/lib/utils/serviceUtils", () => ({
  canUserAccessVehicle: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  (supabase.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: { id: "owner" } },
  });
  (canUserAccessVehicle as jest.Mock).mockResolvedValue(true);
});

for (const [table, load] of [
  ["mileage_logs", (id: string) => MileageLogService.getMileageLogById(id)],
  ["service_logs", (id: string) => ServiceLogService.getServiceLogById(id)],
] as const) {
  test(`${table}: loads an older log by ID without list pagination`, async () => {
    const log = {
      id: "old-log",
      vehicle_id: "car",
      vehicles: { user_id: "owner" },
    };
    const query = createMockQueryBuilder({ singleData: log });
    (supabase.from as jest.Mock).mockReturnValue(query);
    expect((await load("old-log")).data).toEqual(log);
    expect(supabase.from).toHaveBeenCalledWith(table);
    expect(query.eq).toHaveBeenCalledWith("id", "old-log");
    expect(query.range).not.toHaveBeenCalled();
    expect(canUserAccessVehicle).toHaveBeenCalledWith("car", "owner");
  });
  test(`${table}: denies inaccessible logs and unauthenticated requests`, async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      createMockQueryBuilder({
        singleData: { id: "old-log", vehicle_id: "car" },
      }),
    );
    (canUserAccessVehicle as jest.Mock).mockResolvedValue(false);
    expect((await load("old-log")).data).toBeNull();
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
    });
    (supabase.from as jest.Mock).mockClear();
    expect((await load("old-log")).error).toBe("User not authenticated");
    expect(supabase.from).not.toHaveBeenCalled();
  });
}
