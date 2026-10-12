// account-deletion: auth, confirm text, fresh session, owned-group blocker,
// schedule idempotency, cancel, best-effort email.
const mockGetUser = jest.fn();
const mockSignOut = jest.fn();
const mockProfile = { current: null as null | Record<string, unknown> };
const mockProfileError = { current: null as null | { message: string } };
const mockUpdated = { current: [{ id: "u1" }] as unknown[] };
const mockOwnedGroups = { current: [] as unknown[] };
const mockUpdates: Record<string, unknown>[] = [];
const mockTokenDeletes: string[] = [];

jest.mock("@/netlify/functions/_shared/supabaseAdmin", () => ({
  supabaseAdmin: {
    auth: {
      getUser: (t: string) => mockGetUser(t),
      admin: { signOut: (...a: unknown[]) => mockSignOut(...a) },
    },
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: mockProfileError.current ? null : mockProfile.current,
                  error: mockProfileError.current,
                }),
            }),
          }),
          update: (row: Record<string, unknown>) => {
            mockUpdates.push(row);
            const q: any = {
              eq: () => q,
              gt: () => q,
              is: () => q,
              select: () =>
                Promise.resolve({ data: mockUpdated.current, error: null }),
              then: (resolve: any, reject: any) =>
                Promise.resolve({ error: null }).then(resolve, reject),
            };
            return q;
          },
        };
      }
      if (table === "groups") {
        return {
          select: () => ({
            eq: () =>
              Promise.resolve({ data: mockOwnedGroups.current, error: null }),
          }),
        };
      }
      if (table === "push_tokens") {
        return {
          delete: () => ({
            eq: (_c: string, v: string) => {
              mockTokenDeletes.push(v);
              return Promise.resolve({ error: null });
            },
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  },
}));

const mockSendEmail = jest.fn();
jest.mock("@/netlify/functions/_shared/email", () => ({
  ...jest.requireActual("@/netlify/functions/_shared/email"),
  sendBrevoEmail: (...a: unknown[]) => mockSendEmail(...a),
}));

import { handler, GRACE_DAYS } from "@/netlify/functions/account-deletion";

const NOW = new Date("2026-10-11T03:00:00.000Z");
const USER = {
  id: "u1",
  email: "ali@example.com",
  last_sign_in_at: "2026-10-11T01:00:00.000Z",
};

const call = (method: string, body?: unknown, token = "tok") =>
  handler(
    {
      httpMethod: method,
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body: body === undefined ? null : JSON.stringify(body),
    } as never,
    {} as never,
  ) as Promise<{ statusCode: number; body: string }>;

