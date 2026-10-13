import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { ImageGallery } from "@/components/ui/ImageUpload";

const mockShowError = jest.fn();
const mockChoose = jest.fn();
const mockUploadFromUri = jest.fn();

jest.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    showSuccess: jest.fn(),
    showError: (...a: unknown[]) => mockShowError(...a),
    showWarning: jest.fn(),
    showInfo: jest.fn(),
  }),
}));
jest.mock("@/lib/contexts/DialogContext", () => ({
  useDialog: () => ({ choose: (...a: unknown[]) => mockChoose(...a) }),
}));
jest.mock("@/lib/services/imageUploadService", () => ({
  ImageUploadService: {
    uploadVehicleImageFromUri: (...a: unknown[]) => mockUploadFromUri(...a),
  },
}));
jest.mock("expo-image-picker", () => ({
  MediaTypeOptions: { Images: "Images" },
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({
    status: "granted",
  }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: "file:///photo.jpg" }],
  }),
}));
jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("@/components/ui/ImageCropModal", () => ({
  ImageCropModal: () => null,
}));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
jest.mock("react-native-unistyles", () => {
  const { lightTheme } = jest.requireActual("@/src/design-system");
  return { useStyles: () => ({ theme: lightTheme }) };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockChoose.mockResolvedValue("gallery");
});

describe("ImageGallery upload error feedback", () => {
  it("shows exactly one error toast when the upload fails", async () => {
    mockUploadFromUri.mockResolvedValue({ data: null, error: "Too big" });
    const { getByText } = render(<ImageGallery vehicleId="v1" images={[]} />);

    fireEvent.press(getByText("Add Photo"));

    await waitFor(() => expect(mockUploadFromUri).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockShowError).toHaveBeenCalledTimes(1));
    expect(mockShowError).toHaveBeenCalledWith("Upload failed", {
      message: "Too big",
    });
  });
});
