/**
 * ImageUploadService Tests
 *
 * Covers vehicle image uploads by the vehicle owner and by group members
 * the vehicle is shared with (main photo only), and that uploads store the
 * bucket path (not a URL) and deletes accept a path or a legacy URL.
 */

import { ImageUploadService } from "@/lib/services/imageUploadService";

const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockStorageFrom = jest.fn();
const mockGetPublicUrl = jest.fn();
const mockCanAccess = jest.fn();

jest.mock("@/services/supabaseClient", () => ({
  supabase: {
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    from: (...args: unknown[]) => mockFrom(...args),
    storage: { from: (...args: unknown[]) => mockStorageFrom(...args) },
  },
}));

jest.mock("@/lib/utils/serviceUtils", () => ({
  canUserAccessVehicle: (...args: unknown[]) => mockCanAccess(...args),
}));

const OWNER_ID = "owner-id";
const MEMBER_ID = "member-id";
const VEHICLE_ID = "vehicle-1";
const HOST = "https://proj.supabase.co";

type Calls = { table: string; method: string; args: unknown[] }[];

let calls: Calls;
let vehicleUpdateError: { message: string; code?: string } | null;
let imageInsertError: { message: string } | null;
let deletedImageRow: boolean;
let storedImageRow: {
  id: string;
  vehicle_id: string;
  image_url: string;
  image_type: string;
};
let storedAvatarUrl: string | null;

// Thenable query builder. The result depends on which methods were chained,
// so one table can answer its select, insert, update and delete differently.
function builder(table: string, resolveFor: (methods: string[]) => unknown) {
  const methods: string[] = [];
  const query: any = {};
  for (const method of [
    "select",
    "eq",
    "neq",
    "order",
    "limit",
    "insert",
    "update",
    "delete",
    "single",
  ]) {
    query[method] = jest.fn((...args: unknown[]) => {
      methods.push(method);
      calls.push({ table, method, args });
      return query;
    });
  }
  query.then = (resolve: any, reject: any) =>
    Promise.resolve(resolveFor(methods)).then(resolve, reject);
  return query;
}

function routeTable(table: string) {
  if (table === "vehicles") {
    return builder(table, (methods) =>
      methods.includes("update")
        ? { data: null, error: vehicleUpdateError }
        : { data: { user_id: OWNER_ID }, error: null },
    );
  }
  if (table === "vehicle_images") {
    return builder(table, (methods) => {
      if (methods.includes("insert")) {
        return {
          data: { id: "image-1", vehicle_id: VEHICLE_ID },
          error: imageInsertError,
        };
      }
      if (methods.includes("delete")) {
        deletedImageRow = true;
        return { data: null, error: null };
      }
      if (methods.includes("single")) {
        return { data: storedImageRow, error: null };
      }
      return { data: [], error: null };
    });
  }
  if (table === "profiles") {
    return builder(table, (methods) =>
      methods.includes("update")
        ? { data: null, error: null }
        : { data: { avatar_url: storedAvatarUrl }, error: null },
    );
  }
  throw new Error(`Unexpected table ${table}`);
}

const mockUpload = jest.fn();
const mockRemove = jest.fn();

function makeFile(name = "photo.jpg") {
  return { name, size: 1024, type: "image/jpeg" } as unknown as File;
}

beforeEach(() => {
  jest.clearAllMocks();
  calls = [];
  vehicleUpdateError = null;
  imageInsertError = null;
  deletedImageRow = false;
  storedImageRow = {
    id: "image-1",
    vehicle_id: VEHICLE_ID,
    image_url: `${OWNER_ID}/vehicle_${VEHICLE_ID}_1.jpg`,
    image_type: "vehicle_gallery",
  };
  storedAvatarUrl = `${MEMBER_ID}/avatar_1.jpg`;

  mockGetUser.mockResolvedValue({
    data: { user: { id: MEMBER_ID } },
    error: null,
  });
  mockCanAccess.mockResolvedValue(true);
  mockFrom.mockImplementation((table: string) => routeTable(table));
  mockUpload.mockResolvedValue({ error: null });
  mockRemove.mockResolvedValue({ error: null });
  mockGetPublicUrl.mockReturnValue({
    data: { publicUrl: "https://test.url/photo.jpg" },
  });
  mockStorageFrom.mockReturnValue({
    upload: mockUpload,
    remove: mockRemove,
    getPublicUrl: mockGetPublicUrl,
  });
});

