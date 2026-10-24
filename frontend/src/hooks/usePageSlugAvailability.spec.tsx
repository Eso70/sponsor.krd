import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api/request";
import { usePageSlugAvailability } from "./usePageSlugAvailability";
vi.mock("@/lib/api/request", () => ({ apiRequest: vi.fn() }));
beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(apiRequest).mockReset();
});
afterEach(() => vi.useRealTimers());
describe("manual page slug availability", () => {
  it.each(["/api/linktrees/check-slug", "/api/platform/linktrees/check-slug"])(
    "debounces owner-scoped checks at %s and accepts the unchanged URL locally",
    async (endpoint) => {
      vi.mocked(apiRequest).mockResolvedValue(true);
      const { result, rerender } = renderHook(
        ({ slug }) =>
          usePageSlugAvailability(endpoint, slug, {
            enabled: true,
            excludeId: "page-id",
            initialSlug: "original-page",
          }),
        { initialProps: { slug: "original-page" } },
      );
      expect(result.current.status).toBe("available");
      await act(() => vi.advanceTimersByTimeAsync(350));
      expect(apiRequest).not.toHaveBeenCalled();
      rerender({ slug: "manual-page" });
      expect(result.current.status).toBe("checking");
      await act(() => vi.advanceTimersByTimeAsync(350));
      expect(apiRequest).toHaveBeenCalledWith(
        `${endpoint}?slug=manual-page&excludeId=page-id`,
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
      expect(result.current.status).toBe("available");
      rerender({ slug: "" });
      expect(result.current.status).toBe("idle");
      rerender({ slug: "bad slug" });
      expect(result.current.status).toBe("invalid");
    },
  );
  it("ignores stale responses and supports retry after failed checks", async () => {
    let resolveOld!: (value: boolean) => void;
    vi.mocked(apiRequest)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOld = resolve;
          }),
      )
      .mockResolvedValueOnce(false)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(true);
    const { result, rerender } = renderHook(
      ({ slug }) =>
        usePageSlugAvailability("/api/linktrees/check-slug", slug, {
          enabled: true,
        }),
      { initialProps: { slug: "old-page" } },
    );
    await act(() => vi.advanceTimersByTimeAsync(350));
    rerender({ slug: "taken-page" });
    await act(() => vi.advanceTimersByTimeAsync(350));
    await act(async () => resolveOld(true));
    expect(result.current.status).toBe("taken");
    rerender({ slug: "other-page" });
    await act(() => vi.advanceTimersByTimeAsync(350));
    expect(result.current.status).toBe("error");
    act(() => result.current.retry());
    await act(() => vi.advanceTimersByTimeAsync(350));
    expect(result.current.status).toBe("available");
  });
});
