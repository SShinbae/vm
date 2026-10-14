import {
  ReceiptStorageService,
  isLocalUri,
  toReceiptPath,
} from "@/lib/services/receiptStorageService";

const mockCreateSignedUrl = jest.fn();
const mockFrom = jest.fn();

jest.mock("@/services/supabaseClient", () => ({
  supabase: {
    storage: {
      from: (...args: unknown[]) => mockFrom(...args),
    },
  },
}));

const HOST = "https://proj.supabase.co";

beforeEach(() => {
  jest.clearAllMocks();
  mockFrom.mockReturnValue({ createSignedUrl: mockCreateSignedUrl });
});

describe("toReceiptPath", () => {
  it("strips the public URL prefix", () => {
    expect(
      toReceiptPath(
        `${HOST}/storage/v1/object/public/receipt-images/uid/1_a.jpg`,
      ),
    ).toBe("uid/1_a.jpg");
  });

  it("strips the sign URL prefix and the token query string", () => {
    expect(
      toReceiptPath(
        `${HOST}/storage/v1/object/sign/receipt-images/uid/1_a.jpg?token=abc`,
      ),
    ).toBe("uid/1_a.jpg");
  });

  it("strips the authenticated URL prefix", () => {
    expect(
      toReceiptPath(
        `${HOST}/storage/v1/object/authenticated/receipt-images/uid/1_a.jpg`,
      ),
    ).toBe("uid/1_a.jpg");
  });

  it("returns a bare path unchanged", () => {
    expect(toReceiptPath("uid/1_a.jpg")).toBe("uid/1_a.jpg");
  });
});

describe("isLocalUri", () => {
  it.each([
    "file:///var/mobile/receipt.jpg",
    "content://media/external/1",
    "ph://ABC123",
    "assets-library://asset?id=1",
    "blob:https://x/1",
    "data:image/png;base64,AAAA",
  ])("treats %s as local", (uri) => {
    expect(isLocalUri(uri)).toBe(true);
  });

  it.each([
    `${HOST}/storage/v1/object/public/receipt-images/uid/1_a.jpg`,
    "uid/1_a.jpg",
  ])("treats %s as remote", (value) => {
    expect(isLocalUri(value)).toBe(false);
  });
});

describe("ReceiptStorageService.getReceiptSignedUrl", () => {
  it("signs a bare path for one hour", async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://signed/uid/x.jpg?token=t" },
      error: null,
    });

    const result = await ReceiptStorageService.getReceiptSignedUrl("uid/x.jpg");

    expect(mockFrom).toHaveBeenCalledWith("receipt-images");
    expect(mockCreateSignedUrl).toHaveBeenCalledWith("uid/x.jpg", 3600);
    expect(result).toEqual({
      data: "https://signed/uid/x.jpg?token=t",
      error: null,
      loading: false,
    });
  });

  it("converts a legacy full URL to a path before signing", async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://signed/uid/x.jpg?token=t" },
      error: null,
    });

    await ReceiptStorageService.getReceiptSignedUrl(
      `${HOST}/storage/v1/object/public/receipt-images/uid/x.jpg?v=1`,
    );

    expect(mockCreateSignedUrl).toHaveBeenCalledWith("uid/x.jpg", 3600);
  });

  it("returns an error result when signing fails", async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: null,
      error: { message: "Object not found" },
    });

    const result = await ReceiptStorageService.getReceiptSignedUrl("uid/x.jpg");

    expect(result.data).toBeNull();
    expect(result.error).toBe("Object not found");
    expect(result.loading).toBe(false);
  });
});
