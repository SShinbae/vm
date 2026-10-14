import { supabase } from "../../services/supabaseClient";

export type ImageBucket =
  | "profile-avatars"
  | "vehicle-images"
  | "receipt-images";

const LOCAL_URI_PREFIXES = [
  "file:",
  "content:",
  "ph:",
  "assets-library:",
  "blob:",
  "data:",
];

/** True for on-device URIs (a just-captured photo), which are never signed. */
export function isLocalUri(value: string): boolean {
  return LOCAL_URI_PREFIXES.some((prefix) => value.startsWith(prefix));
}

/**
 * Normalize a stored value to a bucket path. A public, sign or authenticated
 * storage URL for this bucket is stripped to its path (query dropped). Any
 * other value, including an external URL, is returned unchanged.
 */
export function toBucketPath(bucket: ImageBucket, value: string): string {
  const prefix = new RegExp(
    `^https?://[^/]+/storage/v1/object/(?:public|sign|authenticated)/${bucket}/`,
  );
  if (!prefix.test(value)) return value;
  return value.replace(prefix, "").split("?")[0];
}

/**
 * Public URL to render for a stored image value. Local URIs and external
 * https URLs are returned unchanged; anything else is a bucket path.
 */
export function storageImageUrl(
  bucket: "profile-avatars" | "vehicle-images",
  value?: string | null,
): string | undefined {
  if (!value) return undefined;
  if (isLocalUri(value) || /^https?:\/\//i.test(value)) return value;
  return supabase.storage.from(bucket).getPublicUrl(value).data.publicUrl;
}
