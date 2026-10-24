import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useBusinessAnalyticsTotals } from "./useBusinessAnalyticsTotals";

describe("useBusinessAnalyticsTotals", () => {
  afterEach(() => vi.restoreAllMocks());

  it("normalizes the summary response and can reset it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            total_views: 10,
            unique_views: 4,
            total_clicks: 3,
            unique_clicks: 2,
          },
        }),
      }),
    );
    const { result } = renderHook(() => useBusinessAnalyticsTotals("linktree"));

    await waitFor(() => expect(result.current.totals.total_views).toBe(10));
    expect(fetch).toHaveBeenCalledWith(
      "/api/analytics/v2/summary?pageType=linktree",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(result.current.totals).toMatchObject({
      unique_views: 4,
      unique_clicks: 2,
      conversions: 0,
    });
    expect(result.current.hasData).toBe(true);
    expect(result.current.isLoading).toBe(false);

    act(() => result.current.reset());
    expect(result.current.hasData).toBe(false);
    expect(result.current.totals.total_views).toBe(0);
  });

  it("does not load Linktree totals while another dashboard page is active", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() => useBusinessAnalyticsTotals("linktree", false));

    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("does not let a slow older refresh overwrite newer server totals", async () => {
    const finish: Array<(response: unknown) => void> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise((resolve) => finish.push(resolve))),
    );
    const { result } = renderHook(() =>
      useBusinessAnalyticsTotals("linktree", false),
    );
    let older!: Promise<void>;
    let newer!: Promise<void>;
    act(() => {
      older = result.current.refresh();
    });
    act(() => {
      newer = result.current.refresh();
    });
    const response = (views: number) => ({
      ok: true,
      json: async () => ({
        data: {
          total_views: views,
          unique_views: 4,
          total_clicks: 8,
          unique_clicks: 3,
          insights: { contactActions: 2 },
        },
      }),
    });
    await act(async () => {
      finish[1](response(20));
      await newer;
    });
    await act(async () => {
      finish[0](response(10));
      await older;
    });
    expect(result.current.totals.total_views).toBe(20);
    expect(result.current.totals.contact_actions).toBe(2);
    expect(result.current.isLoading).toBe(false);
  });
  it("marks missing summary data unavailable and recovers with real zero traffic on retry", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ data: null }) });
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useBusinessAnalyticsTotals("linktree"));
    await waitFor(() => expect(result.current.unavailable).toBe(true));
    expect(result.current.isLoading).toBe(false);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          total_views: 0,
          unique_views: 0,
          total_clicks: 0,
          unique_clicks: 0,
        },
      }),
    });
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.unavailable).toBe(false);
    expect(result.current.totals.total_views).toBe(0);
  });
});
