import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import LogsScreen from "@/app/(tabs)/logs";
import { MileageLogService } from "@/lib/services/loggingService";
import { router } from "expo-router";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (factory: any) => factory,
  useStyles: (factory?: any) => {
    const { lightTheme } = require("@/src/design-system");
    return { theme: lightTheme, styles: factory ? factory(lightTheme) : {} };
  },
}));

const mockLayout = { isWeb: true, isMobile: false, isDesktop: true };
const mockLogs = [1, 2, 3, 4].map((day) => ({
  id: `log-${day}`,
  vehicle_id: "civic",
  date: `2026-10-0${day}`,
  odometer_reading: day * 1000,
  notes: "Auto-created from fuel log",
  source: "fuel_log",
  is_shared_vehicle: true,
  vehicles: {
    year: 2022,
    make: "Honda",
    model: "Civic",
    license_plate: "WNA1234",
  },
}));
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => mockLayout,
}));
jest.mock("@react-navigation/native", () => ({
  useFocusEffect: (callback: any) =>
    require("react").useEffect(callback, [callback]),
}));
jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "wan" } }),
}));
jest.mock("@/lib/contexts/DialogContext", () => ({
  useDialog: () => ({ confirm: jest.fn() }),
}));
jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showWarning: jest.fn(),
  }),
}));
jest.mock("@/lib/utils/serviceUtils", () => ({
  canUserAccessVehicle: async () => true,
}));
jest.mock("@/components/logs", () => ({ LogDetailsBottomSheet: () => null }));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
jest.mock("@/components/ui/ReceiptViewer", () => ({
  ServiceReceiptIndicator: () => null,
}));
jest.mock("@/components/ui/ActionMenu", () => ({
  ActionMenu: ({ items, label }: any) => {
    const { View, Text, TouchableOpacity } = require("react-native");
    return (
      <View>
        <Text>{label}</Text>
        {items.map((item: any) => (
          <TouchableOpacity
            key={item.label}
            disabled={item.disabled}
            onPress={item.onPress}
          >
            <Text>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  },
}));
jest.mock("@/lib/services/loggingService", () => ({
  MileageLogService: {
    getMileageLogs: jest.fn(async () => ({ data: mockLogs })),
  },
  FuelLogService: { getFuelLogs: jest.fn(async () => ({ data: [] })) },
  ServiceLogService: { getServiceLogs: jest.fn(async () => ({ data: [] })) },
  isAutoMileageLog: (type: string, log: any) =>
    type === "mileage" && log.source === "fuel_log",
}));

beforeEach(() => {
  mockLayout.isWeb = true;
  jest.clearAllMocks();
});

it("shows three recent rows, expands the vehicle history, and preserves auto-log protection", async () => {
  render(<LogsScreen />);
  await screen.findByText("4,000 km");
  expect(screen.queryByText("1,000 km")).toBeNull();
  expect(screen.getByText(/Last log:/)).toBeTruthy();
  expect(
    screen.getAllByText(
      "Created from fuel logs. Edit or delete the fuel log instead.",
    ),
  ).toHaveLength(3);
  fireEvent.press(screen.getByText("See 1 more log"));
  expect(screen.getByText("1,000 km")).toBeTruthy();
  expect(screen.queryByLabelText("Add mileage log")).toBeNull();
  fireEvent.press(screen.getByText("Add mileage log"));
  expect(router.push).toHaveBeenCalledWith("/logs/mileage/add");
});

it("refetches in the selected date order and renders oldest rows first", async () => {
  render(<LogsScreen />);
  await screen.findByText("4,000 km");
  fireEvent.press(screen.getByText("Oldest first"));
  await screen.findByText("1,000 km");
  expect(screen.queryByText("4,000 km")).toBeNull();
  await waitFor(() =>
    expect(MileageLogService.getMileageLogs).toHaveBeenLastCalledWith(
      undefined,
      { limit: 20, offset: 0, ascending: true },
    ),
  );
  expect(screen.getByText("Sort by date (oldest)")).toBeTruthy();
});

it("keeps the web toolbar out of the native page", async () => {
  mockLayout.isWeb = false;
  render(<LogsScreen />);
  await screen.findByText("4,000 km");
  expect(screen.queryByText("Sort by date (newest)")).toBeNull();
  expect(screen.getByLabelText("Add mileage log")).toBeTruthy();
});
