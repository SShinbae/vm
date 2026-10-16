import React from "react";
import { Text, Button } from "react-native";
import {
  renderRouter,
  screen,
  fireEvent,
  waitFor,
} from "expo-router/testing-library";
import { Stack, useRouter } from "expo-router";
import AnalyticsLayout from "@/app/(tabs)/analytics/_layout";
import { AnalyticsMobilePage } from "@/components/analytics/AnalyticsMobilePage";
import { usePeriodSelector, useVehicleFilter } from "@/hooks/useAnalytics";

jest.unmock("expo-router");
jest.mock(
  "react-native-safe-area-context",
  () => require("react-native-safe-area-context/jest/mock").default,
);
jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (f: any) => f,
  useStyles: (f?: any) => {
    const { lightTheme } = require("@/src/design-system");
    return { theme: lightTheme, styles: f ? f(lightTheme) : {} };
  },
}));
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => ({ isWeb: false, isMobile: true }),
}));
jest.mock("@react-navigation/material-top-tabs", () => ({
  createMaterialTopTabNavigator: () => ({
    Navigator: () => null,
    Screen: () => null,
  }),
}));
jest.mock("@/app/(tabs)/analytics/index", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/app/(tabs)/analytics/costs", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/app/(tabs)/analytics/fuel", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/app/(tabs)/analytics/service", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/app/(tabs)/analytics/performance", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "one" } }),
}));
jest.mock("@/lib/supabase/analytics-queries", () => ({
  fetchAccessibleVehicles: jest.fn(async () => [
    {
      id: "a",
      make: "Honda",
      model: "Civic",
      year: 2022,
      license_plate: "ABC1",
    },
  ]),
}));
jest.mock("@/hooks/useAnalyticsWorker", () => ({
  useAnalyticsWorker: () => ({ isReady: true }),
}));
jest.mock("@/components/ui/Modal", () => ({
  Modal: ({ children, visible }: any) => (visible ? <>{children}</> : null),
}));

const mockSummaryMount = jest.fn();
function Summary() {
  React.useEffect(() => {
    mockSummaryMount();
  }, []);
  const router = useRouter();
  const { period, periods, setPeriod } = usePeriodSelector();
  const { selectedVehicleIds, toggleVehicle } = useVehicleFilter();
  return (
    <AnalyticsMobilePage
      title="Analytics"
      subtitle="Summary"
      report={false}
      refreshing={false}
      onRefresh={() => {}}
    >
      <Text>{`Selected ${period.label}: ${selectedVehicleIds.join(",")}`}</Text>
      <Button
        title="Change filters"
        onPress={() => {
          setPeriod(periods[0]);
          toggleVehicle("a");
        }}
      />
      <Button
        title="Open fuel"
        onPress={() => router.push("/analytics/fuel")}
      />
    </AnalyticsMobilePage>
  );
}
function FuelReport() {
  const { period } = usePeriodSelector();
  const { selectedVehicleIds } = useVehicleFilter();
  return (
    <AnalyticsMobilePage
      title="Fuel Analytics"
      subtitle="Fuel"
      refreshing={false}
      onRefresh={() => {}}
    >
      <Text>{`Report ${period.label}: ${selectedVehicleIds.join(",")}`}</Text>
    </AnalyticsMobilePage>
  );
}
const routes = {
  _layout: () => <Stack screenOptions={{ headerShown: false }} />,
  "analytics/_layout": AnalyticsLayout,
  "analytics/index": Summary,
  "analytics/fuel": FuelReport,
  "analytics/costs": () => null,
  "analytics/service": () => null,
  "analytics/performance": () => null,
};
afterEach(() => jest.useRealTimers());
it("opens a report and returns with the shared filters preserved", async () => {
  mockSummaryMount.mockClear();
  const result = renderRouter(routes, { initialUrl: "/analytics" });
  await waitFor(() =>
    expect(screen.getByText("Selected 30 Days: ")).toBeTruthy(),
  );
  fireEvent.press(screen.getByText("Change filters"));
  fireEvent.press(screen.getByText("Open fuel"));
  await waitFor(() => expect(result.getPathname()).toBe("/analytics/fuel"));
  expect(screen.getByText("Report 7 Days: a")).toBeTruthy();
  fireEvent.press(screen.getByRole("button", { name: "Back" }));
  await waitFor(() => expect(result.getPathname()).toBe("/analytics"));
  expect(screen.getByText("Selected 7 Days: a")).toBeTruthy();
  expect(mockSummaryMount).toHaveBeenCalledTimes(1);
});
it("opens a report URL directly and falls back to the summary", async () => {
  const result = renderRouter(routes, { initialUrl: "/analytics/fuel" });
  await waitFor(() =>
    expect(screen.getByRole("header", { name: "Fuel Analytics" })).toBeTruthy(),
  );
  fireEvent.press(screen.getByRole("button", { name: "Back" }));
  await waitFor(() => expect(result.getPathname()).toBe("/analytics"));
});
