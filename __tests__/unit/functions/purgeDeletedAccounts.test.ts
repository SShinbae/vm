// purge-deleted-accounts: due accounts only, transfer before purge, storage
// in batches, per-account isolation, final email.
const mockRpc = jest.fn();
const mockDeleteUser = jest.fn();
const mockRemove = jest.fn();
const mockDue = { current: [] as unknown[] };
const mockOwned: Record<string, unknown[]> = {};
const mockLte: unknown[] = [];
const mockOrder: unknown[] = [];
const mockLimit: unknown[] = [];

jest.mock("@/netlify/functions/_shared/supabaseAdmin", () => ({
  supabaseAdmin: {
    rpc: (...a: unknown[]) => mockRpc(...a),
    auth: { admin: { deleteUser: (id: string) => mockDeleteUser(id) } },
    storage: {
      from: (bucket: string) => ({
        remove: (names: string[]) => mockRemove(bucket, names),
      }),
    },
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            not: () => ({
              lte: (...a: unknown[]) => {
                mockLte.push(a);
                return {
                  order: (...o: unknown[]) => {
                    mockOrder.push(o);
                    return {
                      limit: (n: number) => {
                        mockLimit.push(n);
                        return Promise.resolve({
                          data: mockDue.current,
                          error: null,
                        });
                      },
                    };
                  },
                };
              },
            }),
          }),
        };
      }
      if (table === "groups") {
        return {
          select: () => ({
            eq: (_c: string, uid: string) =>
              Promise.resolve({ data: mockOwned[uid] || [], error: null }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  },
}));

const mockSendEmail = jest.fn().mockResolvedValue(true);
jest.mock("@/netlify/functions/_shared/email", () => ({
  ...jest.requireActual("@/netlify/functions/_shared/email"),
  sendBrevoEmail: (...a: unknown[]) => mockSendEmail(...a),
}));

import {
  handler,
  PURGE_BATCH,
  STORAGE_BATCH,
} from "@/netlify/functions/purge-deleted-accounts";

const NOW = new Date("2026-11-12T02:00:00.000Z");
const run = () =>
  handler({} as never, {} as never) as Promise<{
    statusCode: number;
    body: string;
  }>;

describe("purge-deleted-accounts", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
    mockRpc
      .mockReset()
      .mockImplementation((fn: string) =>
        Promise.resolve(
          fn === "account_storage_objects"
            ? { data: [], error: null }
            : { data: null, error: null },
        ),
      );
    mockDeleteUser.mockReset().mockResolvedValue({ error: null });
    mockRemove.mockReset().mockResolvedValue({ error: null });
    mockSendEmail.mockClear();
    mockDue.current = [];
    for (const k of Object.keys(mockOwned)) delete mockOwned[k];
    mockLte.length = 0;
    mockOrder.length = 0;
    mockLimit.length = 0;
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("selects only accounts whose deletion date has passed", async () => {
    await run();
    expect(mockLte).toEqual([["deletion_scheduled_at", NOW.toISOString()]]);
  });

  it("caps each run at PURGE_BATCH, oldest deletion date first", async () => {
    await run();
    expect(PURGE_BATCH).toBe(20);
    expect(mockOrder).toEqual([["deletion_scheduled_at", { ascending: true }]]);
    expect(mockLimit).toEqual([20]);
  });

  it("purges in order: transfer, purge data, storage, delete user, email", async () => {
    mockDue.current = [{ id: "u1", email: "a@x.dev", full_name: "Ali" }];
    mockOwned.u1 = [
      {
        id: "g1",
        group_members: [
          { user_id: "u1", joined_at: "2026-01-01" },
          { user_id: "u3", joined_at: "2026-03-01" },
          { user_id: "u2", joined_at: "2026-02-01" },
        ],
      },
      { id: "g2", group_members: [{ user_id: "u1", joined_at: "2026-01-01" }] },
    ];
    mockRpc.mockImplementation((fn: string) =>
      Promise.resolve(
        fn === "account_storage_objects"
          ? {
              data: [{ bucket_id: "profile-avatars", name: "u1/a.jpg" }],
              error: null,
            }
          : { data: null, error: null },
      ),
    );
    const order: string[] = [];
    mockRpc.mockImplementationOnce((fn: string, args: unknown) => {
      order.push(`${fn}:${JSON.stringify(args)}`);
      return Promise.resolve({ data: null, error: null });
    });
    const res = await run();

    expect(JSON.parse(res.body)).toEqual({ purged: 1, failed: 0 });
    expect(order[0]).toBe(
      'transfer_group_ownership_admin:{"p_group":"g1","p_from":"u1","p_to":"u2"}',
    );
    expect(mockRpc).toHaveBeenCalledWith("purge_account_data", {
      p_user: "u1",
    });
    expect(mockRemove).toHaveBeenCalledWith("profile-avatars", ["u1/a.jpg"]);
    expect(mockDeleteUser).toHaveBeenCalledWith("u1");
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const rpcNames = mockRpc.mock.calls.map((c) => c[0]);
    expect(rpcNames.indexOf("purge_account_data")).toBeLessThan(
      rpcNames.indexOf("account_storage_objects"),
    );
  });

  it("removes storage in batches of 100 per bucket", async () => {
    mockDue.current = [{ id: "u1", email: "a@x.dev", full_name: "" }];
    const objs = Array.from({ length: 250 }, (_, i) => ({
      bucket_id: "vehicle-images",
      name: `u1/${i}.jpg`,
    }));
    mockRpc.mockImplementation((fn: string) =>
      Promise.resolve(
        fn === "account_storage_objects"
          ? { data: objs, error: null }
          : { data: null, error: null },
      ),
    );
    await run();
    expect(STORAGE_BATCH).toBe(100);
    expect(mockRemove.mock.calls.map((c) => c[1].length)).toEqual([
      100, 100, 50,
    ]);
  });

  it("one failing account doesn't stop the others and isn't deleted", async () => {
    mockDue.current = [
      { id: "bad", email: "b@x.dev", full_name: "" },
      { id: "good", email: "g@x.dev", full_name: "" },
    ];
    mockRpc.mockImplementation((fn: string, args: { p_user?: string }) =>
      Promise.resolve(
        fn === "purge_account_data" && args.p_user === "bad"
          ? { data: null, error: { message: "boom" } }
          : fn === "account_storage_objects"
            ? { data: [], error: null }
            : { data: null, error: null },
      ),
    );
    const res = await run();
    expect(JSON.parse(res.body)).toEqual({ purged: 1, failed: 1 });
    expect(mockDeleteUser).toHaveBeenCalledWith("good");
    expect(mockDeleteUser).not.toHaveBeenCalledWith("bad");
  });
});
