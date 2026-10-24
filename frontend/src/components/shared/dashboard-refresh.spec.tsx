import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDashboardRefreshController } from "@/components/shared/dashboard-refresh";

describe("shared dashboard refresh coordinator", () => {
  it("refreshes only the current page after a registration is replaced or removed", async () => {
    const shared = vi.fn();
    const previous = vi.fn();
    const current = vi.fn();
    const { result } = renderHook(() => useDashboardRefreshController(shared));
    const removePrevious = result.current.register("page", previous);
    const removeCurrent = result.current.register("page", current);
    removePrevious();
    await act(async () => {
      await result.current.refresh();
    });
    expect(previous).not.toHaveBeenCalled();
    expect(current).toHaveBeenCalledOnce();
    removeCurrent();
    await act(async () => {
      await result.current.refresh();
    });
    expect(shared).toHaveBeenCalledTimes(2);
    expect(current).toHaveBeenCalledOnce();
  });
  it("refreshes shared and active-page data once when requests overlap", async () => {
    let releaseShared!: () => void;
    const shared = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          releaseShared = resolve;
        }),
    );
    const activePage = vi.fn();
    const { result } = renderHook(() => useDashboardRefreshController(shared));

    act(() => {
      result.current.register("active-page", activePage);
    });

    let first!: ReturnType<typeof result.current.refresh>;
    let second!: ReturnType<typeof result.current.refresh>;
    act(() => {
      first = result.current.refresh();
      second = result.current.refresh();
    });

    expect(second).toBe(first);
    expect(result.current.isRefreshing).toBe(true);
    await waitFor(() => {
      expect(shared).toHaveBeenCalledTimes(1);
      expect(activePage).toHaveBeenCalledTimes(1);
    });

    releaseShared();
    await act(async () => {
      await expect(first).resolves.toEqual({ attempted: 2, failed: 0 });
    });
    expect(result.current.isRefreshing).toBe(false);
  });

  it("counts synchronous and asynchronous failures without staying busy", async () => {
    const shared = vi.fn(() => {
      throw new Error("shared failure");
    });
    const activePage = vi.fn().mockRejectedValue(new Error("page failure"));
    const { result } = renderHook(() => useDashboardRefreshController(shared));

    act(() => {
      result.current.register("active-page", activePage);
    });

    await act(async () => {
      await expect(result.current.refresh()).resolves.toEqual({
        attempted: 2,
        failed: 2,
      });
    });
    expect(result.current.isRefreshing).toBe(false);
  });
});
