import React from "react";
import {
  render,
  screen,
  fireEvent,
  fireEventAsync,
  waitFor,
  act,
} from "@testing-library/react-native";
import LogsScreen from "@/app/(tabs)/logs";
import {
  FuelLogService,
  MileageLogService,
  ServiceLogService,
} from "@/lib/services/loggingService";
import { canUserAccessVehicle } from "@/lib/utils/serviceUtils";
import { VehicleService } from "@/lib/services/vehicleService";
import { router } from "expo-router";
import { RefreshControl, StyleSheet, TouchableOpacity } from "react-native";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (factory: any) => factory,
  useStyles: (factory?: any) => {
    const { lightTheme } = require("@/src/design-system");
    return { theme: lightTheme, styles: factory ? factory(lightTheme) : {} };
  },
}));

jest.mock("@/lib/services/vehicleService", () => ({
  VehicleService: { getVehiclesSeparated: jest.fn() },
}));
jest.mock("@/components/ui/Modal", () => ({
  Modal: ({ visible, children }: any) => (visible ? <>{children}</> : null),
}));
const mockVehicles = [
  {
    id: "civic",
    year: 2022,
    make: "Honda",
    model: "Civic",
    license_plate: "WNA1234",
    is_own_vehicle: false,
  },
  {
    id: "myvi",
    year: 2020,
    make: "Perodua",
    model: "Myvi",
    license_plate: "PQR1010",
    is_own_vehicle: true,
  },
];
const mockLayout = { isWeb: true, isMobile: false, isDesktop: true };
let mockServiceLogs: any[] = [];
let mockUserId = "wan";
let mockActionItems: any[] = [];
const mockFocusCallbacks = new Set<() => () => void>();
const mockFocus = () => {
  const cleanups = [...mockFocusCallbacks].map((callback) => callback());
  return () => cleanups.forEach((cleanup) => cleanup?.());
};
const mockConfirm = jest.fn();
const mockShowError = jest.fn();
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
    require("react").useEffect(() => {
      mockFocusCallbacks.add(callback);
      const cleanup = callback();
      return () => {
        mockFocusCallbacks.delete(callback);
        cleanup?.();
      };
    }, [callback]),
}));
jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: mockUserId } }),
}));
jest.mock("@/lib/contexts/DialogContext", () => ({
  useDialog: () => ({ confirm: mockConfirm }),
}));
jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    showSuccess: jest.fn(),
    showError: mockShowError,
    showWarning: jest.fn(),
  }),
}));
jest.mock("@/lib/utils/serviceUtils", () => ({
  canUserAccessVehicle: jest.fn(async () => true),
}));
jest.mock("@/components/logs", () => ({ LogDetailsBottomSheet: () => null }));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
jest.mock("@/components/ui/ReceiptViewer", () => ({
  ServiceReceiptIndicator: () => null,
}));
jest.mock("@/components/ui/ActionMenu", () => ({
  ActionMenu: ({ items, label }: any) => {
    mockActionItems = items;
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
  ServiceLogService: {
    getServiceLogs: jest.fn(async () => ({ data: mockServiceLogs })),
    deleteServiceLog: jest.fn(async () => ({ data: true, error: null })),
  },
  isAutoMileageLog: (type: string, log: any) =>
    type === "mileage" && log.source === "fuel_log",
}));

beforeEach(() => {
  (VehicleService.getVehiclesSeparated as jest.Mock).mockResolvedValue({
    data: { ownVehicles: [mockVehicles[1]], sharedVehicles: [mockVehicles[0]] },
  });
  mockLayout.isWeb = true;
  mockLayout.isMobile = false;
  jest.clearAllMocks();
  mockServiceLogs = [];
  mockUserId = "wan";
  mockConfirm.mockResolvedValue(false);
  (canUserAccessVehicle as jest.Mock).mockResolvedValue(true);
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

it("offers compact sorting and a labelled Add action on the native page", async () => {
  mockLayout.isWeb = false;
  render(<LogsScreen />);
  await screen.findByText("2022 Honda Civic");
  expect(screen.getByText("Sort by date (newest)")).toBeTruthy();
  expect(screen.getByText("Logs")).toBeTruthy();
  expect(screen.getByText("Add mileage log")).toBeTruthy();
});

it.each([false, true])(
  "uses wrapping accessible compact tabs on web=%s",
  async (isWeb) => {
    mockLayout.isWeb = isWeb;
    mockLayout.isMobile = true;
    render(<LogsScreen />);
    await screen.findByText("2022 Honda Civic");
    const tab = screen.getByRole("button", { name: "Fuel" });
    expect(
      StyleSheet.flatten(tab.props.style).minHeight,
    ).toBeGreaterThanOrEqual(48);
    fireEvent.press(tab);
    expect(
      screen.getByRole("button", { name: "Fuel", selected: true }),
    ).toBeTruthy();
    fireEvent.press(screen.getByText("Add fuel log"));
    expect(router.push).toHaveBeenCalledWith("/logs/fuel/add");
  },
);

it.each([false, true])(
  "starts vehicle groups closed and preserves manual collapse on web=%s",
  async (isWeb) => {
    mockLayout.isWeb = isWeb;
    mockLayout.isMobile = true;
    render(<LogsScreen />);
    const header = await screen.findByRole("button", {
      name: "Expand 2022 Honda Civic logs",
    });
    expect(header.props.accessibilityState.expanded).toBe(false);
    expect(screen.queryByText("4,000 km")).toBeNull();
    fireEvent.press(header);
    expect(screen.getByText("4,000 km")).toBeTruthy();
    expect(screen.queryByText("1,000 km")).toBeNull();
    fireEvent.press(
      screen.getByRole("button", { name: "Collapse 2022 Honda Civic logs" }),
    );
    await act(async () =>
      screen.UNSAFE_getByType(RefreshControl).props.onRefresh(),
    );
    expect(screen.queryByText("4,000 km")).toBeNull();
  },
);

it("searches all vehicles, filters server queries, retains the filter across tabs and preselects Add", async () => {
  mockLayout.isMobile = true;
  render(<LogsScreen />);
  await screen.findByText("2022 Honda Civic");
  fireEvent.press(screen.getByRole("button", { name: "Filter by vehicle" }));
  fireEvent.changeText(
    screen.getByLabelText("Search vehicles by name or plate"),
    "PQR",
  );
  expect(
    screen.queryByRole("button", { name: "Select 2022 Honda Civic, WNA1234" }),
  ).toBeNull();
  fireEvent.press(
    screen.getByRole("button", { name: "Select 2020 Perodua Myvi, PQR1010" }),
  );
  await waitFor(() =>
    expect(MileageLogService.getMileageLogs).toHaveBeenLastCalledWith("myvi", {
      limit: 20,
      offset: 0,
      ascending: false,
    }),
  );
  fireEvent.press(screen.getByRole("button", { name: "Fuel" }));
  expect(FuelLogService.getFuelLogs).toHaveBeenLastCalledWith("myvi", {
    limit: 20,
    offset: 0,
    ascending: false,
  });
  fireEvent.press(screen.getByText("Add fuel log"));
  expect(router.push).toHaveBeenCalledWith({
    pathname: "/logs/fuel/add",
    params: { vehicleId: "myvi", returnTo: "logs" },
  });
  fireEvent.press(screen.getByText("Oldest first"));
  await waitFor(() =>
    expect(FuelLogService.getFuelLogs).toHaveBeenLastCalledWith("myvi", {
      limit: 20,
      offset: 0,
      ascending: true,
    }),
  );
  expect(VehicleService.getVehiclesSeparated).toHaveBeenCalledTimes(1);
});

it("ignores previous-vehicle results when the filter changes", async () => {
  mockLayout.isMobile = true;
  let resolve!: (value: any) => void;
  (MileageLogService.getMileageLogs as jest.Mock).mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  render(<LogsScreen />);
  fireEvent.press(
    await screen.findByRole("button", { name: "Filter by vehicle" }),
  );
  fireEvent.press(
    screen.getByRole("button", { name: "Select 2020 Perodua Myvi, PQR1010" }),
  );
  await waitFor(() =>
    expect(MileageLogService.getMileageLogs).toHaveBeenLastCalledWith(
      "myvi",
      expect.anything(),
    ),
  );
  await act(async () =>
    resolve({
      data: [
        {
          ...mockLogs[0],
          vehicles: { ...mockLogs[0].vehicles, model: "Old result" },
        },
      ],
    }),
  );
  expect(screen.queryByText("2022 Honda Old result")).toBeNull();
});

it("keeps all ten groups closed, including after loading another page", async () => {
  mockLayout.isMobile = true;
  const rows = Array.from({ length: 20 }, (_, i) => ({
    ...mockLogs[0],
    id: `many-${i}`,
    vehicle_id: `car-${Math.floor(i / 2)}`,
    vehicles: { ...mockLogs[0].vehicles, model: `Car ${Math.floor(i / 2)}` },
  }));
  (MileageLogService.getMileageLogs as jest.Mock).mockResolvedValueOnce({
    data: rows,
  });
  render(<LogsScreen />);
  await screen.findByText("Load More Logs");
  expect(
    screen.getAllByRole("button", { name: /^Expand 2022 Honda Car/ }),
  ).toHaveLength(10);
  expect(screen.queryByText("1,000 km")).toBeNull();
  fireEvent.press(screen.getByText("Load More Logs"));
  await screen.findByRole("button", { name: "Expand 2022 Honda Civic logs" });
  expect(screen.queryByText("4,000 km")).toBeNull();
});

it("retries vehicle loading and shows no search matches without hiding All vehicles", async () => {
  mockLayout.isMobile = true;
  (VehicleService.getVehiclesSeparated as jest.Mock).mockRejectedValueOnce(
    new Error("offline"),
  );
  render(<LogsScreen />);
  await fireEventAsync.press(await screen.findByText("Retry vehicles"));
  expect(VehicleService.getVehiclesSeparated).toHaveBeenCalledTimes(2);
  expect(screen.queryByText("Retry vehicles")).toBeNull();
  fireEvent.press(screen.getByRole("button", { name: "Filter by vehicle" }));
  fireEvent.changeText(
    screen.getByLabelText("Search vehicles by name or plate"),
    "no-match",
  );
  expect(screen.getByText("No vehicles match your search")).toBeTruthy();
  fireEvent.press(screen.getByRole("button", { name: "Select all vehicles" }));
  expect(screen.queryByText("Choose vehicle")).toBeNull();
});

it("shows a single vehicle directly and preselects it when adding a log", async () => {
  mockLayout.isMobile = true;
  (VehicleService.getVehiclesSeparated as jest.Mock).mockResolvedValue({
    data: { ownVehicles: [], sharedVehicles: [mockVehicles[0]] },
  });
  render(<LogsScreen />);
  await screen.findByText("2022 Honda Civic · WNA1234");
  expect(
    screen.queryByRole("button", { name: "Filter by vehicle" }),
  ).toBeNull();
  fireEvent.press(screen.getByText("Add mileage log"));
  expect(router.push).toHaveBeenCalledWith({
    pathname: "/logs/mileage/add",
    params: { vehicleId: "civic", returnTo: "logs" },
  });
});

it("clears an inaccessible selection on focus and returns to All vehicles", async () => {
  mockLayout.isMobile = true;
  render(<LogsScreen />);
  fireEvent.press(
    await screen.findByRole("button", { name: "Filter by vehicle" }),
  );
  fireEvent.press(
    screen.getByRole("button", { name: "Select 2020 Perodua Myvi, PQR1010" }),
  );
  await waitFor(() =>
    expect(MileageLogService.getMileageLogs).toHaveBeenLastCalledWith(
      "myvi",
      expect.anything(),
    ),
  );
  (VehicleService.getVehiclesSeparated as jest.Mock).mockResolvedValue({
    data: { ownVehicles: [], sharedVehicles: [mockVehicles[0]] },
  });
  await act(async () => {
    mockFocus();
  });
  await waitFor(() =>
    expect(MileageLogService.getMileageLogs).toHaveBeenLastCalledWith(
      undefined,
      expect.anything(),
    ),
  );
  expect(screen.queryByText("2020 Perodua Myvi · PQR1010")).toBeNull();
});

it("offers Retry after a failed initial request instead of an empty list", async () => {
  (MileageLogService.getMileageLogs as jest.Mock).mockRejectedValueOnce(
    new Error("Offline"),
  );
  render(<LogsScreen />);
  await screen.findByText("Couldn't load mileage logs");
  expect(screen.queryByText("No mileage logs yet")).toBeNull();
  fireEvent.press(screen.getByText("Retry"));
  await screen.findByText("4,000 km");
});

it("keeps cached rows after a failed refresh", async () => {
  render(<LogsScreen />);
  await screen.findByText("4,000 km");
  (MileageLogService.getMileageLogs as jest.Mock).mockResolvedValueOnce({
    data: null,
    error: "Offline",
  });
  await act(async () =>
    screen.UNSAFE_getByType(RefreshControl).props.onRefresh(),
  );
  expect(screen.getByText("4,000 km")).toBeTruthy();
  expect(screen.getByText("Couldn't load mileage logs")).toBeTruthy();
  expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(false);
});

it("ignores an old pagination response after refresh", async () => {
  const rows = Array.from({ length: 20 }, (_, i) => ({
    ...mockLogs[3],
    id: `page-${i}`,
  }));
  (MileageLogService.getMileageLogs as jest.Mock).mockResolvedValueOnce({
    data: rows,
  });
  render(<LogsScreen />);
  await screen.findByText("Load More Logs");
  let resolve!: (value: any) => void;
  (MileageLogService.getMileageLogs as jest.Mock).mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  fireEvent.press(screen.getByText("Load More Logs"));
  await act(async () =>
    screen.UNSAFE_getByType(RefreshControl).props.onRefresh(),
  );
  await act(async () =>
    resolve({
      data: [{ ...mockLogs[0], id: "stale", odometer_reading: 999999 }],
    }),
  );
  expect(screen.getByText("See 1 more log")).toBeTruthy();
  fireEvent.press(screen.getByText("See 1 more log"));
  expect(screen.queryByText("999,999 km")).toBeNull();
});

it("retains the pagination offset and offers another attempt after a page error", async () => {
  const rows = Array.from({ length: 20 }, (_, i) => ({
    ...mockLogs[3],
    id: `page-${i}`,
  }));
  const load = MileageLogService.getMileageLogs as jest.Mock;
  load.mockResolvedValueOnce({ data: rows });
  render(<LogsScreen />);
  await screen.findByText("Load More Logs");
  load.mockResolvedValueOnce({ data: null, error: "Offline" });
  fireEvent.press(screen.getByText("Load More Logs"));
  await waitFor(() => expect(mockShowError).toHaveBeenCalled());
  expect(screen.getByText("Load More Logs")).toBeEnabled();
  load.mockResolvedValueOnce({ data: [{ ...mockLogs[0], id: "next" }] });
  fireEvent.press(screen.getByText("Load More Logs"));
  await waitFor(() =>
    expect(load).toHaveBeenLastCalledWith(undefined, {
      limit: 20,
      offset: 20,
      ascending: false,
    }),
  );
  await waitFor(() => expect(screen.queryByText("Load More Logs")).toBeNull());
});

it("blocks old pagination offsets while cached rows refresh on focus", async () => {
  const rows = Array.from({ length: 20 }, (_, i) => ({
    ...mockLogs[3],
    id: `page-${i}`,
  }));
  const load = MileageLogService.getMileageLogs as jest.Mock;
  load.mockResolvedValueOnce({ data: rows });
  render(<LogsScreen />);
  await screen.findByText("Load More Logs");
  load.mockResolvedValueOnce({
    data: rows.map((row) => ({ ...row, id: `next-${row.id}` })),
  });
  fireEvent.press(screen.getByText("Load More Logs"));
  await screen.findByText("See 37 more logs");
  let resolve!: (value: any) => void;
  load.mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  act(() => {
    mockFocus();
  });
  const count = load.mock.calls.length;
  // Exercise the handler too, so a rapid press cannot bypass disabled UI.
  await act(async () =>
    screen
      .UNSAFE_getAllByType(TouchableOpacity)
      .find((node: any) => node.props.accessibilityLabel === "Load More Logs")!
      .props.onPress(),
  );
  const afterPress = load.mock.calls.length;
  await act(async () => resolve({ data: rows }));
  expect(afterPress).toBe(count);
  load.mockResolvedValueOnce({ data: [] });
  fireEvent.press(screen.getByText("Load More Logs"));
  await waitFor(() =>
    expect(load).toHaveBeenLastCalledWith(undefined, {
      limit: 20,
      offset: 20,
      ascending: false,
    }),
  );
});

function serviceLog(ownerId?: string) {
  return {
    id: "service-1",
    vehicle_id: "civic",
    date: "2026-10-01",
    service_type: "oil_change",
    description: "Oil",
    cost: 100,
    vehicles: { ...mockLogs[0].vehicles, user_id: ownerId },
  };
}
it.each([
  ["wan", true],
  ["other", false],
  [undefined, false],
] as const)(
  "allows Service Delete only for the owner: %s",
  async (ownerId, allowed) => {
    mockServiceLogs = [serviceLog(ownerId)];
    render(<LogsScreen />);
    await screen.findByText("4,000 km");
    fireEvent.press(screen.getByText("Service"));
    await waitFor(() => expect(screen.getByText("Edit")).toBeEnabled());
    if (allowed) expect(screen.getByText("Delete")).toBeEnabled();
    else expect(screen.getByText("Delete")).toBeDisabled();
    fireEvent.press(screen.getByText("Delete"));
    expect(ServiceLogService.deleteServiceLog).not.toHaveBeenCalled();
  },
);
it("keeps actions disabled until access resolves and after access denial", async () => {
  let resolve!: (value: boolean) => void;
  const pending = new Promise<boolean>((r) => {
    resolve = r;
  });
  (canUserAccessVehicle as jest.Mock).mockReturnValue(pending);
  mockServiceLogs = [serviceLog("wan")];
  render(<LogsScreen />);
  await screen.findByText("4,000 km");
  fireEvent.press(screen.getByText("Service"));
  await screen.findByText("Oil Change");
  expect(screen.getByText("Edit")).toBeDisabled();
  expect(screen.getByText("Delete")).toBeDisabled();
  await act(async () => resolve(false));
  expect(screen.getByText("Edit")).toBeDisabled();
  expect(screen.getByText("Delete")).toBeDisabled();
});

it("guards forbidden Service Delete callbacks as well as their controls", async () => {
  mockServiceLogs = [serviceLog("other")];
  render(<LogsScreen />);
  await screen.findByText("4,000 km");
  fireEvent.press(screen.getByText("Service"));
  await waitFor(() => expect(screen.getByText("Edit")).toBeEnabled());
  await act(async () =>
    mockActionItems.find((item) => item.label === "Delete").onPress(),
  );
  expect(mockConfirm).not.toHaveBeenCalled();
  expect(ServiceLogService.deleteServiceLog).not.toHaveBeenCalled();
});
it("still lets the owner confirm and delete a Service log", async () => {
  mockServiceLogs = [serviceLog("wan")];
  mockConfirm.mockResolvedValue(true);
  render(<LogsScreen />);
  await screen.findByText("4,000 km");
  fireEvent.press(screen.getByText("Service"));
  await waitFor(() => expect(screen.getByText("Delete")).toBeEnabled());
  fireEvent.press(screen.getByText("Delete"));
  await waitFor(() =>
    expect(ServiceLogService.deleteServiceLog).toHaveBeenCalledWith(
      "service-1",
    ),
  );
});
it("ignores a late permission result after the signed-in identity changes", async () => {
  let resolveOld!: (allowed: boolean) => void;
  const pending = new Promise<boolean>((resolve) => {
    resolveOld = resolve;
  });
  let oldUser = true;
  (canUserAccessVehicle as jest.Mock).mockImplementation(() =>
    oldUser ? pending : Promise.resolve(false),
  );
  mockServiceLogs = [serviceLog("wan")];
  const view = render(<LogsScreen />);
  await screen.findByText("4,000 km");
  fireEvent.press(screen.getByText("Service"));
  await screen.findByText("Oil Change");
  oldUser = false;
  mockUserId = "different-user";
  view.rerender(<LogsScreen />);
  await act(async () => resolveOld(true));
  expect(screen.getByText("Edit")).toBeDisabled();
  expect(screen.getByText("Delete")).toBeDisabled();
});
