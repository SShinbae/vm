jest.mock("@/netlify/functions/_shared/supabaseAdmin", () => ({
  supabaseAdmin: {},
}));

import { applicableThresholds } from "@/netlify/functions/_shared/notifications";

describe("reminder thresholds", () => {
  it("returns crossed thresholds from widest to nearest", () => {
    expect(applicableThresholds(4200, [5000, 1000, 500])).toEqual([5000]);
    expect(applicableThresholds(800, [5000, 1000, 500])).toEqual([5000, 1000]);
    expect(applicableThresholds(0, [5000, 1000, 500])).toEqual([0]);
    expect(applicableThresholds(-1, [5000, 1000, 500])).toEqual([0]);
  });
});
