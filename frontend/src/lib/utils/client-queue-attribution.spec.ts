import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalUrl = window.location.href;
function storage(): Storage {
  const values = new Map<string, string>();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); },
    removeItem: key => { values.delete(key); }, clear: () => values.clear(), key: index => [...values.keys()][index] ?? null,
    get length() { return values.size; } };
}
beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal("sessionStorage", storage());
  vi.stubGlobal("localStorage", storage());
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", originalUrl);
});
const visit = (path: string) => window.history.replaceState({}, "", path);

describe("TikTok ad click attribution", () => {
  it.each(["form", "linktree"])("retains the click across public %s navigation and document reloads", async type => {
    const { getAnalyticsAttribution } = await import("./client-queue");
    visit(`/${type}/landing?ttclid=real-ad-click`);
    expect(getAnalyticsAttribution().ttclid).toBe("real-ad-click");
    visit("/form/next");
    expect(getAnalyticsAttribution()).toMatchObject({ ttclid: "real-ad-click", pageUrl: expect.stringContaining("/form/next") });
    expect(window.location.search).toBe("");
    vi.resetModules();
    expect((await import("./client-queue")).getAnalyticsAttribution().ttclid).toBe("real-ad-click");
  });
  it("uses the latest actual ad click and expires it with the analytics session", async () => {
    vi.useFakeTimers();
    const { getAnalyticsAttribution } = await import("./client-queue");
    visit("/form/landing?ttclid=first");
    getAnalyticsAttribution();
    visit("/linktree/landing?ttclid=second");
    expect(getAnalyticsAttribution().ttclid).toBe("second");
    visit("/form/next");
    expect(getAnalyticsAttribution().ttclid).toBe("second");
    vi.setSystemTime(Date.now() + 31 * 60 * 1000);
    expect(getAnalyticsAttribution().ttclid).toBeUndefined();
  });
  it("does not apply a public click to dashboards or store clicks from fixed routes", async () => {
    const { getAnalyticsAttribution } = await import("./client-queue");
    visit("/business/settings?ttclid=not-a-public-landing");
    getAnalyticsAttribution();
    visit("/form/landing");
    expect(getAnalyticsAttribution().ttclid).toBeUndefined();
    visit("/form/landing?ttclid=public-click");
    getAnalyticsAttribution();
    visit("/business/settings");
    expect(getAnalyticsAttribution().ttclid).toBeUndefined();
  });
  it("keeps attribution bounded and usable when storage is blocked", async () => {
    vi.stubGlobal("sessionStorage", { getItem() { throw new Error("Blocked"); }, setItem() { throw new Error("Blocked"); }, removeItem() { throw new Error("Blocked"); } });
    const { getAnalyticsAttribution } = await import("./client-queue");
    visit(`/form/landing?ttclid=${"a".repeat(500)}`);
    expect(getAnalyticsAttribution().ttclid).toHaveLength(255);
    visit("/linktree/next");
    expect(getAnalyticsAttribution().ttclid).toHaveLength(255);
  });
});
