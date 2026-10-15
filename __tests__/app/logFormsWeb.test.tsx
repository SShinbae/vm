import React from "react";
import { Platform } from "react-native";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import AddMileage from "@/app/logs/mileage/add";
import AddFuel from "@/app/logs/fuel/add";
import AddService from "@/app/logs/service/add";
import EditMileage from "@/app/logs/mileage/[id]/edit";
import EditFuel from "@/app/logs/fuel/[id]/edit";
import EditService from "@/app/logs/service/[id]/edit";
import ServiceDetail from "@/app/logs/service/[id]";
import { VehicleService } from "@/lib/services/vehicleService";
import {
  MileageLogService,
  FuelLogService,
  ServiceLogService,
} from "@/lib/services/loggingService";
import { router } from "expo-router";

let mockParams: { id: string; vehicleId?: string; returnTo?: string } = {
  id: "old",
};
let mockMobile = false;
let mockUserId = "owner";
const mockConfirm = jest.fn().mockResolvedValue(false);
jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    dismissTo: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
  },
  useNavigation: () => ({ canGoBack: jest.fn(() => false) }),
  useLocalSearchParams: () => mockParams,
  useFocusEffect: (callback: any) =>
    require("react").useEffect(callback, [callback]),
  Link: ({ href, children, ...props }: any) => {
    const { Text } = require("react-native");
    return (
      <Text
        {...props}
        accessibilityRole="link"
        onPress={() => require("expo-router").router.push(href)}
      >
        {children}
      </Text>
    );
  },
}));
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => ({ isWeb: true, isMobile: mockMobile }),
}));
jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}));
jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: mockUserId } }),
}));
jest.mock("@/lib/contexts/DialogContext", () => ({
  useDialog: () => ({ confirm: mockConfirm }),
}));
jest.mock("@/hooks/useToast", () => ({
  toast: { error: jest.fn() },
  useToast: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showWarning: jest.fn(),
  }),
}));
jest.mock("posthog-react-native", () => ({ usePostHog: () => null }));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: require("react-native").View,
}));
jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (factory: any) => factory,
  useStyles: (factory?: any) => {
    const theme = require("@/src/design-system").lightTheme;
    return { theme, styles: factory ? factory(theme) : {} };
  },
}));
jest.mock("@/components/ui/DatePicker", () => ({ DatePicker: () => null }));
jest.mock("@/components/ui/ReceiptCapture", () => ({
  ReceiptCapture: () => null,
  OCRResultDisplay: () => null,
}));
jest.mock("@/lib/services/ocrService", () => ({ OCRService: {} }));
jest.mock("@/components/ui/ReceiptViewer", () => ({
  ReceiptViewer: ({ receiptImageUrl }: any) => {
    const { Text } = require("react-native");
    return <Text>Receipt: {receiptImageUrl}</Text>;
  },
}));
jest.mock("@/components/ui/Skeleton", () => ({
  SkeletonMileageLogForm: () => null,
  SkeletonFuelLogForm: () => null,
  SkeletonServiceLogForm: () => null,
  SkeletonMileageLogEdit: () => null,
  SkeletonFuelLogEdit: () => null,
  SkeletonServiceLogEdit: () => null,
  SkeletonCard: () => null,
}));
jest.mock("@/components/ui/ActionMenu", () => ({
  ActionMenu: ({ items }: any) => {
    const { Button } = require("react-native");
    return items.map((item: any) => (
      <Button
        key={item.label}
        title={item.label}
        disabled={item.disabled}
        onPress={item.onPress}
      />
    ));
  },
}));
jest.mock("@/lib/services/vehicleService", () => ({
  VehicleService: { getVehiclesSeparated: jest.fn() },
}));
jest.mock("@/lib/services/loggingService", () => ({
  MileageLogService: {
    getMileageLogById: jest.fn(),
    createMileageLog: jest.fn(),
    updateMileageLog: jest.fn(),
    deleteMileageLog: jest.fn(),
  },
  FuelLogService: {
    getFuelLogById: jest.fn(),
    createFuelLog: jest.fn(),
    updateFuelLog: jest.fn(),
    deleteFuelLog: jest.fn(),
  },
  ServiceLogService: {
    getServiceLogById: jest.fn(),
    createServiceLog: jest.fn(),
    updateServiceLog: jest.fn(),
    deleteServiceLog: jest.fn(),
  },
}));
const civic = {
  id: "car",
  make: "Honda",
  model: "Civic",
  year: 2022,
  license_plate: "WNA1234",
  user_id: "owner",
  current_mileage: 31000,
  is_own_vehicle: true,
};
const vios = { ...civic, id: "vios", make: "Toyota", model: "Vios" };
const log = {
  id: "old",
  vehicle_id: "car",
  vehicles: civic,
  source: "manual",
  odometer_reading: 31000,
  date: "2026-10-01",
  notes: "Original",
  cost: 100,
  liters_filled: 50,
  fuel_price: 2,
  location: "Shell",
  service_type: "oil_change",
  description: '[{"description":"Oil","price":100}]',
  receipt_image_url: "receipt.jpg",
};
beforeEach(() => {
  Object.defineProperty(Platform, "OS", { value: "web", configurable: true });
  jest.clearAllMocks();
  (router.canGoBack as jest.Mock).mockReturnValue(false);
  mockParams = { id: "old" };
  mockMobile = false;
  mockUserId = "owner";
  (VehicleService.getVehiclesSeparated as jest.Mock).mockResolvedValue({
    data: { ownVehicles: [civic, vios], sharedVehicles: [] },
    error: null,
  });
  for (const load of [
    MileageLogService.getMileageLogById,
    FuelLogService.getFuelLogById,
    ServiceLogService.getServiceLogById,
  ])
    (load as jest.Mock).mockResolvedValue({ data: log, error: null });
  for (const save of [
    MileageLogService.createMileageLog,
    FuelLogService.createFuelLog,
    ServiceLogService.createServiceLog,
    MileageLogService.updateMileageLog,
    FuelLogService.updateFuelLog,
    ServiceLogService.updateServiceLog,
  ])
    (save as jest.Mock).mockResolvedValue({ data: {}, error: null });
});

