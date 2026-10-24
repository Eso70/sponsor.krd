import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSelectedAnalytics } from "./clear-selected-analytics";
const request = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/request", () => ({ apiRequest: request }));
beforeEach(() => request.mockReset().mockResolvedValue({}));
describe("selected analytics requests", () => {
  it.each(["/api/linktrees", "/api/platform/linktrees", "/api/forms", "/api/platform/forms"])("only clears unique selected IDs in %s", async (base) => {
    await clearSelectedAnalytics(base, ["selected", "selected", "another"]);
    expect(request).toHaveBeenCalledTimes(2);
    expect(request).toHaveBeenCalledWith(`${base}/selected/analytics${base === "/api/linktrees" ? "/clear" : ""}`, { method: base === "/api/linktrees" ? "POST" : "DELETE" });
    expect(request).not.toHaveBeenCalledWith(`${base}/analytics`, expect.anything());
  });
  it("reports partial failure while still attempting the remaining pages", async () => {
    request.mockRejectedValueOnce(new Error("Denied"));
    await expect(clearSelectedAnalytics("/api/linktrees", ["denied", "allowed"])).rejects.toThrow("Some selected");
    expect(request).toHaveBeenCalledTimes(2);
  });
  it("does not call an API for an empty selection", async () => {
    await clearSelectedAnalytics("/api/linktrees", []);
    expect(request).not.toHaveBeenCalled();
  });
});
