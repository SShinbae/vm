import { parseVerifiedRedirect } from "@/lib/utils/authRedirect";

describe("parseVerifiedRedirect", () => {
  it("treats a PKCE code or implicit access_token as already verified", () => {
    expect(parseVerifiedRedirect("?code=abc", "")).toEqual({
      status: "verified",
    });
    expect(
      parseVerifiedRedirect("", "#access_token=t&refresh_token=r&type=signup"),
    ).toEqual({ status: "verified" });
  });

  it("surfaces Supabase's error description from query or hash", () => {
    expect(
      parseVerifiedRedirect(
        "?error=access_denied&error_description=Email+link+is+invalid+or+has+expired",
        "",
      ),
    ).toEqual({
      status: "error",
      message: "Email link is invalid or has expired",
    });
    expect(
      parseVerifiedRedirect(
        "",
        "#error=access_denied&error_description=Expired",
      ),
    ).toEqual({ status: "error", message: "Expired" });
  });

  it("returns null when the URL carries no Supabase redirect", () => {
    expect(parseVerifiedRedirect("", "")).toBeNull();
  });
});
