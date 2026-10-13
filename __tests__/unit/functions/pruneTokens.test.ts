const mockSelect = jest.fn();
const mockLt = jest.fn(() => ({ select: mockSelect }));
const mockDelete = jest.fn(() => ({ lt: mockLt }));
const mockActorSelect = jest.fn();
const mockActorLt = jest.fn(() => ({ select: mockActorSelect }));
const mockActorDelete = jest.fn(() => ({ lt: mockActorLt }));

jest.mock("@/netlify/functions/_shared/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: jest.fn((table: string) =>
      table === "log_change_actors"
        ? { delete: mockActorDelete }
        : { delete: mockDelete },
    ),
  },
}));

import { supabaseAdmin } from "@/netlify/functions/_shared/supabaseAdmin";
import {
  handler,
  STALE_TOKEN_DAYS,
} from "@/netlify/functions/prune-push-tokens";

const NOW = new Date("2026-10-08T03:00:00.000Z");

describe("prune-push-tokens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(NOW);
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockActorSelect.mockResolvedValue({ data: [], error: null });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("deletes tokens not refreshed for 60 days and returns the count", async () => {
    mockSelect.mockResolvedValue({
      data: [{ id: "a" }, { id: "b" }],
      error: null,
    });

    const res = await handler({} as never, {} as never);

    expect(STALE_TOKEN_DAYS).toBe(60);
    expect(supabaseAdmin.from).toHaveBeenCalledWith("push_tokens");
    expect(mockLt).toHaveBeenCalledWith(
      "updated_at",
      "2026-08-09T03:00:00.000Z",
    );
    expect(res).toEqual({
      statusCode: 200,
      body: JSON.stringify({ pruned: 2 }),
    });
  });

  it("returns 0 when nothing is stale", async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });
    const res = await handler({} as never, {} as never);
    expect(res).toEqual({
      statusCode: 200,
      body: JSON.stringify({ pruned: 0 }),
    });
  });

  it("returns 500 when the delete fails", async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: "db down" } });
    const res = await handler({} as never, {} as never);
    expect(res).toMatchObject({ statusCode: 500 });
  });

  it("also deletes log change actors older than 1 day", async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });
    await handler({} as never, {} as never);

    expect(supabaseAdmin.from).toHaveBeenCalledWith("log_change_actors");
    expect(mockActorLt).toHaveBeenCalledWith(
      "created_at",
      "2026-10-07T03:00:00.000Z",
    );
  });

  it("a token delete error still runs the actor cleanup", async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: "db down" } });
    const res = await handler({} as never, {} as never);
    expect(res).toMatchObject({ statusCode: 500 });
    expect(mockActorLt).toHaveBeenCalledWith(
      "created_at",
      "2026-10-07T03:00:00.000Z",
    );
  });

  it("a failing actor cleanup does not fail token pruning", async () => {
    mockSelect.mockResolvedValue({ data: [{ id: "a" }], error: null });
    mockActorSelect.mockResolvedValue({ error: { message: "boom" } });
    const res = await handler({} as never, {} as never);
    expect(res).toEqual({
      statusCode: 200,
      body: JSON.stringify({ pruned: 1 }),
    });
  });
});
