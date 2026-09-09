import { withOpacity } from "@/src/design-system";

describe("withOpacity", () => {
  it("converts supported hex colors and clamps opacity", () => {
    expect(withOpacity("#fff", 0.5)).toBe("rgba(255, 255, 255, 0.5)");
    expect(withOpacity("#1e292e", 2)).toBe("rgba(30, 41, 46, 1)");
    expect(withOpacity("#1e292eff", -1)).toBe("rgba(30, 41, 46, 0)");
  });

  it("leaves non-hex colors unchanged", () => {
    expect(withOpacity("transparent", 0.5)).toBe("transparent");
  });
});
