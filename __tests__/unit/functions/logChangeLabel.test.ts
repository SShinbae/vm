jest.mock("@/netlify/functions/_shared/supabaseAdmin", () => ({
  supabaseAdmin: { from: jest.fn() },
}));

import { logChangeLabel } from "@/netlify/functions/send-push-notification";

describe("logChangeLabel", () => {
  it.each([
    ["fuel_logs", "fuel log"],
    ["mileage_logs", "mileage log"],
    ["service_logs", "service log"],
  ])("labels %s as '%s'", (table, label) => {
    expect(logChangeLabel(table)).toBe(label);
  });
});
