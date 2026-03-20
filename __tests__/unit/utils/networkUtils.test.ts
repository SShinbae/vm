/**
 * Network Utils Tests
 *
 * Tests for timeout, retry, and promise utility functions.
 */

import {
  withTimeout,
  safePromiseAll,
  withRetry,
  isFulfilled,
  isRejected,
} from "@/lib/utils/networkUtils";

describe("withTimeout", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should resolve before timeout returns value", async () => {
    const promise = Promise.resolve("success");
    const result = await withTimeout(promise, 5000);
    expect(result).toBe("success");
  });

  it("should reject after timeout with correct message", async () => {
    const neverResolves = new Promise<string>(() => {});
    const resultPromise = withTimeout(neverResolves, 3000);

    jest.advanceTimersByTime(3000);

    await expect(resultPromise).rejects.toThrow("Request timeout after 3000ms");
  });

  it("should use default timeout of 10000ms", async () => {
    const neverResolves = new Promise<string>(() => {});
    const resultPromise = withTimeout(neverResolves);

    jest.advanceTimersByTime(9999);
    // Should not have rejected yet

    jest.advanceTimersByTime(1);
    await expect(resultPromise).rejects.toThrow(
      "Request timeout after 10000ms",
    );
  });

  it("should support custom timeout", async () => {
    const neverResolves = new Promise<string>(() => {});
    const resultPromise = withTimeout(neverResolves, 500);

    jest.advanceTimersByTime(500);

    await expect(resultPromise).rejects.toThrow("Request timeout after 500ms");
  });
});

describe("safePromiseAll", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should return all fulfilled when all succeed", async () => {
    const promises = [
      Promise.resolve("a"),
      Promise.resolve("b"),
      Promise.resolve("c"),
    ];
    const results = await safePromiseAll(promises);
    expect(results).toHaveLength(3);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
  });

  it("should still fulfill others when one fails", async () => {
    const promises = [
      Promise.resolve("a"),
      Promise.reject(new Error("fail")),
      Promise.resolve("c"),
    ];
    const results = await safePromiseAll(promises);
    expect(results).toHaveLength(3);
    expect(results[0].status).toBe("fulfilled");
    expect(results[1].status).toBe("rejected");
    expect(results[2].status).toBe("fulfilled");
  });

  it("should return all rejected when all fail", async () => {
    const promises = [
      Promise.reject(new Error("fail1")),
      Promise.reject(new Error("fail2")),
    ];
    const results = await safePromiseAll(promises);
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.status === "rejected")).toBe(true);
  });

  it("should use default timeout of 8000ms", async () => {
    const neverResolves = [new Promise<string>(() => {})];
    const resultPromise = safePromiseAll(neverResolves);

    jest.advanceTimersByTime(8000);

    const results = await resultPromise;
    expect(results[0].status).toBe("rejected");
  });
});

describe("withRetry", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should succeed on first try", async () => {
    const factory = jest.fn().mockResolvedValue("success");
    const result = await withRetry(factory, 2, 8000, 100);
    expect(result).toBe("success");
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("should retry and succeed on second attempt", async () => {
    const factory = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("success");

    const resultPromise = withRetry(factory, 2, 8000, 100);

    // Advance past retry delay
    await jest.advanceTimersByTimeAsync(100);

    const result = await resultPromise;
    expect(result).toBe("success");
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("should exhaust maxRetries and throw last error", async () => {
    const factory = jest.fn().mockRejectedValue(new Error("always fails"));

    const resultPromise = withRetry(factory, 2, 8000, 100);

    // Attach rejection handler BEFORE advancing timers to avoid unhandled rejection
    const rejection = expect(resultPromise).rejects.toThrow("always fails");

    await jest.advanceTimersByTimeAsync(100);
    await jest.advanceTimersByTimeAsync(100);

    await rejection;
    expect(factory).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it("should respect custom maxRetries", async () => {
    const factory = jest.fn().mockRejectedValue(new Error("fail"));

    const resultPromise = withRetry(factory, 1, 8000, 50);

    // Attach rejection handler BEFORE advancing timers
    const rejection = expect(resultPromise).rejects.toThrow("fail");

    await jest.advanceTimersByTimeAsync(50);

    await rejection;
    expect(factory).toHaveBeenCalledTimes(2); // initial + 1 retry
  });
});

describe("isFulfilled", () => {
  it("should return true for fulfilled result", () => {
    const result: PromiseSettledResult<string> = {
      status: "fulfilled",
      value: "test",
    };
    expect(isFulfilled(result)).toBe(true);
  });

  it("should return false for rejected result", () => {
    const result: PromiseSettledResult<string> = {
      status: "rejected",
      reason: new Error("fail"),
    };
    expect(isFulfilled(result)).toBe(false);
  });
});

describe("isRejected", () => {
  it("should return true for rejected result", () => {
    const result: PromiseSettledResult<string> = {
      status: "rejected",
      reason: new Error("fail"),
    };
    expect(isRejected(result)).toBe(true);
  });

  it("should return false for fulfilled result", () => {
    const result: PromiseSettledResult<string> = {
      status: "fulfilled",
      value: "test",
    };
    expect(isRejected(result)).toBe(false);
  });
});