describe("account-deletion", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
    mockGetUser
      .mockReset()
      .mockResolvedValue({ data: { user: USER }, error: null });
    mockSignOut.mockReset().mockResolvedValue({ error: null });
    mockSendEmail.mockReset().mockResolvedValue(true);
    mockProfile.current = { full_name: "Ali", deletion_scheduled_at: null };
    mockProfileError.current = null;
    mockUpdated.current = [{ id: "u1" }];
    mockOwnedGroups.current = [];
    mockUpdates.length = 0;
    mockTokenDeletes.length = 0;
    jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("401 without a valid token, touching nothing", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "bad jwt" },
    });
    const res = await call("POST", { confirm: "DELETE" });
    expect(res.statusCode).toBe(401);
    expect(mockUpdates).toHaveLength(0);
  });

  it("401 with no Authorization header", async () => {
    const res = await call("POST", { confirm: "DELETE" }, "");
    expect(res.statusCode).toBe(401);
  });

  it("400 unless the body confirms with DELETE", async () => {
    expect((await call("POST", { confirm: "delete" })).statusCode).toBe(400);
    expect((await call("POST")).statusCode).toBe(400);
    expect(mockUpdates).toHaveLength(0);
  });

  it("403 REAUTH_REQUIRED when the last sign-in is older than 24h, before any write", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { ...USER, last_sign_in_at: "2026-10-09T03:00:00.000Z" } },
      error: null,
    });
    const res = await call("POST", { confirm: "DELETE" });
    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body).code).toBe("REAUTH_REQUIRED");
    expect(mockUpdates).toHaveLength(0);
  });

  it("409 listing owned groups that still have other members", async () => {
    mockOwnedGroups.current = [
      {
        id: "g1",
        name: "Family Fleet",
        group_members: [{ user_id: "u1" }, { user_id: "u2" }],
      },
      { id: "g2", name: "Solo", group_members: [{ user_id: "u1" }] },
    ];
    const res = await call("POST", { confirm: "DELETE" });
    expect(res.statusCode).toBe(409);
    expect(JSON.parse(res.body)).toEqual({
      code: "OWNS_GROUPS_WITH_MEMBERS",
      groups: [{ id: "g1", name: "Family Fleet" }],
    });
    expect(mockUpdates).toHaveLength(0);
  });

  it("schedules 30 days out, clears push tokens, signs out everywhere, emails", async () => {
    const res = await call("POST", { confirm: "DELETE" });
    const expected = new Date(
      NOW.getTime() + GRACE_DAYS * 86400000,
    ).toISOString();

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ scheduledFor: expected });
    expect(mockUpdates).toEqual([{ deletion_scheduled_at: expected }]);
    expect(mockTokenDeletes).toEqual(["u1"]);
    expect(mockSignOut).toHaveBeenCalledWith("tok", "others");
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail.mock.calls[0][0].to).toEqual([
      { email: "ali@example.com", name: "Ali" },
    ]);
  });

  it("is idempotent: a second POST returns the existing date, no writes, no email", async () => {
    mockProfile.current = {
      full_name: "Ali",
      deletion_scheduled_at: "2026-11-01T00:00:00.000Z",
    };
    const res = await call("POST", { confirm: "DELETE" });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({
      scheduledFor: "2026-11-01T00:00:00.000Z",
    });
    expect(mockUpdates).toHaveLength(0);
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("still schedules when the email fails", async () => {
    mockSendEmail.mockResolvedValue(false);
    const res = await call("POST", { confirm: "DELETE" });
    expect(res.statusCode).toBe(200);
    expect(mockUpdates).toHaveLength(1);
  });

  it("DELETE cancels a pending deletion and emails", async () => {
    mockProfile.current = {
      full_name: "Ali",
      deletion_scheduled_at: "2026-11-01T00:00:00.000Z",
    };
    const res = await call("DELETE");
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ cancelled: true });
    expect(mockUpdates).toEqual([{ deletion_scheduled_at: null }]);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });

  it("DELETE after the deletion date has passed is refused (purge may be running)", async () => {
    mockProfile.current = {
      full_name: "Ali",
      deletion_scheduled_at: "2026-10-10T00:00:00.000Z",
    };
    const res = await call("DELETE");
    expect(res.statusCode).toBe(409);
    expect(JSON.parse(res.body).code).toBe("DELETION_IN_PROGRESS");
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("DELETE that loses the race to the purge (no row updated) is refused", async () => {
    mockProfile.current = {
      full_name: "Ali",
      deletion_scheduled_at: "2026-11-01T00:00:00.000Z",
    };
    mockUpdated.current = [];
    const res = await call("DELETE");
    expect(res.statusCode).toBe(409);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("a failed profile read is an error, never a false 'nothing pending'", async () => {
    mockProfileError.current = { message: "connection reset" };
    expect((await call("DELETE")).statusCode).toBe(500);
    expect((await call("POST", { confirm: "DELETE" })).statusCode).toBe(500);
    expect(mockUpdates).toHaveLength(0);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("DELETE with nothing pending is a no-op", async () => {
    const res = await call("DELETE");
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ cancelled: false });
    expect(mockUpdates).toHaveLength(0);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("405 for other methods; OPTIONS answers CORS for the site origin", async () => {
    expect((await call("GET")).statusCode).toBe(405);
    const pre = (await handler(
      {
        httpMethod: "OPTIONS",
        headers: { origin: "http://localhost:8081" },
        body: null,
      } as never,
      {} as never,
    )) as { statusCode: number; headers: Record<string, string> };
    expect(pre.statusCode).toBe(204);
    expect(pre.headers["Access-Control-Allow-Origin"]).toBe(
      "http://localhost:8081",
    );
    const evil = (await handler(
      {
        httpMethod: "OPTIONS",
        headers: { origin: "https://evil.example" },
        body: null,
      } as never,
      {} as never,
    )) as { headers: Record<string, string> };
    expect(evil.headers["Access-Control-Allow-Origin"]).toBeUndefined();
  });
});
