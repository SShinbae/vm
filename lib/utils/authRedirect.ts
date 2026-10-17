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
  if (
    params.has("error") ||
    params.has("error_code") ||
    params.has("error_description")
  ) {
    return {
      status: "error",
      message:
        message ||
        "This link is invalid or has expired. Please request a new email.",
    };
  }
  if (params.has("code") || params.has("access_token")) {
    return { status: "verified" };
  }
  return null;
}
