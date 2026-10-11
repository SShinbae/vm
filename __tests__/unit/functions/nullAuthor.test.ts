// Logs whose author deleted their account have user_id NULL. Family members
// can still edit them; the push path must not filter or look up a null author.
const mockCalls: { table: string; method: string; args: unknown[] }[] = [];
const mockResults: Record<string, unknown> = {};

function mockChain(table: string) {
  const q: any = {};
  for (const m of [
    "select",
    "eq",
    "neq",
    "in",
    "not",
    "or",
    "gte",
    "gt",
    "order",
    "limit",
  ]) {
    q[m] = (...args: unknown[]) => {
      mockCalls.push({ table, method: m, args });
      return q;
    };
  }
  q.single = () => Promise.resolve(mockResults[table]);
  q.then = (resolve: any, reject: any) =>
    Promise.resolve(mockResults[table]).then(resolve, reject);
  return q;
}

jest.mock("@/netlify/functions/_shared/supabaseAdmin", () => ({
  supabaseAdmin: { from: (t: string) => mockChain(t) },
}));
const mockDeliver = jest.fn();
jest.mock("@/netlify/functions/_shared/notifications", () => ({
  ...jest.requireActual("@/netlify/functions/_shared/notifications"),
  deliverNotification: (...a: unknown[]) => mockDeliver(...a),
}));

import { handleLogChange } from "@/netlify/functions/send-push-notification";
import { handler as checkReminders } from "@/netlify/functions/check-reminders";
import { handler as checkCostAlerts } from "@/netlify/functions/check-cost-alerts";

describe("logs with a deleted author (user_id NULL)", () => {
  beforeEach(() => {
    mockCalls.length = 0;
    mockDeliver.mockReset().mockResolvedValue("sent");
    mockResults.vehicles = {
      data: { make: "Honda", model: "Civic", year: 2022 },
    };
    mockResults.vehicle_group_shares = { data: [{ group_id: "g1" }] };
    mockResults.group_members = {
      data: [{ user_id: "m1" }, { user_id: "m2" }],
    };
    mockResults.profiles = { data: null };
  });

  it("notifies every member and never filters or looks up a null author", async () => {
    await handleLogChange({
      type: "UPDATE",
      table: "service_logs",
      schema: "public",
      record: { id: "l1", vehicle_id: "v1", user_id: null },
      old_record: { id: "l1", vehicle_id: "v1", user_id: null },
    } as never);

    expect(mockCalls.some((c) => c.method === "neq" && c.args[1] == null)).toBe(
      false,
    );
    expect(mockCalls.some((c) => c.table === "profiles")).toBe(false);
    expect(mockDeliver).toHaveBeenCalledTimes(2); // m1 and m2
    expect(mockDeliver.mock.calls[0][0].body).toMatch(
      /^Someone updated a service log/,
    );
  });

  it("still excludes and names a known author", async () => {
    mockResults.profiles = { data: { full_name: "Ahnaf", email: "a@x.dev" } };
    await handleLogChange({
      type: "INSERT",
      table: "fuel_logs",
      schema: "public",
      record: { id: "l2", vehicle_id: "v1", user_id: "author" },
    } as never);

    expect(mockCalls).toContainEqual({
      table: "group_members",
      method: "neq",
      args: ["user_id", "author"],
    });
    expect(mockDeliver.mock.calls[0][0].body).toMatch(
      /^Ahnaf added a fuel log/,
    );
  });
});

describe("scheduled jobs skip logs with no author", () => {
  beforeEach(() => {
    mockCalls.length = 0;
    mockResults.service_logs = { data: [], error: null };
    mockResults.fuel_logs = { data: [], error: null };
    mockResults.profiles = { data: [], error: null };
    mockResults.notification_preferences = { data: [], error: null };
  });

  const authorFilter = (table: string) =>
    mockCalls.filter(
      (c) =>
        c.table === table &&
        c.method === "not" &&
        c.args[0] === "user_id" &&
        c.args[1] === "is" &&
        c.args[2] === null,
    ).length;

  it("check-reminders never reads authorless service logs", async () => {
    await checkReminders({} as never, {} as never);
    expect(authorFilter("service_logs")).toBe(1);
  });

  it("check-cost-alerts never aggregates authorless fuel logs", async () => {
    await checkCostAlerts({} as never, {} as never);
    const fuelQueries = mockCalls.filter(
      (c) => c.table === "fuel_logs" && c.method === "select",
    ).length;
    expect(fuelQueries).toBeGreaterThan(0);
    expect(authorFilter("fuel_logs")).toBe(fuelQueries);
  });
});
