import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useVehicles } from "@/hooks/useVehicles";
import { VehicleService } from "@/lib/services/vehicleService";
let mockBlur: void | (() => void);
jest.mock("@react-navigation/native", () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    const React = require("react");
    React.useEffect(() => {
      mockBlur = callback();
      return mockBlur;
    }, [callback]);
  },
}));
jest.mock("@/lib/services/vehicleService", () => ({
  VehicleService: { getVehiclesSeparated: jest.fn() },
}));
jest.mock("@/hooks/useToast", () => ({ toast: { error: jest.fn() } }));
const success = (id: string) => ({
  data: { ownVehicles: [{ id }], sharedVehicles: [] },
  error: null,
});
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(VehicleService.getVehiclesSeparated).mockReset();
});
it.each(["returned", "thrown"])(
  "releases loading and exposes a %s error with successful retry",
  async (mode) => {
    const method = jest.mocked(VehicleService.getVehiclesSeparated);
    if (mode === "returned")
      method.mockResolvedValueOnce({ data: null, error: "Offline" } as any);
    else method.mockRejectedValueOnce(new Error("Offline"));
    const { result } = renderHook(useVehicles);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Failed to load vehicles");
    method.mockResolvedValueOnce(success("new") as any);
    await act(async () => {
      await result.current.onRefresh();
    });
    expect(result.current.error).toBeNull();
    expect(result.current.allVehicles).toEqual([{ id: "new" }]);
    expect(result.current.refreshing).toBe(false);
  },
);
it("keeps cached vehicles on failed refresh", async () => {
  const method = jest.mocked(VehicleService.getVehiclesSeparated);
  method.mockResolvedValueOnce(success("cached") as any);
  const { result } = renderHook(useVehicles);
  await waitFor(() => expect(result.current.loading).toBe(false));
  method.mockRejectedValueOnce(new Error("Offline"));
  await act(async () => {
    await result.current.onRefresh();
  });
  expect(result.current.allVehicles).toEqual([{ id: "cached" }]);
  expect(result.current.error).toBeTruthy();
  expect(result.current.refreshing).toBe(false);
});
it("ignores older request results", async () => {
  let finish: (result: any) => void = () => {};
  const method = jest.mocked(VehicleService.getVehiclesSeparated);
  method.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const { result } = renderHook(useVehicles);
  method.mockResolvedValueOnce(success("newest") as any);
  await act(async () => {
    await result.current.onRefresh();
  });
  await act(async () => {
    finish(success("old"));
  });
  expect(result.current.allVehicles).toEqual([{ id: "newest" }]);
});
it("ignores requests resolved after blur", async () => {
  let finish: (result: any) => void = () => {};
  jest.mocked(VehicleService.getVehiclesSeparated).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const { result } = renderHook(useVehicles);
  act(() => mockBlur?.());
  await act(async () => {
    finish(success("old"));
  });
  expect(result.current.allVehicles).toEqual([]);
});
