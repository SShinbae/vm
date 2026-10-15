import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import VehicleDetailScreen from "@/app/vehicles/[id]";
import EditVehicleScreen from "@/app/vehicles/[id]/edit";
import { VehicleService } from "@/lib/services/vehicleService";
import { canUserAccessVehicle } from "@/lib/utils/serviceUtils";
import { router } from "expo-router";
import { toast } from "@/hooks/useToast";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

let mockId = "civic";
let mockReturnTo: string | undefined;
let mockFocusCallback: (() => void | (() => void)) | undefined;
let mockFocusCleanup: (() => void) | undefined;
const mockLayout = { isWeb: true, isMobile: false, isTablet: false };
const mockConfirm = jest.fn();

jest.mock("expo-router", () => {
  const React = require("react");
  const { Text } = require("react-native");
  const router = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: () => true,
  };
  return {
    router,
    Link: ({ href, children, ...props }: any) => (
      <Text
        {...props}
        accessibilityRole="link"
        onPress={() => router.push(href)}
      >
        {children}
      </Text>
    ),
    useLocalSearchParams: () => ({ id: mockId, returnTo: mockReturnTo }),
    useFocusEffect: (callback: () => void | (() => void)) => {
      mockFocusCallback = callback;
      React.useEffect(() => {
        const cleanup = callback();
        mockFocusCleanup = typeof cleanup === "function" ? cleanup : undefined;
        return cleanup;
      }, [callback]);
    },
  };
});
jest.mock("expo-router/head", () => () => null);
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => mockLayout,
}));
jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}));
jest.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "owner" } }),
}));
jest.mock("@/lib/contexts/DialogContext", () => ({
  useDialog: () => ({ confirm: mockConfirm }),
}));
jest.mock("@/hooks/useToast", () => ({
  toast: { error: jest.fn() },
  useToast: () => ({ showSuccess: jest.fn(), showError: jest.fn() }),
}));
jest.mock("posthog-react-native", () => ({ usePostHog: () => null }));
jest.mock("@/components/layout/DashboardWebLayout", () => ({
  DashboardWebLayout: ({ children }: any) => children,
}));
jest.mock("@/components/VehicleGroupSelector", () => ({
  VehicleGroupSelector: () => null,
}));
jest.mock("@/components/ui/Modal", () => ({ Modal: () => null }));
jest.mock("@/components/ui/ImageUpload", () => ({ ImageUpload: () => null }));
jest.mock("@/components/ui/YearPicker", () => ({ YearPicker: () => null }));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("@/components/ui/Skeleton", () => ({
  SkeletonVehicleDetail: () => null,
  SkeletonVehicleEdit: () => null,
}));
jest.mock("@/components/ui/PageHeader", () => ({ PageHeader: () => null }));
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
jest.mock("@/lib/services/vehicleService", () => ({
  VehicleService: {
    getVehicleById: jest.fn(),
    deleteVehicle: jest.fn(),
    getVehicleSharingConfig: jest.fn(),
  },
}));
jest.mock("@/lib/utils/serviceUtils", () => ({
  canUserAccessVehicle: jest.fn(),
  formatServiceItems: (description: string) => description,
}));
jest.mock("@/lib/services/loggingService", () => ({
  MileageLogService: { deleteMileageLog: jest.fn() },
  FuelLogService: { deleteFuelLog: jest.fn() },
  ServiceLogService: { deleteServiceLog: jest.fn() },
  isAutoMileageLog: (type: string, log: any) =>
    type === "mileage" && log.source === "fuel_log",
}));
jest.mock("@/components/ui/ActionMenu", () => ({
  ActionMenu: ({ items, disabled }: any) => {
    const { View, Text, TouchableOpacity } = require("react-native");
    return (
      <View>
        {items.map((item: any) => (
          <TouchableOpacity
            key={item.label}
            disabled={disabled || item.disabled}
            onPress={item.onPress}
          >
            <Text>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  },
}));
jest.mock("@/components/ui/ReceiptViewer", () => ({
  ServiceReceiptIndicator: ({ onPress }: any) => {
    const { Text } = require("react-native");
    return <Text onPress={onPress}>Receipt</Text>;
  },
}));

const vehicle = () => ({
  id: "civic",
  user_id: "owner",
  year: 2022,
  make: "Honda",
  model: "Civic",
  license_plate: "WNA1234",
  vin: null,
  created_at: "2026-10-01",
  is_own_vehicle: true,
  current_mileage: 31000,
  mileage_logs: Array.from({ length: 6 }, (_, index) => ({
    id: `mileage-${index + 1}`,
    date: `2026-10-0${index + 1}`,
    odometer_reading: (index + 1) * 1000,
    source: index === 5 ? "fuel_log" : "manual",
  })),
  fuel_logs: [],
  service_logs: [
    {
      id: "service-1",
      date: "2026-10-01",
      service_type: "oil_change",
      description: "Oil and filter",
      cost: 120,
      receipt_image_url: "https://example.test/receipt.jpg",
    },
  ],
  logs: { counts: { mileage_count: 6, fuel_count: 0, service_count: 1 } },
});

beforeEach(() => {
  mockReturnTo = undefined;
  jest.clearAllMocks();
  mockId = "civic";
  mockLayout.isWeb = true;
  mockLayout.isMobile = false;
  mockConfirm.mockResolvedValue(false);
  (canUserAccessVehicle as jest.Mock).mockResolvedValue(true);
  (VehicleService.getVehicleById as jest.Mock).mockResolvedValue({
    data: vehicle(),
    error: null,
  });
});

async function refocus() {
  act(() => mockFocusCleanup?.());
  await act(async () => {
    mockFocusCleanup = mockFocusCallback?.() || undefined;
  });
}

it("keeps the final breadcrumb as current-page text even when given a destination", () => {
  const name = "2022 Honda Civic with a long descriptive vehicle name";
  render(
    <Breadcrumbs
      items={[
        { label: "Vehicles", href: "/vehicles" },
        { label: name, href: "/vehicles/civic" },
      ]}
    />,
  );
  expect(screen.queryByRole("link", { name })).toBeNull();
  expect(screen.getByText(name).props["aria-current"]).toBe("page");
});

it("loads once per focus and retains five-item pagination and auto-log protection", async () => {
  render(<VehicleDetailScreen />);
  await waitFor(() => expect(screen.getByText("6,000 km")).toBeTruthy());
  expect(VehicleService.getVehicleById).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("1,000 km")).toBeNull();
  expect(
    screen.getByText(
      "Created from fuel logs. Edit or delete the fuel log instead.",
    ),
  ).toBeTruthy();
  fireEvent.press(screen.getByLabelText("Next page"));
  expect(screen.getByText("1,000 km")).toBeTruthy();
  await refocus();
  expect(VehicleService.getVehicleById).toHaveBeenCalledTimes(2);
});

it("uses explicit breadcrumb destinations and retains service receipt navigation", async () => {
  render(<VehicleDetailScreen />);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Edit Vehicle" }).props
        .accessibilityState.disabled,
    ).toBe(false),
  );
  fireEvent.press(screen.getByRole("link", { name: "Vehicles" }));
  expect(router.push).toHaveBeenCalledWith("/vehicles");
  fireEvent.press(screen.getByText("Service"));
  fireEvent.press(screen.getByText("Receipt"));
  expect(router.push).toHaveBeenCalledWith("/logs/service/service-1");
});

it("keeps shared vehicles editable after access resolves and hides owner actions", async () => {
  (VehicleService.getVehicleById as jest.Mock).mockResolvedValue({
    data: { ...vehicle(), is_own_vehicle: false },
    error: null,
  });
  render(<VehicleDetailScreen />);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Edit Vehicle" }).props
        .accessibilityState.disabled,
    ).toBe(false),
  );
  expect(screen.queryByText("Delete Vehicle")).toBeNull();
  expect(screen.queryByText("Manage")).toBeNull();
  (canUserAccessVehicle as jest.Mock).mockResolvedValue(false);
  await refocus();
  expect(
    screen.getByRole("button", { name: "Edit Vehicle" }).props
      .accessibilityState.disabled,
  ).toBe(true);
});

