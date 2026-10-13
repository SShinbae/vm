/**
 * ImageUploadService Tests
 *
 * Covers vehicle image uploads by the vehicle owner and by group members
 * the vehicle is shared with (main photo only).
 */

import { ImageUploadService } from "@/lib/services/imageUploadService";

const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockStorageFrom = jest.fn();

jest.mock("@/services/supabaseClient", () => ({
  supabase: {
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    from: (...args: unknown[]) => mockFrom(...args),
    storage: { from: (...args: unknown[]) => mockStorageFrom(...args) },
  },
}));

const OWNER_ID = "owner-id";
const MEMBER_ID = "member-id";
const VEHICLE_ID = "vehicle-1";

type Calls = { table: string; method: string; args: unknown[] }[];

let calls: Calls;
let vehicleUpdateError: { message: string; code?: string } | null;
let imageInsertError: { message: string } | null;
let deletedImageRow: boolean;

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
      return { data: [], error: null };
    });
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

  mockGetUser.mockResolvedValue({
    data: { user: { id: MEMBER_ID } },
    error: null,
  });
  mockFrom.mockImplementation((table: string) => routeTable(table));
  mockUpload.mockResolvedValue({ error: null });
  mockRemove.mockResolvedValue({ error: null });
  mockStorageFrom.mockReturnValue({
    upload: mockUpload,
    remove: mockRemove,
    getPublicUrl: jest.fn(() => ({
      data: { publicUrl: "https://test.url/photo.jpg" },
    })),
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
});
