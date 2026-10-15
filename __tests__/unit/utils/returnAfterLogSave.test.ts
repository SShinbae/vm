import { router } from "expo-router";
import { returnAfterLogSave } from "@/lib/utils/returnAfterLogSave";
jest.mock("expo-router", () => ({ router: { dismissTo: jest.fn() } }));
beforeEach(() => jest.clearAllMocks());
test("returns to the Vehicles list when that origin was supplied", () => {
  returnAfterLogSave("car", "vehicles");
  expect(router.dismissTo).toHaveBeenCalledWith("/(tabs)/vehicles");
});
test("returns to the individual vehicle for a vehicle-detail origin", () => {
  returnAfterLogSave("car");
  expect(router.dismissTo).toHaveBeenCalledWith({
    pathname: "/vehicles/[id]",
    params: { id: "car" },
  });
});
test("returns to Logs when no vehicle context was supplied", () => {
  returnAfterLogSave();
  expect(router.dismissTo).toHaveBeenCalledWith("/(tabs)/logs");
});
test("does not treat an arbitrary return value as a route", () => {
  returnAfterLogSave(undefined, "https://example.com");
  expect(router.dismissTo).toHaveBeenCalledWith("/(tabs)/logs");
});