it("disables edit and log creation while refreshed access is unresolved", async () => {
  render(<VehicleDetailScreen />);
  await waitFor(() => expect(screen.getByText("6,000 km")).toBeTruthy());
  let resolveAccess!: (value: boolean) => void;
  (canUserAccessVehicle as jest.Mock).mockReturnValueOnce(
    new Promise((resolve) => {
      resolveAccess = resolve;
    }),
  );
  await refocus();
  expect(
    screen.getByRole("button", { name: "Edit Vehicle" }).props
      .accessibilityState.disabled,
  ).toBe(true);
  expect(
    screen.getByRole("button", { name: "Add mileage log" }).props
      .accessibilityState.disabled,
  ).toBe(true);
  await act(async () => resolveAccess(true));
  expect(
    screen.getByRole("button", { name: "Edit Vehicle" }).props
      .accessibilityState.disabled,
  ).toBe(false);
});

it("keeps navigation available after an initial failure and allows retry", async () => {
  (VehicleService.getVehicleById as jest.Mock).mockResolvedValueOnce({
    data: null,
    error: "offline",
  });
  render(<VehicleDetailScreen />);
  await waitFor(() => expect(screen.getByText("Retry")).toBeTruthy());
  expect(router.back).not.toHaveBeenCalled();
  expect(screen.getByRole("link", { name: "Vehicles" })).toBeTruthy();
  fireEvent.press(screen.getByText("Retry"));
  await waitFor(() => expect(screen.getByText("6,000 km")).toBeTruthy());
});

