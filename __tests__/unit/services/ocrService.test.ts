import { OCRService } from "@/lib/services/ocrService";
import { GoogleVisionService } from "@/lib/services/googleVisionService";

jest.mock("expo-image-picker", () => ({}));
jest.mock("react-native-image-crop-picker", () => ({
  __esModule: true,
  default: {},
}));
jest.mock("@/lib/services/googleVisionService", () => ({
  GoogleVisionService: { extractTextFromImage: jest.fn() },
}));

const mockGetUser = jest.fn();
const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn();

jest.mock("@/services/supabaseClient", () => ({
  supabase: {
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => mockUpload(...args),
        getPublicUrl: (...args: unknown[]) => mockGetPublicUrl(...args),
      }),
    },
  },
}));

const receiptText = [
  "Jiffy Lube",
  "Oil Change and Filter",
  "Total: $89.50",
  "09/13/2026",
  "Odometer: 45,000 miles",
].join("\n");

describe("OCRService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("extracts structured service fields from receipt text", () => {
    const result = OCRService.parseExtractedText(receiptText);

    expect(result).toMatchObject({
      service_type: "oil_change",
      cost: 89.5,
      date: "09/13/2026",
      odometer_reading: 45000,
      business_name: "Jiffy Lube",
    });
  });

  it("processes recognized text into OCR data", async () => {
    (GoogleVisionService.extractTextFromImage as jest.Mock).mockResolvedValue({
      data: receiptText,
      error: null,
      confidence: 90,
    });

    const result = await OCRService.processReceiptImage("file://receipt.jpg");

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      raw_text: receiptText,
      extracted_fields: { cost: 89.5, service_type: "oil_change" },
    });
  });
});

describe("OCRService.uploadReceiptImage", () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "uid" } },
      error: null,
    });
    mockUpload.mockResolvedValue({
      data: { path: "uid/123_receipt.jpg" },
      error: null,
    });
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: "https://proj.supabase.co/public/uid/123.jpg" },
    });
    fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({
      arrayBuffer: async () => new ArrayBuffer(1),
    } as unknown as Response);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("returns the storage path and never builds a public URL", async () => {
    const result = await OCRService.uploadReceiptImage(
      "file://receipt.jpg",
      "receipt.jpg",
    );

    expect(result).toEqual({
      data: "uid/123_receipt.jpg",
      error: null,
      loading: false,
    });
    expect(mockGetPublicUrl).not.toHaveBeenCalled();
  });
});
