import { router } from "expo-router";
import { goBack } from "@/lib/utils/goBack";
jest.mock("expo-router", () => ({
  router: { canGoBack: jest.fn(), back: jest.fn(), replace: jest.fn() },
}));
beforeEach(() => jest.clearAllMocks());
test("returns to the previous page rather than forcing the fallback", () => {
  (router.canGoBack as jest.Mock).mockReturnValue(true);
  goBack("/logs");
  expect(router.back).toHaveBeenCalledTimes(1);
  expect(router.replace).not.toHaveBeenCalled();
});
test("uses the supplied destination only when opened without navigation history", () => {
  (router.canGoBack as jest.Mock).mockReturnValue(false);
  const fallback = {
    pathname: "/vehicles/[id]" as const,
    params: { id: "car" },
  };
  goBack(fallback);
  expect(router.back).not.toHaveBeenCalled();
  expect(router.replace).toHaveBeenCalledWith(fallback);
});
