import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formsApi } from "./api";
import { useFormTitleAvailability } from "./use-form-title-availability";
vi.mock("./api", () => ({ formsApi: { titleAvailability: vi.fn() } }));
beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(formsApi.titleAvailability).mockReset();
});
afterEach(() => vi.useRealTimers());
describe("form title availability", () => {
  it.each(["business", "platform"] as const)(
    "debounces %s checks and excludes the edited form",
    async (scope) => {
      vi.mocked(formsApi.titleAvailability).mockResolvedValue({
        slug: "new-title",
        available: true,
      });
      const { result, rerender } = renderHook(
        ({ title }) => useFormTitleAvailability(scope, title, "form-id"),
        { initialProps: { title: "" } },
      );
      expect(result.current.status).toBe("idle");
      rerender({ title: " New title " });
      expect(result.current.status).toBe("checking");
      await act(() => vi.advanceTimersByTimeAsync(350));
      expect(formsApi.titleAvailability).toHaveBeenCalledWith(
        scope,
        "New title",
        "form-id",
        expect.any(AbortSignal),
      );
      expect(result.current).toMatchObject({
        status: "available",
        slug: "new-title",
      });
    },
  );
  it("ignores a late successful response after the title changes and allows retry on failure", async () => {
    let resolveOld!: (value: { slug: string; available: boolean }) => void;
    vi.mocked(formsApi.titleAvailability)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOld = resolve;
          }),
      )
      .mockResolvedValueOnce({ slug: "taken", available: false })
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ slug: "other", available: true });
    const { result, rerender } = renderHook(
      ({ title }) => useFormTitleAvailability("business", title),
      { initialProps: { title: "Old" } },
    );
    await act(() => vi.advanceTimersByTimeAsync(350));
    rerender({ title: "Taken" });
    await act(() => vi.advanceTimersByTimeAsync(350));
    await act(async () => resolveOld({ slug: "old", available: true }));
    expect(result.current.status).toBe("taken");
    rerender({ title: "Other" });
    await act(() => vi.advanceTimersByTimeAsync(350));
    expect(result.current.status).toBe("error");
    act(() => result.current.retry());
    await act(() => vi.advanceTimersByTimeAsync(350));
    expect(result.current.status).toBe("available");
  });
});
