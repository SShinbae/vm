import {
  isLocalUri,
  storageImageUrl,
  toBucketPath,
} from "@/lib/utils/storagePath";

const mockGetPublicUrl = jest.fn();
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
  mockGetPublicUrl.mockImplementation((path: string) => ({
    data: { publicUrl: `${HOST}/storage/v1/object/public/bucket/${path}` },
  }));
  mockFrom.mockReturnValue({ getPublicUrl: mockGetPublicUrl });
});

describe("toBucketPath", () => {
  it("strips the public URL prefix for each image bucket", () => {
    expect(
      toBucketPath(
        "profile-avatars",
        `${HOST}/storage/v1/object/public/profile-avatars/uid/avatar_1.jpg`,
      ),
    ).toBe("uid/avatar_1.jpg");
    expect(
      toBucketPath(
        "vehicle-images",
        `${HOST}/storage/v1/object/public/vehicle-images/uid/vehicle_v1_1.jpg`,
      ),
    ).toBe("uid/vehicle_v1_1.jpg");
  });

  it("strips the query string from a storage URL", () => {
    expect(
      toBucketPath(
        "vehicle-images",
        `${HOST}/storage/v1/object/public/vehicle-images/uid/a.jpg?t=1`,
      ),
    ).toBe("uid/a.jpg");
  });

  it("strips the sign and authenticated URL prefixes", () => {
    expect(
      toBucketPath(
        "vehicle-images",
        `${HOST}/storage/v1/object/sign/vehicle-images/uid/a.jpg?token=abc`,
      ),
    ).toBe("uid/a.jpg");
    expect(
      toBucketPath(
        "profile-avatars",
        `${HOST}/storage/v1/object/authenticated/profile-avatars/uid/a.jpg`,
      ),
    ).toBe("uid/a.jpg");
  });

  it("returns a bare path unchanged", () => {
    expect(toBucketPath("vehicle-images", "uid/a.jpg")).toBe("uid/a.jpg");
  });

  it("leaves an external URL unchanged, query string included", () => {
    const google = "https://lh3.googleusercontent.com/a/abc=s96-c?x=1";
    expect(toBucketPath("profile-avatars", google)).toBe(google);
  });

  it("leaves a storage URL for a different bucket unchanged", () => {
    const other = `${HOST}/storage/v1/object/public/receipt-images/uid/r.jpg`;
    expect(toBucketPath("vehicle-images", other)).toBe(other);
  });
});

describe("isLocalUri", () => {
  it.each([
    "file:///var/mobile/photo.jpg",
    "content://media/external/1",
    "ph://ABC123",
    "assets-library://asset?id=1",
    "blob:https://x/1",
    "data:image/png;base64,AAAA",
  ])("treats %s as local", (uri) => {
    expect(isLocalUri(uri)).toBe(true);
  });

  it("treats a bucket path as not local", () => {
    expect(isLocalUri("uid/a.jpg")).toBe(false);
  });
});

describe("storageImageUrl", () => {
  it("returns undefined for a missing value", () => {
    expect(storageImageUrl("vehicle-images", null)).toBeUndefined();
    expect(storageImageUrl("vehicle-images", undefined)).toBeUndefined();
    expect(storageImageUrl("vehicle-images", "")).toBeUndefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("builds the public URL for a bucket path", () => {
    expect(storageImageUrl("profile-avatars", "uid/avatar_1.jpg")).toBe(
      `${HOST}/storage/v1/object/public/bucket/uid/avatar_1.jpg`,
    );
    expect(mockFrom).toHaveBeenCalledWith("profile-avatars");
    expect(mockGetPublicUrl).toHaveBeenCalledWith("uid/avatar_1.jpg");
  });

  it("returns an https URL unchanged", () => {
    const google = "https://lh3.googleusercontent.com/a/abc=s96-c";
    expect(storageImageUrl("profile-avatars", google)).toBe(google);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it.each(["file:///x.jpg", "blob:https://x/1", "data:image/png;base64,AA"])(
    "returns the local URI %s unchanged",
    (uri) => {
      expect(storageImageUrl("vehicle-images", uri)).toBe(uri);
      expect(mockFrom).not.toHaveBeenCalled();
    },
  );
});
