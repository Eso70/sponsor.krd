import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSubdomainAvailability } from "./use-subdomain-availability";

const { check } = vi.hoisted(() => ({ check: vi.fn() }));
vi.mock("./api", () => ({ checkSignupSubdomain: check }));

describe("signup subdomain availability", () => {
  beforeEach(() => { check.mockReset(); vi.useFakeTimers(); });
  afterEach(() => vi.useRealTimers());

  it("does not let an old successful request overwrite a newer blocked name", async () => {
    let resolveOld!: (result: { reason: string }) => void;
    check.mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }))
      .mockResolvedValueOnce({ reason: "blocked" });
    const { result, rerender } = renderHook(({ value }) => useSubdomainAvailability(value), { initialProps: { value: "old-name" } });
    await act(async () => { await vi.advanceTimersByTimeAsync(350); });
    rerender({ value: "blocked-name" });
    expect(result.current.status).toBe("checking");
    expect(check.mock.calls[0][1].aborted).toBe(true);
    await act(async () => { await vi.advanceTimersByTimeAsync(350); });
    expect(result.current).toEqual({ status: "blocked", available: false });
    await act(async () => { resolveOld({ reason: "available" }); });
    expect(result.current.status).toBe("blocked");
  });

  it("clears the result when emptied or changed to an invalid label", async () => {
    check.mockResolvedValue({ reason: "available" });
    const { result, rerender } = renderHook(({ value }) => useSubdomainAvailability(value), { initialProps: { value: "free-name" } });
    await act(async () => { await vi.advanceTimersByTimeAsync(350); });
    expect(result.current.available).toBe(true);
    rerender({ value: "" });
    expect(result.current).toEqual({ status: "idle", available: null });
    rerender({ value: "bad-" });
    expect(result.current).toEqual({ status: "invalid", available: false });
    expect(check).toHaveBeenCalledTimes(1);
  });

  it("shows lookup failures separately from an unavailable name", async () => {
    check.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useSubdomainAvailability("some-name"));
    await act(async () => { await vi.advanceTimersByTimeAsync(350); });
    expect(result.current).toEqual({ status: "error", available: false });
  });
});
