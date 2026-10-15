import React from "react";
import { Platform } from "react-native";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import AddVehicle from "@/app/vehicles/add";
import EditVehicle from "@/app/vehicles/[id]/edit";
import AddTemplate from "@/app/vehicles/services/add";
import { VehicleService } from "@/lib/services/vehicleService";
import { ImageUploadService } from "@/lib/services/imageUploadService";
import { router } from "expo-router";
let mockMobile = false;
const mockError = jest.fn();
const mockWarning = jest.fn();
const mockSuccess = jest.fn();
jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
  useLocalSearchParams: () => ({ id: "car" }),
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
jest.mock("@/components/layout/DashboardWebLayout", () => ({
  DashboardWebLayout: ({ children }: any) => {
    const { View, Text } = require("react-native");
    return (
      <View>
        {!mockMobile && <Text>Shared shell</Text>}
        {children}
      </View>
    );
  },
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: require("react-native").View,
}));
jest.mock("react-native-unistyles", () => ({
  createStyleSheet: (fn: any) => fn,
  useStyles: (fn?: any) => {
    const theme = require("@/src/design-system").lightTheme;
    return { theme, styles: fn ? fn(theme) : {} };
  },
}));
jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    showSuccess: mockSuccess,
    showError: mockError,
    showWarning: mockWarning,
  }),
}));
jest.mock("posthog-react-native", () => ({ usePostHog: () => null }));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
jest.mock("@/components/ui/YearPicker", () => ({ YearPicker: () => null }));
jest.mock("@/components/ui/Skeleton", () => ({
  SkeletonVehicleEdit: () => null,
}));
jest.mock("@/components/ui/ImageUpload", () => ({
  ImageUpload: (props: any) => {
    const { Text } = require("react-native");
    return (
      <Text onPress={() => props.onImageSelected?.({ uri: "file:///car.jpg" })}>
        Pick photo
      </Text>
    );
  },
}));
jest.mock("@/lib/services/imageUploadService", () => ({
  ImageUploadService: {
    uploadVehicleImageFromUri: jest.fn(),
    uploadVehicleImage: jest.fn(),
  },
}));
jest.mock("@/lib/services/vehicleService", () => ({
  VehicleService: {
    createVehicle: jest.fn(),
    updateVehicle: jest.fn(),
    getVehicleById: jest.fn(),
    createServiceTemplate: jest.fn(),
  },
}));
const car = {
  id: "car",
  year: 2022,
  make: "Honda",
  model: "Civic",
  license_plate: "WNA1234",
  vin: "",
  main_image_url: null,
  is_own_vehicle: true,
};
beforeEach(() => {
  jest.clearAllMocks();
  mockMobile = false;
  Object.defineProperty(Platform, "OS", { value: "web", configurable: true });
  (router.canGoBack as jest.Mock).mockReturnValue(true);
  (VehicleService.getVehicleById as jest.Mock).mockResolvedValue({
    data: car,
    error: null,
  });
  (VehicleService.createVehicle as jest.Mock).mockResolvedValue({
    data: car,
    error: null,
  });
  (VehicleService.updateVehicle as jest.Mock).mockResolvedValue({
    data: car,
    error: null,
  });
  (VehicleService.createServiceTemplate as jest.Mock).mockResolvedValue({
    data: {},
    error: null,
  });
  (ImageUploadService.uploadVehicleImageFromUri as jest.Mock).mockResolvedValue(
    { data: {}, error: null },
  );
});
function fillVehicle() {
  fireEvent.changeText(screen.getByPlaceholderText("Toyota"), "Honda");
  fireEvent.changeText(screen.getByPlaceholderText("Camry"), "Civic");
  fireEvent.changeText(screen.getByPlaceholderText("ABC123"), "WNA1234");
}
function fillTemplate() {
  fireEvent.changeText(
    screen.getByPlaceholderText("e.g., Basic Oil Change"),
    "Oil change",
  );
  fireEvent.changeText(
    screen.getAllByPlaceholderText("e.g., Engine Oil (5L)")[0],
    "Oil",
  );
  fireEvent.changeText(screen.getAllByPlaceholderText("0.00")[0], "100");
}
test.each([
  [AddVehicle, "Add Vehicle"],
  [AddTemplate, "Create Service Template"],
] as const)(
  "uses the shared shell and current breadcrumb for form %#",
  (Page, title) => {
    render(<Page />);
    expect(screen.getByText("Shared shell")).toBeTruthy();
    expect(screen.getByText(title).props["aria-current"]).toBe("page");
    fireEvent.press(screen.getByText("Vehicles"));
    expect(router.push).toHaveBeenCalledWith("/vehicles");
  },
);
test("Edit keeps its saved breadcrumb and supports retry after a save failure", async () => {
  (VehicleService.updateVehicle as jest.Mock).mockRejectedValueOnce(
    new Error("Offline"),
  );
  render(<EditVehicle />);
  await screen.findByText("2022 Honda Civic");
  fireEvent.changeText(screen.getByPlaceholderText("Camry"), "Accord");
  expect(screen.getByText("2022 Honda Civic")).toBeTruthy();
  fireEvent.press(screen.getByText("Update Vehicle"));
  await waitFor(() => expect(mockError).toHaveBeenCalled());
  expect(screen.getByDisplayValue("Accord")).toBeTruthy();
  await waitFor(() => expect(screen.getByText("Update Vehicle")).toBeEnabled());
  fireEvent.press(screen.getByText("Update Vehicle"));
  await waitFor(() =>
    expect(router.push).toHaveBeenCalledWith("/(tabs)/vehicles"),
  );
});
test("Add Vehicle retains fields when creation fails and resets its busy state", async () => {
  (VehicleService.createVehicle as jest.Mock).mockRejectedValueOnce(
    new Error("Offline"),
  );
  render(<AddVehicle />);
  fillVehicle();
  fireEvent.press(screen.getByText("Save Vehicle"));
  await waitFor(() => expect(mockError).toHaveBeenCalled());
  expect(screen.getByDisplayValue("WNA1234")).toBeTruthy();
  await waitFor(() => expect(screen.getByText("Save Vehicle")).toBeEnabled());
  expect(router.push).not.toHaveBeenCalled();
});
test("a rejected photo upload warns after creation and still returns to Vehicles", async () => {
  (
    ImageUploadService.uploadVehicleImageFromUri as jest.Mock
  ).mockRejectedValueOnce(new Error("Offline"));
  render(<AddVehicle />);
  fillVehicle();
  fireEvent.press(screen.getByText("Pick photo"));
  fireEvent.press(screen.getByText("Save Vehicle"));
  await waitFor(() =>
    expect(router.push).toHaveBeenCalledWith("/(tabs)/vehicles"),
  );
  expect(VehicleService.createVehicle).toHaveBeenCalledTimes(1);
  expect(mockWarning).toHaveBeenCalled();
  expect(mockError).not.toHaveBeenCalled();
});
test("Template uses inline actions and saves valid rows with the correct total", async () => {
  render(<AddTemplate />);
  expect(screen.getByText("Save Template")).toBeDisabled();
  fillTemplate();
  expect(screen.getByText("RM100.00")).toBeTruthy();
  fireEvent.press(screen.getByText("Save Template"));
  await waitFor(() =>
    expect(VehicleService.createServiceTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Oil change",
        items: [{ description: "Oil", price: 100 }],
      }),
    ),
  );
  expect(router.back).toHaveBeenCalled();
});
test("Template failure keeps the draft and Cancel follows history", async () => {
  (VehicleService.createServiceTemplate as jest.Mock).mockRejectedValueOnce(
    new Error("Offline"),
  );
  render(<AddTemplate />);
  fillTemplate();
  fireEvent.press(screen.getByText("Save Template"));
  await waitFor(() => expect(mockError).toHaveBeenCalled());
  expect(screen.getByDisplayValue("Oil change")).toBeTruthy();
  await waitFor(() => expect(screen.getByText("Save Template")).toBeEnabled());
  fireEvent.press(screen.getByText("Cancel"));
  expect(router.back).toHaveBeenCalled();
});
test.each([AddVehicle, EditVehicle, AddTemplate])(
  "keeps desktop breadcrumbs out of native form %#",
  async (Page) => {
    mockMobile = true;
    Object.defineProperty(Platform, "OS", { value: "ios", configurable: true });
    render(<Page />);
    if (Page === EditVehicle) await screen.findByText("Update Vehicle");
    expect(screen.queryByText("Shared shell")).toBeNull();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  },
);