it("ignores a late failure from a previous focus", async () => {
  let resolveFirst!: (value: any) => void;
  (VehicleService.getVehicleById as jest.Mock).mockReturnValueOnce(
    new Promise((resolve) => {
      resolveFirst = resolve;
    }),
  );
  render(<VehicleDetailScreen />);
  await refocus();
  await waitFor(() => expect(screen.getByText("6,000 km")).toBeTruthy());
  await act(async () => resolveFirst({ data: null, error: "old failure" }));
  expect(toast.error).not.toHaveBeenCalled();
  expect(router.back).not.toHaveBeenCalled();
});

it("retains the loaded vehicle when a refresh fails", async () => {
  render(<VehicleDetailScreen />);
  await waitFor(() => expect(screen.getByText("6,000 km")).toBeTruthy());
  (VehicleService.getVehicleById as jest.Mock).mockResolvedValue({
    data: null,
    error: "offline",
  });
  await refocus();
  expect(screen.getByText("6,000 km")).toBeTruthy();
  expect(toast.error).toHaveBeenCalled();
  expect(screen.queryByText("Retry")).toBeNull();
});

it("uses the saved name in the Edit breadcrumb while the form changes", async () => {
  render(<EditVehicleScreen />);
  expect(screen.getByRole("link", { name: "Vehicle" })).toBeTruthy();
  await waitFor(() =>
    expect(screen.getByRole("link", { name: "2022 Honda Civic" })).toBeTruthy(),
  );
  fireEvent.changeText(screen.getByPlaceholderText("Camry"), "Accord");
  fireEvent.press(screen.getByRole("link", { name: "2022 Honda Civic" }));
  expect(router.push).toHaveBeenCalledWith({
    pathname: "/vehicles/[id]",
    params: { id: "civic" },
  });
  expect(screen.getByText("Vehicle Edit").props["aria-current"]).toBe("page");
});

it("keeps breadcrumbs out of the native vehicle layout", async () => {
  mockLayout.isWeb = false;
  mockLayout.isMobile = true;
  render(<VehicleDetailScreen />);
  await waitFor(() => expect(screen.getByText("6,000 km")).toBeTruthy());
  expect(screen.queryByRole("link", { name: "Vehicles" })).toBeNull();
});

it.each(["Mileage", "Fuel", "Service"])(
  "passes the Vehicles list origin to Add %s",
  async (tab) => {
    mockReturnTo = "vehicles";
    render(<VehicleDetailScreen />);
    await waitFor(() => expect(screen.getByText("6,000 km")).toBeTruthy());
    fireEvent.press(screen.getByRole("button", { name: tab }));
    fireEvent.press(
      screen.getByRole("button", { name: `Add ${tab.toLowerCase()} log` }),
    );
    expect(router.push).toHaveBeenCalledWith({
      pathname: `/logs/${tab.toLowerCase()}/add`,
      params: { vehicleId: "civic", returnTo: "vehicles" },
    });
  },
);
