import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { ReceiptViewer } from "@/components/ui/ReceiptViewer";

const mockGetReceiptSignedUrl = jest.fn();
const mockImage = jest.fn();

jest.mock("@/lib/services/receiptStorageService", () => {
  const actual = jest.requireActual("@/lib/services/receiptStorageService");
  return {
    ...actual,
    ReceiptStorageService: {
      getReceiptSignedUrl: (...args: unknown[]) =>
        mockGetReceiptSignedUrl(...args),
    },
  };
});
jest.mock("expo-image", () => ({
  Image: (props: { source?: { uri?: string } }) => {
    mockImage(props);
    return null;
  },
}));
jest.mock("@/components/ui/icon-symbol", () => ({ IconSymbol: () => null }));
jest.mock("@/lib/contexts/DialogContext", () => ({
  useDialog: () => ({ confirm: jest.fn() }),
}));
jest.mock("react-native-unistyles", () => {
  const { lightTheme } = jest.requireActual("@/src/design-system");
  return { useStyles: () => ({ theme: lightTheme }) };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ReceiptViewer", () => {
  it("renders a stored path through its signed URL", async () => {
    mockGetReceiptSignedUrl.mockResolvedValue({
      data: "https://signed/uid/x.jpg?token=t",
      error: null,
      loading: false,
    });

    render(<ReceiptViewer receiptImageUrl="uid/x.jpg" showOcrData={false} />);

    await waitFor(() =>
      expect(mockImage).toHaveBeenCalledWith(
        expect.objectContaining({
          source: { uri: "https://signed/uid/x.jpg?token=t" },
        }),
      ),
    );
    expect(mockGetReceiptSignedUrl).toHaveBeenCalledWith("uid/x.jpg");
  });

  it("shows a local file URI as is, without signing it", () => {
    render(
      <ReceiptViewer
        receiptImageUrl="file:///photo/receipt.jpg"
        showOcrData={false}
      />,
    );

    expect(mockImage).toHaveBeenCalledWith(
      expect.objectContaining({
        source: { uri: "file:///photo/receipt.jpg" },
      }),
    );
    expect(mockGetReceiptSignedUrl).not.toHaveBeenCalled();
  });

  it("shows the error state when signing fails", async () => {
    mockGetReceiptSignedUrl.mockResolvedValue({
      data: null,
      error: "Object not found",
      loading: false,
    });

    const { findByText } = render(
      <ReceiptViewer receiptImageUrl="uid/x.jpg" showOcrData={false} />,
    );

    expect(await findByText("Unable to load receipt image")).toBeTruthy();
    expect(mockImage).not.toHaveBeenCalled();
  });
});