test.each([
  [AddMileage, "Add Mileage Log"],
  [AddFuel, "Add Fuel Log"],
  [AddService, "Add Service Log"],
] as const)(
  "Add page uses selected vehicle and explicit Cancel: %#",
  async (Page, title) => {
    render(<Page />);
    await waitFor(() =>
      expect(screen.getAllByText("2022 Honda Civic").length).toBeGreaterThan(0),
    );
    expect(screen.getByText(title).props["aria-current"]).toBe("page");
    fireEvent.press(screen.getByText("Cancel"));
    expect(router.replace).toHaveBeenCalledWith("/logs");
  },
);
test.each([
  [EditMileage, "Edit Mileage Log", MileageLogService.getMileageLogById],
  [EditFuel, "Edit Fuel Log", FuelLogService.getFuelLogById],
  [EditService, "Edit Service Log", ServiceLogService.getServiceLogById],
  [ServiceDetail, "Service Details", ServiceLogService.getServiceLogById],
] as const)(
  "direct edit/detail loads the requested record: %#",
  async (Page, title, load) => {
    render(<Page />);
    await waitFor(() =>
      expect(screen.getAllByText("2022 Honda Civic").length).toBeGreaterThan(0),
    );
    expect(load).toHaveBeenCalledWith("old");
    expect(screen.getByText(title).props["aria-current"]).toBe("page");
  },
);
test("Mileage saves existing field values and automatic mileage cannot be saved/deleted", async () => {
  const view = render(<EditMileage />);
  await waitFor(() => expect(screen.getByText("Update Log")).toBeEnabled());
  fireEvent.press(screen.getByText("Update Log"));
  await waitFor(() =>
    expect(MileageLogService.updateMileageLog).toHaveBeenCalledWith("old", {
      odometer_reading: 31000,
      date: "2026-10-01",
      notes: "Original",
    }),
  );
  expect(router.push).toHaveBeenCalledWith("/(tabs)/logs");
  view.unmount();
  (MileageLogService.getMileageLogById as jest.Mock).mockResolvedValue({
    data: { ...log, source: "fuel_log" },
    error: null,
  });
  render(<EditMileage />);
  await screen.findByText(/created from fuel logs/);
  expect(screen.getByText("Update Log")).toBeDisabled();
  expect(screen.getByText("Delete")).toBeDisabled();
});
test("Fuel keeps its calculations and save route", async () => {
  render(<EditFuel />);
  await waitFor(() => expect(screen.getByText("Save Changes")).toBeEnabled());
  fireEvent.changeText(screen.getByDisplayValue("100"), "120");
  fireEvent.press(screen.getByText("Save Changes"));
  await waitFor(() =>
    expect(FuelLogService.updateFuelLog).toHaveBeenCalledWith(
      "old",
      expect.objectContaining({ cost: 120, liters_filled: 60, fuel_price: 2 }),
    ),
  );
  expect(router.push).toHaveBeenCalledWith("/(tabs)/logs");
});
test("Service edit retains receipt and returns Cancel to Service Details", async () => {
  render(<EditService />);
  await screen.findByText("Receipt: receipt.jpg");
  fireEvent.press(screen.getByText("Cancel"));
  expect(router.replace).toHaveBeenCalledWith({
    pathname: "/logs/service/[id]",
    params: { id: "old" },
  });
});
test("Service member cannot delete and errors retain retry navigation", async () => {
  mockUserId = "member";
  const view = render(<ServiceDetail />);
  await waitFor(() =>
    expect(screen.getByText("Edit Service Log")).toBeEnabled(),
  );
  expect(screen.getByText("Delete")).toBeDisabled();
  view.unmount();
  (FuelLogService.getFuelLogById as jest.Mock).mockResolvedValueOnce({
    data: null,
    error: "Access denied",
  });
  render(<EditFuel />);
  await screen.findByText("Access denied");
  expect(screen.queryByText("Save Changes")).toBeNull();
  fireEvent.press(screen.getByText("Retry"));
  await screen.findByText("Save Changes");
});
test("Add page distinguishes failed loading from an empty garage", async () => {
  (VehicleService.getVehiclesSeparated as jest.Mock).mockResolvedValueOnce({
    data: null,
    error: "Offline",
  });
  render(<AddMileage />);
  await screen.findByText("Offline");
  expect(screen.queryByText(/No vehicles found/)).toBeNull();
  fireEvent.press(screen.getByText("Retry"));
  await screen.findByText("Save Log");
});

