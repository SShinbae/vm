import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { ImageGallery, ImageUpload } from "@/components/ui/ImageUpload";

const mockShowError = jest.fn();
const mockChoose = jest.fn();
const mockUploadFromUri = jest.fn();
const mockUploadAvatarFromUri = jest.fn();
const mockUploadVehicleImage = jest.fn();
const mockImage = jest.fn((_props?: unknown) => null);

jest.mock("@/services/supabaseClient", () => ({
  supabase: {
    storage: {
      from: (bucket: string) => ({
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://cdn.test/${bucket}/${path}` },
        }),
      }),
    },
  },
}));

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
    uploadProfileAvatarFromUri: (...a: unknown[]) =>
      mockUploadAvatarFromUri(...a),
    uploadVehicleImage: (...a: unknown[]) => mockUploadVehicleImage(...a),
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
jest.mock("expo-image", () => ({
  Image: (props: unknown) => mockImage(props),
}));
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

describe("ImageUpload select-only mode (onImageSelected)", () => {
  it("hands the picked image to the parent and uploads nothing", async () => {
    const onImageSelected = jest.fn();
    const { getByText } = render(
      <ImageUpload
        type="vehicle_main"
        circular
        placeholder="Add Vehicle Photo"
        onImageSelected={onImageSelected}
      />,
    );

    fireEvent.press(getByText("Add Vehicle Photo"));

    await waitFor(() =>
      expect(onImageSelected).toHaveBeenCalledWith({
        uri: "file:///photo.jpg",
      }),
    );
    expect(mockUploadFromUri).not.toHaveBeenCalled();
    expect(mockUploadAvatarFromUri).not.toHaveBeenCalled();
    expect(mockUploadVehicleImage).not.toHaveBeenCalled();
    expect(mockShowError).not.toHaveBeenCalled();
  });
});

describe("ImageUpload image source", () => {
  it("renders a stored avatar path as its public URL", () => {
    render(<ImageUpload type="avatar" currentImageUrl="uid/avatar_1.jpg" />);

    expect(mockImage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        source: { uri: "https://cdn.test/profile-avatars/uid/avatar_1.jpg" },
      }),
    );
  });

  it("renders a stored vehicle path as its public URL", () => {
    render(
      <ImageUpload
        type="vehicle_main"
        vehicleId="v1"
        currentImageUrl="uid/v.jpg"
      />,
    );

    expect(mockImage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        source: { uri: "https://cdn.test/vehicle-images/uid/v.jpg" },
      }),
    );
  });

  it("leaves an external https URL unchanged", () => {
    const google = "https://lh3.googleusercontent.com/a/abc=s96-c";
    render(<ImageUpload type="avatar" currentImageUrl={google} />);

    expect(mockImage).toHaveBeenLastCalledWith(
      expect.objectContaining({ source: { uri: google } }),
    );
  });
});

describe("ImageUpload without onImageSelected", () => {
  it("still uploads the picked image as a vehicle photo", async () => {
    mockUploadFromUri.mockResolvedValue({
      data: { image_url: "https://x/y.jpg" },
      error: null,
    });
    const onUploadComplete = jest.fn();
    const { getByText } = render(
      <ImageUpload
        type="vehicle_main"
        vehicleId="v1"
        placeholder="Add Vehicle Photo"
        onUploadComplete={onUploadComplete}
      />,
    );

    fireEvent.press(getByText("Add Vehicle Photo"));

    await waitFor(() =>
      expect(mockUploadFromUri).toHaveBeenCalledWith(
        "v1",
        "file:///photo.jpg",
        "vehicle_main",
      ),
    );
    await waitFor(() =>
      expect(onUploadComplete).toHaveBeenCalledWith("https://x/y.jpg"),
    );
  });
});
