import { AccountDeletionService } from "@/lib/services/accountDeletionService";

const mockGetSession = jest.fn();
jest.mock("@/services/supabaseClient", () => ({
  supabase: { auth: { getSession: () => mockGetSession() } },
}));
jest.mock("@/lib/config", () => ({
  ...jest.requireActual("@/lib/config"),
  functionUrl: (n: string) => `https://fn.test/${n}`,
}));

const respond = (status: number, body: unknown) =>
  Promise.resolve({
    status,
    ok: status < 300,
    json: () => Promise.resolve(body),
  });

describe("AccountDeletionService", () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    global.fetch = fetchMock as never;
    fetchMock.mockReset();
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "tok" } },
    });
  });

  it("schedule sends the bearer token and DELETE confirmation", async () => {
    fetchMock.mockReturnValue(
      respond(200, { scheduledFor: "2026-11-10T00:00:00.000Z" }),
    );
    const r = await AccountDeletionService.schedule();
    expect(r).toEqual({
      kind: "scheduled",
      scheduledFor: "2026-11-10T00:00:00.000Z",
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://fn.test/account-deletion");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer tok");
    expect(JSON.parse(init.body)).toEqual({ confirm: "DELETE" });
  });

  it.each([
    [403, { code: "REAUTH_REQUIRED" }, { kind: "reauth" }],
    [
      409,
      { code: "OWNS_GROUPS_WITH_MEMBERS", groups: [{ id: "g", name: "F" }] },
      { kind: "blocked", groups: [{ id: "g", name: "F" }] },
    ],
    [500, { error: "boom" }, { kind: "error", message: "boom" }],
  ])("schedule maps %s", async (status, body, expected) => {
    fetchMock.mockReturnValue(respond(status, body));
    expect(await AccountDeletionService.schedule()).toEqual(expected);
  });

  it("no session is an error without calling the server", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    expect((await AccountDeletionService.schedule()).kind).toBe("error");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("network failure is an error", async () => {
    fetchMock.mockRejectedValue(new TypeError("Network request failed"));
    expect((await AccountDeletionService.schedule()).kind).toBe("error");
  });

  it.each([
    [200, { cancelled: true }, { kind: "cancelled" }],
    [200, { cancelled: false }, { kind: "not_pending" }],
    [409, { code: "DELETION_IN_PROGRESS" }, { kind: "in_progress" }],
  ])("cancel maps %s %j", async (status, body, expected) => {
    fetchMock.mockReturnValue(respond(status, body));
    expect(await AccountDeletionService.cancel()).toEqual(expected);
    expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
  });
});
