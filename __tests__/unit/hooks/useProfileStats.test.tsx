import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useProfileStats } from "@/hooks/useProfileStats";
import { supabase } from "@/services/supabaseClient";
import { createMockQueryBuilder } from "../../setup/supabaseMock";
const mockUser = { id: "owner", profile: { created_at: "2026-01-01" } };
jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));
jest.mock("@/services/supabaseClient", () => ({
  supabase: { from: jest.fn() },
}));
beforeEach(() => {
  mockUser.id = "owner";
});
test("reports failed count requests and supports retry", async () => {
  (supabase.from as jest.Mock).mockImplementation(() =>
    createMockQueryBuilder({ error: { message: "Offline" } }),
  );
  const { result } = renderHook(() => useProfileStats());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error).toBeTruthy();
  (supabase.from as jest.Mock).mockImplementation(() =>
    createMockQueryBuilder({ count: 2 }),
  );
  await act(async () => result.current.refetch());
  expect(result.current.error).toBeNull();
  expect(result.current.stats.totalLogs).toBe(6);
  (supabase.from as jest.Mock).mockImplementation(() =>
    createMockQueryBuilder({ error: { message: "Offline" } }),
  );
  await act(async () => result.current.refetch());
  expect(result.current.error).toBeTruthy();
  expect(result.current.stats.totalLogs).toBe(6);
});
test("ignores a late stats response from the previous account", async () => {
  let resolve!: (value: any) => void;
  let first = true;
  (supabase.from as jest.Mock).mockImplementation((table: string) => {
    const builder = createMockQueryBuilder({
      selectData: table === "groups" ? [{ id: mockUser.id }] : [],
    });
    if (table === "vehicles" && first) {
      first = false;
      const pending = new Promise((r) => {
        resolve = r;
      });
      builder.then = jest.fn((yes: any) => pending.then(yes));
    }
    return builder;
  });
  const { result, rerender } = renderHook(() => useProfileStats());
  mockUser.id = "new";
  rerender({});
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.stats.activeGroups).toBe(1);
  await act(async () => resolve({ data: [], error: null }));
  expect(result.current.stats.activeGroups).toBe(1);
});
test.each([
  ["owned membership overlap", ["a"], ["a", "b"], 2],
  ["duplicate memberships", ["a"], ["a", "b", "b"], 2],
  ["owned without a membership", ["a"], ["b"], 2],
  ["no groups", [], [], 0],
] as const)(
  "counts unique groups: %s",
  async (_, owned, memberships, expected) => {
    (supabase.from as jest.Mock).mockImplementation((table: string) =>
      createMockQueryBuilder({
        selectData:
          table === "groups"
            ? owned.map((id) => ({ id }))
            : table === "group_members"
              ? memberships.map((group_id) => ({ group_id }))
              : [],
        count:
          table === "mileage_logs"
            ? 1
            : table === "fuel_logs"
              ? 2
              : table === "service_logs"
                ? 3
                : undefined,
      }),
    );
    const { result } = renderHook(() => useProfileStats());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats.activeGroups).toBe(expected);
    expect(result.current.stats.totalLogs).toBe(6);
  },
);
