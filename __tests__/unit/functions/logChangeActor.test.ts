// The person who made a log change is recorded in log_change_actors by the
// zz_record_log_change_actor trigger. Pushes must credit that person, not the
// log's creator (record.user_id).
import { handleLogChange } from "@/netlify/functions/send-push-notification";

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
  q.maybeSingle = () => Promise.resolve(mockResults[table]);
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

describe("log change pushes credit the person who acted", () => {
  beforeEach(() => {
    mockCalls.length = 0;
    mockDeliver.mockReset().mockResolvedValue("sent");
    mockResults.vehicles = {
      data: { make: "Honda", model: "Civic", year: 2022 },
    };
    mockResults.vehicle_group_shares = { data: [{ group_id: "g1" }] };
    mockResults.group_members = {
      data: [{ user_id: "creatorA" }, { user_id: "m3" }],
    };
    mockResults.profiles = {
      data: { full_name: "Bea", email: "b@x.dev" },
    };
  });

  it("B deletes A's log: A is notified, B is excluded and named", async () => {
    mockResults.log_change_actors = { data: { actor: "editorB" } };
    await handleLogChange({
      type: "DELETE",
      table: "fuel_logs",
      schema: "public",
      record: null as never,
      old_record: { id: "l1", vehicle_id: "v1", user_id: "creatorA" },
    } as never);

    expect(mockCalls).toContainEqual({
      table: "log_change_actors",
      method: "eq",
      args: ["row_id", "l1"],
    });
    expect(mockCalls).toContainEqual({
      table: "group_members",
      method: "neq",
      args: ["user_id", "editorB"],
    });
    expect(mockCalls).toContainEqual({
      table: "profiles",
      method: "eq",
      args: ["id", "editorB"],
    });
    expect(mockDeliver.mock.calls[0][0].body).toMatch(
      /^Bea deleted a fuel log/,
    );
    expect(mockDeliver.mock.calls[0][0].data.performedBy).toBe("editorB");
  });

  it("no actor row: falls back to the creator", async () => {
    mockResults.log_change_actors = { data: null };
    await handleLogChange({
      type: "UPDATE",
      table: "fuel_logs",
      schema: "public",
      record: { id: "l2", vehicle_id: "v1", user_id: "creatorA" },
    } as never);
    expect(mockCalls).toContainEqual({
      table: "group_members",
      method: "neq",
      args: ["user_id", "creatorA"],
    });
  });

  it("null actor (system change): falls back to the creator", async () => {
    mockResults.log_change_actors = { data: { actor: null } };
    await handleLogChange({
      type: "UPDATE",
      table: "fuel_logs",
      schema: "public",
      record: { id: "l3", vehicle_id: "v1", user_id: "creatorA" },
    } as never);
    expect(mockCalls).toContainEqual({
      table: "group_members",
      method: "neq",
      args: ["user_id", "creatorA"],
    });
  });
});