test.each([
  AddMileage,
  AddFuel,
  AddService,
  EditMileage,
  EditFuel,
  EditService,
])("Cancel uses history when opened from another page: %#", async (Page) => {
  (router.canGoBack as jest.Mock).mockReturnValue(true);
  render(<Page />);
  await screen.findByText("Cancel");
  fireEvent.press(screen.getByText("Cancel"));
  expect(router.back).toHaveBeenCalledTimes(1);
  expect(router.replace).not.toHaveBeenCalled();
});

test("Add breadcrumb follows a different selected vehicle", async () => {
  render(<AddFuel />);
  await screen.findByText("2022 Toyota");
  fireEvent.press(screen.getByText("2022 Toyota"));
  const link = screen
    .getAllByText("2022 Toyota Vios")
    .find((node) => node.props.accessibilityRole === "link")!;
  fireEvent.press(link);
  expect(router.push).toHaveBeenCalledWith({
    pathname: "/vehicles/[id]",
    params: { id: "vios" },
  });
});

test("Service saves item totals and leaves the existing receipt unchanged", async () => {
  render(<EditService />);
  await waitFor(() => expect(screen.getByText("Save Changes")).toBeEnabled());
  fireEvent.press(screen.getByText("Save Changes"));
  await waitFor(() =>
    expect(ServiceLogService.updateServiceLog).toHaveBeenCalledWith(
      "old",
      expect.objectContaining({
        cost: 100,
        description: '[{"description":"Oil","price":100}]',
      }),
    ),
  );
  const updates = (ServiceLogService.updateServiceLog as jest.Mock).mock
    .calls[0][1];
  expect(updates).not.toHaveProperty("receipt_image_url");
  expect(router.push).toHaveBeenCalledWith("/(tabs)/logs");
});

test("native forms keep their original header and history navigation", async () => {
  mockMobile = true;
  Object.defineProperty(Platform, "OS", { value: "ios", configurable: true });
  (router.canGoBack as jest.Mock).mockReturnValue(true);
  render(<EditMileage />);
  await screen.findByText("Update Log");
  expect(screen.queryAllByRole("link")).toHaveLength(0);
  expect(screen.getByText("Edit Mileage Log")).toBeTruthy();
  fireEvent.press(screen.getByText("Cancel"));
  expect(router.back).toHaveBeenCalled();
});

const addCases = [
  ["Fuel", AddFuel, FuelLogService.createFuelLog],
  ["Mileage", AddMileage, MileageLogService.createMileageLog],
  ["Service", AddService, ServiceLogService.createServiceLog],
] as const;
function fillAddForm(kind: string) {
  fireEvent.changeText(screen.getByPlaceholderText("150,000"), "32000");
  if (kind === "Fuel")
    fireEvent.changeText(screen.getByPlaceholderText("65.00"), "100");
  if (kind === "Service") {
    fireEvent.changeText(
      screen.getByPlaceholderText("Service description..."),
      "Oil change",
    );
    fireEvent.changeText(screen.getByPlaceholderText("0.00"), "100");
  }
}
for (const [kind, Page, save] of addCases) {
  test.each(["vehicles", "vehicle", "logs"])(
    `${kind} save returns to its %s origin`,
    async (origin) => {
      mockParams =
        origin === "logs"
          ? { id: "old" }
          : {
              id: "old",
              vehicleId: "car",
              ...(origin === "vehicles" ? { returnTo: "vehicles" } : {}),
            };
      render(<Page />);
      await screen.findByText("Save Log");
      fillAddForm(kind);
      fireEvent.press(screen.getByText("Save Log"));
      const destination =
        origin === "vehicles"
          ? "/(tabs)/vehicles"
          : origin === "vehicle"
            ? { pathname: "/vehicles/[id]", params: { id: "car" } }
            : "/(tabs)/logs";
      await waitFor(() =>
        expect(router.dismissTo).toHaveBeenCalledWith(destination),
      );
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({ vehicle_id: "car" }),
      );
      expect(router.push).not.toHaveBeenCalled();
      expect(router.replace).not.toHaveBeenCalled();
    },
  );
  test(`${kind} failed save stays on the form`, async () => {
    mockParams = { id: "old", vehicleId: "car", returnTo: "vehicles" };
    (save as jest.Mock).mockResolvedValueOnce({ data: null, error: "Offline" });
    render(<Page />);
    await screen.findByText("Save Log");
    fillAddForm(kind);
    fireEvent.press(screen.getByText("Save Log"));
    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(router.dismissTo).not.toHaveBeenCalled();
    expect(screen.getByText("Save Log")).toBeTruthy();
  });
}