describe("ImageUploadService vehicle image upload", () => {
  describe("uploadVehicleImage", () => {
    const upload = (type: "vehicle_main" | "vehicle_gallery") =>
      ImageUploadService.uploadVehicleImage(VEHICLE_ID, makeFile(), type);

    it("lets a member upload a main photo into the owner's folder, recorded as the member", async () => {
      const result = await upload("vehicle_main");

      expect(result.error).toBeNull();
      const uploadedPath = mockUpload.mock.calls[0][0] as string;
      expect(uploadedPath).toMatch(
        new RegExp(`^${OWNER_ID}/vehicle_${VEHICLE_ID}_`),
      );
      const insert = calls.find(
        (c) => c.table === "vehicle_images" && c.method === "insert",
      );
      expect((insert!.args[0] as any).uploaded_by).toBe(MEMBER_ID);
    });

    it("rejects a gallery photo from a member without touching storage", async () => {
      const result = await upload("vehicle_gallery");

      expect(result.error).toBe(
        "Only the vehicle owner can add gallery photos",
      );
      expect(mockStorageFrom).not.toHaveBeenCalled();
    });

    it("keeps the owner's gallery upload working in the owner's folder", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: OWNER_ID } },
        error: null,
      });

      const result = await upload("vehicle_gallery");

      expect(result.error).toBeNull();
      expect(mockUpload.mock.calls[0][0]).toMatch(
        new RegExp(`^${OWNER_ID}/vehicle_${VEHICLE_ID}_`),
      );
    });

    it("cleans up the file and image row when the main photo update fails", async () => {
      vehicleUpdateError = { message: "update failed" };

      const result = await upload("vehicle_main");

      expect(result.error).toBe("update failed");
      expect(mockRemove).toHaveBeenCalledTimes(1);
      expect(deletedImageRow).toBe(true);
    });
  });

  // Covers the member gallery rejection only. The success paths of
  // uploadVehicleImageFromUri use a dynamic import() that Jest can't run here.
  describe("uploadVehicleImageFromUri", () => {
    it("rejects a gallery photo from a member without touching storage", async () => {
      const result = await ImageUploadService.uploadVehicleImageFromUri(
        VEHICLE_ID,
        "file:///tmp/photo.jpg",
        "vehicle_gallery",
      );

      expect(result.error).toBe(
        "Only the vehicle owner can add gallery photos",
      );
      expect(mockStorageFrom).not.toHaveBeenCalled();
    });
  });

  describe("stores the bucket path, not a public URL", () => {
    it("saves the path to the image row and the vehicle for a main photo", async () => {
      const result = await ImageUploadService.uploadVehicleImage(
        VEHICLE_ID,
        makeFile(),
        "vehicle_main",
      );

      expect(result.error).toBeNull();
      const uploadedPath = mockUpload.mock.calls[0][0] as string;
      const insert = calls.find(
        (c) => c.table === "vehicle_images" && c.method === "insert",
      );
      const vehicleUpdate = calls.find(
        (c) => c.table === "vehicles" && c.method === "update",
      );
      expect((insert!.args[0] as any).image_url).toBe(uploadedPath);
      expect((vehicleUpdate!.args[0] as any).main_image_url).toBe(uploadedPath);
      expect(mockGetPublicUrl).not.toHaveBeenCalled();
    });

    it("saves the path to the image row for a gallery photo", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: OWNER_ID } },
        error: null,
      });

      await ImageUploadService.uploadVehicleImage(VEHICLE_ID, makeFile());

      const uploadedPath = mockUpload.mock.calls[0][0] as string;
      const insert = calls.find(
        (c) => c.table === "vehicle_images" && c.method === "insert",
      );
      expect((insert!.args[0] as any).image_url).toBe(uploadedPath);
      expect(mockGetPublicUrl).not.toHaveBeenCalled();
    });

    it("saves and returns the path for an avatar upload", async () => {
      const result = await ImageUploadService.uploadProfileAvatar(makeFile());

      const uploadedPath = mockUpload.mock.calls[0][0] as string;
      expect(uploadedPath).toMatch(new RegExp(`^${MEMBER_ID}/avatar_`));
      expect(result.data).toBe(uploadedPath);
      const update = calls.find(
        (c) => c.table === "profiles" && c.method === "update",
      );
      expect((update!.args[0] as any).avatar_url).toBe(uploadedPath);
      expect(mockGetPublicUrl).not.toHaveBeenCalled();
    });
  });

  describe("deletes a stored path or a legacy URL", () => {
    it("removes the object for a stored vehicle image path", async () => {
      const result = await ImageUploadService.deleteVehicleImage("image-1");

      expect(result.error).toBeNull();
      expect(mockRemove).toHaveBeenCalledWith([
        `${OWNER_ID}/vehicle_${VEHICLE_ID}_1.jpg`,
      ]);
    });

    it("removes the object for a legacy vehicle image URL, in the owner's folder", async () => {
      storedImageRow.image_url = `${HOST}/storage/v1/object/public/vehicle-images/${OWNER_ID}/vehicle_${VEHICLE_ID}_1.jpg?t=1`;

      const result = await ImageUploadService.deleteVehicleImage("image-1");

      expect(result.error).toBeNull();
      expect(mockRemove).toHaveBeenCalledWith([
        `${OWNER_ID}/vehicle_${VEHICLE_ID}_1.jpg`,
      ]);
    });

    it("removes the object for a stored avatar path and clears the column", async () => {
      const result = await ImageUploadService.deleteProfileAvatar();

      expect(result.error).toBeNull();
      expect(mockRemove).toHaveBeenCalledWith([`${MEMBER_ID}/avatar_1.jpg`]);
      const update = calls.find(
        (c) => c.table === "profiles" && c.method === "update",
      );
      expect((update!.args[0] as any).avatar_url).toBeNull();
    });

    it("removes the object for a legacy avatar URL", async () => {
      storedAvatarUrl = `${HOST}/storage/v1/object/public/profile-avatars/${MEMBER_ID}/avatar_1.jpg?t=2`;

      const result = await ImageUploadService.deleteProfileAvatar();

      expect(result.error).toBeNull();
      expect(mockRemove).toHaveBeenCalledWith([`${MEMBER_ID}/avatar_1.jpg`]);
    });

    it("clears the column but removes nothing for an external avatar", async () => {
      storedAvatarUrl = "https://lh3.googleusercontent.com/a/abc=s96-c";

      const result = await ImageUploadService.deleteProfileAvatar();

      expect(result.error).toBeNull();
      expect(mockRemove).not.toHaveBeenCalled();
      const update = calls.find(
        (c) => c.table === "profiles" && c.method === "update",
      );
      expect((update!.args[0] as any).avatar_url).toBeNull();
    });
  });
});
