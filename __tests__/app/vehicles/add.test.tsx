import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AddVehicleScreen from "@/app/vehicles/add";

jest.mock("@/components/layout/DashboardWebLayout", () => ({
  DashboardWebLayout: ({ children }: any) => children,
}));
jest.mock("@/hooks/use-responsive-layout", () => ({
  useResponsiveLayout: () => ({ isWeb: false, isMobile: true }),
}));
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockShowSuccess = jest.fn();
const mockShowError = jest.fn();
const mockShowWarning = jest.fn();
const mockCapture = jest.fn();
const mockCreateVehicle = jest.fn();
const mockImageUploadRender = jest.fn();
const mockUploadFromUri = jest.fn();
const mockUploadVehicleImage = jest.fn();
const mockUploadAvatarFromUri = jest.fn();
const mockUploadProfileAvatar = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    push: (...a: unknown[]) => mockPush(...a),
    back: (...a: unknown[]) => mockBack(...a),
  },
}));
jest.mock("posthog-react-native", () => ({
  usePostHog: () => ({ capture: (...a: unknown[]) => mockCapture(...a) }),
}));
jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    showSuccess: (...a: unknown[]) => mockShowSuccess(...a),
    showError: (...a: unknown[]) => mockShowError(...a),
    showWarning: (...a: unknown[]) => mockShowWarning(...a),
    showInfo: jest.fn(),
  }),
}));
jest.mock("@/lib/services/vehicleService", () => ({
  VehicleService: {
    createVehicle: (...a: unknown[]) => mockCreateVehicle(...a),
  },
}));
jest.mock("@/lib/services/imageUploadService", () => ({
  ImageUploadService: {
    uploadVehicleImage: (...a: unknown[]) => mockUploadVehicleImage(...a),
    uploadVehicleImageFromUri: (...a: unknown[]) => mockUploadFromUri(...a),
    uploadProfileAvatar: (...a: unknown[]) => mockUploadProfileAvatar(...a),
    uploadProfileAvatarFromUri: (...a: unknown[]) =>
      mockUploadAvatarFromUri(...a),
  },
}));
// The real ImageUpload opens a picker; the stub exposes a "Pick photo" press
// that reports a picked image through onImageSelected.
jest.mock("@/components/ui/ImageUpload", () => {
  const { Text } = jest.requireActual("react-native");
  const { createElement } = jest.requireActual("react");
  return {
    ImageUpload: (props: any) => {
      mockImageUploadRender(props);
      return createElement(
        Text,
        { onPress: () => props.onImageSelected?.({ uri: "file:///p.jpg" }) },
        "Pick photo",
      );
    },
  };
});
jest.mock("@/components/ui/Input", () => {
  const { TextInput } = jest.requireActual("react-native");
  const { createElement } = jest.requireActual("react");
  return {
    Input: (props: any) =>
      createElement(TextInput, {
        placeholder: props.placeholder,
        value: props.value,
        onChangeText: props.onChangeText,
      }),
  };
});
jest.mock("@/components/ui/YearPicker", () => ({ YearPicker: () => null }));
jest.mock("@/components/ui/Button", () => {
  const { Text } = jest.requireActual("react-native");
  const { createElement } = jest.requireActual("react");
  return {
    Button: (props: any) =>
      createElement(
        Text,
        { onPress: props.disabled ? undefined : props.onPress },
        props.title,
      ),
  };
});
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
jest.mock("react-native-safe-area-context", () => {
  const { View } = jest.requireActual("react-native");
  const { createElement } = jest.requireActual("react");
  return {
    SafeAreaView: (props: any) => createElement(View, null, props.children),
  };
});
jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}));
jest.mock("react-native-unistyles", () => {
  const { lightTheme } = jest.requireActual("@/src/design-system");
  return {
    createStyleSheet: (fn: any) => fn,
    useStyles: (fn?: any) => ({
      theme: lightTheme,
      styles: fn ? fn(lightTheme) : {},
    }),
  };
});

function fillForm(getByPlaceholderText: (text: string) => any) {
  fireEvent.changeText(getByPlaceholderText("Toyota"), "Toyota");
  fireEvent.changeText(getByPlaceholderText("Camry"), "Camry");
  fireEvent.changeText(getByPlaceholderText("ABC123"), "abc123");
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCreateVehicle.mockResolvedValue({
    data: { id: "new-vehicle-id" },
    error: null,
  });
  mockUploadFromUri.mockResolvedValue({
    data: { image_url: "https://x/y.jpg" },
    error: null,
  });
});

describe("AddVehicleScreen photo flow", () => {
  it("creates the vehicle, then uploads the picked photo as its main photo", async () => {
    const { getByText, getByPlaceholderText } = render(<AddVehicleScreen />);
    expect(mockImageUploadRender.mock.calls[0][0].type).toBe("vehicle_main");

    fillForm(getByPlaceholderText);
    fireEvent.press(getByText("Pick photo"));
    fireEvent.press(getByText("Save Vehicle"));

    await waitFor(() =>
      expect(mockUploadFromUri).toHaveBeenCalledWith(
        "new-vehicle-id",
        "file:///p.jpg",
        "vehicle_main",
      ),
    );
    expect(mockCreateVehicle.mock.calls[0]).toHaveLength(1);
    expect(mockUploadAvatarFromUri).not.toHaveBeenCalled();
    expect(mockUploadProfileAvatar).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/(tabs)/vehicles"),
    );
    expect(mockShowSuccess).toHaveBeenCalledWith("Vehicle added successfully!");
    expect(mockShowWarning).not.toHaveBeenCalled();
  });

  it("keeps the vehicle and warns when the photo upload fails", async () => {
    mockUploadFromUri.mockResolvedValue({ data: null, error: "Too big" });
    const { getByText, getByPlaceholderText } = render(<AddVehicleScreen />);

    fillForm(getByPlaceholderText);
    fireEvent.press(getByText("Pick photo"));
    fireEvent.press(getByText("Save Vehicle"));

    await waitFor(() =>
      expect(mockShowWarning).toHaveBeenCalledWith("Vehicle added", {
        message: "The photo couldn't be uploaded. Add it from Edit vehicle.",
      }),
    );
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/(tabs)/vehicles"),
    );
    expect(mockShowError).not.toHaveBeenCalled();
    expect(mockUploadAvatarFromUri).not.toHaveBeenCalled();
  });

  it("creates a vehicle without a photo and makes no upload calls", async () => {
    const { getByText, getByPlaceholderText } = render(<AddVehicleScreen />);

    fillForm(getByPlaceholderText);
    fireEvent.press(getByText("Save Vehicle"));

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/(tabs)/vehicles"),
    );
    expect(mockCreateVehicle.mock.calls[0]).toHaveLength(1);
    expect(mockUploadFromUri).not.toHaveBeenCalled();
    expect(mockUploadVehicleImage).not.toHaveBeenCalled();
    expect(mockUploadAvatarFromUri).not.toHaveBeenCalled();
    expect(mockUploadProfileAvatar).not.toHaveBeenCalled();
    expect(mockShowWarning).not.toHaveBeenCalled();
  });
});
