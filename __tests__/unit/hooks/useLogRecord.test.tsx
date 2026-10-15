import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useLogRecord } from "@/hooks/useLogRecord";
let mockUserId = "owner";
let mockMobile = false;
let mockCleanup: (() => void) | undefined;
jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: mockUserId } }),
}));
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => ({ isWeb: true, isMobile: mockMobile }),
}));
jest.mock("@/hooks/useToast", () => ({ toast: { error: jest.fn() } }));
jest.mock("expo-router", () => ({
  router: { back: jest.fn(), replace: jest.fn(), canGoBack: () => false },
  useFocusEffect: (callback: () => () => void) =>
    require("react").useEffect(() => {
      mockCleanup = callback();
      return mockCleanup;
    }, [callback]),
}));
const log = {
  id: "old",
  vehicle_id: "car",
  source: "manual",
  vehicles: { user_id: "owner", make: "Honda", model: "Civic", year: 2022 },
};
beforeEach(() => {
  mockUserId = "owner";
  mockMobile = false;
});
test("keeps actions disabled until loading succeeds and protects automatic mileage", async () => {
  let resolve: any;
  const load = jest.fn(
    () =>
      new Promise<any>((r) => {
        resolve = r;
      }),
  );
  const { result } = renderHook(() => useLogRecord("old", "mileage", load));
  expect(result.current.canModify).toBe(false);
  await act(async () =>
    resolve({ data: { ...log, source: "fuel_log" }, error: null }),
  );
  expect(result.current.record?.id).toBe("old");
  expect(result.current.canModify).toBe(false);
  expect(result.current.readOnly).toBe(true);
});
test("shared members can edit service logs but cannot delete them", async () => {
  mockUserId = "member";
  const load = jest.fn().mockResolvedValue({ data: log, error: null });
  const { result } = renderHook(() => useLogRecord("old", "service", load));
  await waitFor(() => expect(result.current.canModify).toBe(true));
  expect(result.current.canDelete).toBe(false);
});
test("ignores responses after blur and supports retry after failure", async () => {
  const load = jest
    .fn()
    .mockResolvedValueOnce({ data: null, error: "Offline" })
    .mockResolvedValue({ data: log, error: null });
  const { result } = renderHook(() => useLogRecord("old", "fuel", load));
  await waitFor(() => expect(result.current.error).toBe("Offline"));
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.canModify).toBe(true));
  let resolve: any;
  const pending = jest.fn(
    () =>
      new Promise<any>((r) => {
        resolve = r;
      }),
  );
  const late = renderHook(() => useLogRecord("old", "fuel", pending));
  act(() => mockCleanup?.());
  await act(async () => resolve({ data: log, error: null }));
  expect(late.result.current.record).toBeNull();
});
test("clears the previous record when changing IDs", async () => {
  const load = jest
    .fn()
    .mockResolvedValueOnce({ data: log, error: null })
    .mockImplementation(() => new Promise(() => {}));
  const { result, rerender } = renderHook(
    ({ id }: { id: string }) => useLogRecord(id, "fuel", load),
    { initialProps: { id: "old" } },
  );
  await waitFor(() => expect(result.current.record?.id).toBe("old"));
  rerender({ id: "new" });
  expect(result.current.record).toBeNull();
  expect(result.current.canModify).toBe(false);
});

test("keeps the loaded record when resizing across the mobile breakpoint", async () => {
  const load = jest.fn().mockResolvedValue({ data: log, error: null });
  const { result, rerender } = renderHook(() =>
    useLogRecord("old", "fuel", load),
  );
  await waitFor(() => expect(result.current.canModify).toBe(true));
  const saved = result.current.record;
  mockMobile = true;
  rerender({});
  expect(load).toHaveBeenCalledTimes(1);
  expect(result.current.record).toBe(saved);
});
