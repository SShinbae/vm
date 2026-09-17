import {
  getPreferences,
  upsertPreferences,
} from "@/lib/services/notificationPreferencesService";

const mockMaybeSingle = jest.fn();
const mockSingle = jest.fn();

jest.mock("@/services/supabaseClient", () => {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    upsert: () => chain,
    maybeSingle: (...args: any[]) => mockMaybeSingle(...args),
    single: (...args: any[]) => mockSingle(...args),
  };
  return { supabase: { from: () => chain } };
});

describe("notificationPreferencesService data access", () => {
  beforeEach(() => {
    mockMaybeSingle.mockReset();
    mockSingle.mockReset();
  });

  it("getPreferences returns the row on success", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { user_id: "u1" }, error: null });
    const res = await getPreferences("u1");
    expect(res.error).toBeNull();
    expect(res.data).toEqual({ user_id: "u1" });
  });

  it("getPreferences surfaces the error message on failure", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { message: "boom" },
    });
    const res = await getPreferences("u1");
    expect(res.data).toBeNull();
    expect(res.error).toBe("boom");
  });

  it("upsertPreferences returns the updated row", async () => {
    mockSingle.mockResolvedValue({
      data: { user_id: "u1", log_updates_enabled: false },
      error: null,
    });
    const res = await upsertPreferences("u1", { log_updates_enabled: false });
    expect(res.error).toBeNull();
    expect(res.data).toMatchObject({
      user_id: "u1",
      log_updates_enabled: false,
    });
  });
});
