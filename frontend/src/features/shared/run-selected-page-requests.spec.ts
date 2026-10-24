import { describe, expect, it, vi } from "vitest";
import {
  runSelectedPageRequests,
  SelectedPageRequestError,
} from "./run-selected-page-requests";

describe("selected page writes", () => {
  it("deduplicates IDs and never has more than five requests in flight", async () => {
    let active = 0,
      peak = 0;
    const request = vi.fn(async () => {
      active++;
      peak = Math.max(peak, active);
      await Promise.resolve();
      active--;
    });
    await runSelectedPageRequests(
      ["0", ...Array.from({ length: 12 }, (_, index) => String(index))],
      request,
      "Failed",
    );
    expect(request).toHaveBeenCalledTimes(12);
    expect(peak).toBe(5);
  });
  it("reports only failed IDs and still attempts later batches", async () => {
    const request = vi.fn(async (id: string) => {
      if (id === "2" || id === "6") throw new Error("Denied");
    });
    const result = runSelectedPageRequests(
      Array.from({ length: 7 }, (_, index) => String(index)),
      request,
      "Failed",
    );
    await expect(result).rejects.toMatchObject({ failedIds: ["2", "6"] });
    await expect(result).rejects.toBeInstanceOf(SelectedPageRequestError);
    expect(request).toHaveBeenCalledTimes(7);
  });
});
