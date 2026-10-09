// Supabase's default {{ .ConfirmationURL }} email link verifies the address on
// Supabase's /verify endpoint first, then redirects to /auth/confirm with
// ?code= (PKCE), #access_token= (implicit) or an error, instead of the
// token_hash our own template sends. Reaching here with code/access_token
// means the email is already confirmed.
export type VerifiedRedirect =
  | { status: "verified" }
  | { status: "error"; message: string }
  | null;

export function parseVerifiedRedirect(
  search: string,
  hash: string,
): VerifiedRedirect {
  const params = new URLSearchParams(search);
  new URLSearchParams(hash.replace(/^#/, "")).forEach((value, key) =>
    params.set(key, value),
  );

  const message = params.get("error_description");
  if (message) return { status: "error", message };
  if (params.has("code") || params.has("access_token")) {
    return { status: "verified" };
  }
  return null;
}
