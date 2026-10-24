import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDeleteSelectedPages } from "./use-delete-selected-pages";
const request = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/request", () => ({ apiRequest: request }));
vi.mock("@/lib/utils/cache", () => ({ clearCachedData: vi.fn() }));
beforeEach(() => request.mockReset().mockResolvedValue({}));

describe("bulk page deletion", () => {
  it.each(["/api/linktrees", "/api/platform/linktrees", "/api/forms", "/api/platform/forms"])("uses only per-record deletes and refreshes %s", async (apiBase) => {
    const refresh = vi.fn(), select = vi.fn();
    const { result } = renderHook(() => useDeleteSelectedPages({ apiBase, enabled: true, refresh, onSelectionChange: select }));
    await act(async () => { await result.current.remove(["one", "../two", "one"]); });
    expect(request).toHaveBeenCalledTimes(2);
    expect(request).toHaveBeenCalledWith(`${apiBase}/one`, { method: "DELETE" });
    expect(request).toHaveBeenCalledWith(`${apiBase}/..%2Ftwo`, { method: "DELETE" });
    expect(select).toHaveBeenCalledWith([]);
    expect(refresh).toHaveBeenCalledOnce();
    expect(result.current.deleting).toBe(false);
  });
  it("refreshes partial results and keeps only failed records selected", async () => {
    request.mockRejectedValueOnce(new Error("Not authorized"));
    const refresh = vi.fn(), select = vi.fn();
    const { result } = renderHook(() => useDeleteSelectedPages({ apiBase: "/api/forms", enabled: true, refresh, onSelectionChange: select }));
    await act(async () => { await expect(result.current.remove(["denied", "allowed"])).rejects.toMatchObject({ failedIds: ["denied"] }); });
    expect(select).toHaveBeenCalledWith(["denied"]);
    expect(refresh).toHaveBeenCalledOnce();
    expect(result.current.deleting).toBe(false);
  });
  it("does not start a second batch while requests are pending", async () => {
    let finish!: () => void;
    request.mockReturnValue(new Promise<void>((resolve) => { finish = resolve; }));
    const { result } = renderHook(() => useDeleteSelectedPages({ apiBase: "/api/forms", enabled: true, refresh: vi.fn(), onSelectionChange: vi.fn() }));
    await act(async () => {
      const first = result.current.remove(["one"]);
      await expect(result.current.remove(["one"])).rejects.toThrow("unavailable");
      finish(); await first;
    });
    expect(request).toHaveBeenCalledOnce();
  });
  it("does not write when the capability is absent", async () => {
    const { result } = renderHook(() => useDeleteSelectedPages({ apiBase: "/api/forms", enabled: false, refresh: vi.fn(), onSelectionChange: vi.fn() }));
    await expect(result.current.remove(["one"])).rejects.toThrow("unavailable");
    expect(request).not.toHaveBeenCalled();
  });
});
