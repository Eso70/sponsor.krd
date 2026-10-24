import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getBusinesses, type BusinessListPage } from "../api/businesses";
import { useBusinesses } from "./useBusinesses";

vi.mock("../api/businesses", () => ({ getBusinesses: vi.fn() }));
afterEach(() => vi.resetAllMocks());
const directory = (total: number): BusinessListPage => ({
  items: [], pagination: { page: 1, limit: 20, total, totalPages: 1 },
  summary: { total, active: total, suspended: 0, pendingApplications: 0, totalApplications: 0, activeInvitations: 0 },
});

describe("business directory truthfulness", () => {
  it("keeps the newer search summary when an older request finishes last", async () => {
    let resolveOlder!: (value: BusinessListPage) => void;
    let resolveNewer!: (value: BusinessListPage) => void;
    vi.mocked(getBusinesses).mockImplementationOnce(() => new Promise((resolve) => { resolveOlder = resolve; }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveNewer = resolve; }));
    const unauthorized = vi.fn();
    const { result } = renderHook(() => useBusinesses(unauthorized));
    await waitFor(() => expect(getBusinesses).toHaveBeenCalledTimes(1));
    act(() => result.current.setSearch("new"));
    await waitFor(() => expect(getBusinesses).toHaveBeenCalledTimes(2));
    await act(async () => resolveNewer(directory(2)));
    await act(async () => resolveOlder(directory(9)));
    expect(result.current.summary.total).toBe(2);
    expect(result.current.pagination.total).toBe(2);
    expect(result.current.summaryUnavailable).toBe(false);
  });
  it("marks a failed request unavailable instead of reporting real zero totals", async () => {
    vi.mocked(getBusinesses).mockRejectedValue(new Error("Unavailable"));
    const unauthorized = vi.fn();
    const { result } = renderHook(() => useBusinesses(unauthorized));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.summaryUnavailable).toBe(true);
    expect(result.current.error).toBe("Unavailable");
  });
});
