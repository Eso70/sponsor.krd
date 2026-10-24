import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePagePinning } from "./use-page-pinning";

const request = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/request", () => ({ apiRequest: request }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

afterEach(() => vi.clearAllMocks());
describe.each([
  "/api/forms",
  "/api/platform/forms",
  "/api/linktrees",
  "/api/platform/linktrees",
])("page pinning at %s", (base) => {
  it("persists the requested state before updating the collection", async () => {
    let finish!: () => void;
    request.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const saved = vi.fn();
    const { result } = renderHook(() => usePagePinning(base, "en", saved));
    let operation!: Promise<void>;
    act(() => {
      operation = result.current.toggle("page", true);
    });
    expect(result.current.pending.has("page")).toBe(true);
    expect(saved).not.toHaveBeenCalled();
    await act(async () => {
      await result.current.toggle("page", true);
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(`${base}/page/pin`, {
      method: "PATCH",
      json: { isPinned: true },
    });
    await act(async () => {
      finish();
      await operation;
    });
    expect(saved).toHaveBeenCalledWith("page", true);
    expect(result.current.pending.size).toBe(0);
  });

  it("keeps the saved collection unchanged on failure and allows retry", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    request
      .mockRejectedValueOnce(new Error("Unavailable"))
      .mockResolvedValueOnce({});
    const saved = vi.fn();
    const { result } = renderHook(() => usePagePinning(base, "ar", saved));
    await act(async () => {
      await result.current.toggle("page", false);
    });
    expect(saved).not.toHaveBeenCalled();
    expect(result.current.pending.size).toBe(0);
    await act(async () => {
      await result.current.toggle("page", false);
    });
    expect(saved).toHaveBeenCalledWith("page", false);
    log.mockRestore();
  });
});
