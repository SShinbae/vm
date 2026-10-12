jest.mock("react-native", () => ({ Platform: { OS: "web" } }));

import { rememberNext, safeNext } from "@/lib/utils/safeNext";

describe("safeNext", () => {
  it.each([
    ["/account/delete", "/account/delete"],
    ["/groups/abc?x=1", "/groups/abc?x=1"],
  ])("accepts in-app path %s", (input, out) => {
    expect(safeNext(input)).toBe(out);
  });

  it.each([
    ["//evil.com"],
    ["https://evil.com"],
    ["/\\evil.com"],
    ["javascript:alert(1)"],
    [""],
    [undefined],
    [["/a", "/b"]],
  ])("rejects %p", (input) => {
    expect(safeNext(input)).toBeNull();
  });
});

describe("rememberNext (web)", () => {
  it("clears a stale value when called with null", () => {
    const store: Record<string, string> = {};
    (global as any).window = {
      sessionStorage: {
        setItem: (k: string, v: string) => (store[k] = v),
        removeItem: (k: string) => delete store[k],
        getItem: (k: string) => store[k] ?? null,
      },
    };
    rememberNext("/account/delete");
    expect(store.postLoginNext).toBe("/account/delete");
    rememberNext(null);
    expect(store.postLoginNext).toBeUndefined();
    delete (global as any).window;
  });
});
