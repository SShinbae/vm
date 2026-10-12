import { functionUrl, resolveLocalHostUrl } from "@/lib/config";

describe("functionUrl", () => {
  it("uses the relative /api path on web so netlify.toml routes it", () => {
    expect(
      functionUrl("account-deletion", "web", "", "https://vm.wanahnaf.dev"),
    ).toBe("/api/account-deletion");
  });
  it("uses the site URL on native", () => {
    expect(
      functionUrl("account-deletion", "ios", "", "https://vm.wanahnaf.dev"),
    ).toBe("https://vm.wanahnaf.dev/api/account-deletion");
  });
  it("prefers the dev override on every platform", () => {
    const base = "http://localhost:8888/.netlify/functions";
    expect(functionUrl("account-deletion", "web", base, "x")).toBe(
      "http://localhost:8888/.netlify/functions/account-deletion",
    );
  });
});

describe("resolveLocalHostUrl", () => {
  it("points loopback hosts at the emulator's host alias on Android in dev", () => {
    expect(resolveLocalHostUrl("http://127.0.0.1:54321", "android", true)).toBe(
      "http://10.0.2.2:54321",
    );
    expect(
      resolveLocalHostUrl("http://localhost:54321/", "android", true),
    ).toBe("http://10.0.2.2:54321/");
  });

  it("leaves other platforms, production and remote URLs alone", () => {
    expect(resolveLocalHostUrl("http://127.0.0.1:54321", "ios", true)).toBe(
      "http://127.0.0.1:54321",
    );
    expect(
      resolveLocalHostUrl("http://127.0.0.1:54321", "android", false),
    ).toBe("http://127.0.0.1:54321");
    expect(
      resolveLocalHostUrl("https://abc.supabase.co", "android", true),
    ).toBe("https://abc.supabase.co");
    expect(
      resolveLocalHostUrl("http://localhost.example.com", "android", true),
    ).toBe("http://localhost.example.com");
  });
});
