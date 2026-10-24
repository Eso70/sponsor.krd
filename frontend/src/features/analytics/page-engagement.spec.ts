import { afterEach, describe, expect, it, vi } from "vitest";
import type { PageTracker } from "./page-tracking";
import { startPageEngagement } from "./page-engagement";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
describe("active page engagement", () => {
  it("excludes hidden time and reports a final cumulative snapshot", () => {
    vi.useFakeTimers({
      toFake: ["setInterval", "clearInterval", "performance"],
    });
    let state = "visible";
    vi.spyOn(document, "visibilityState", "get").mockImplementation(
      () => state as DocumentVisibilityState,
    );
    vi.spyOn(document, "hasFocus").mockReturnValue(true);
    const trackEngagement = vi.fn();
    const stop = startPageEngagement({
      trackEngagement,
    } as unknown as PageTracker);
    vi.advanceTimersByTime(15_000);
    expect(trackEngagement).toHaveBeenLastCalledWith(
      "engaged_view",
      expect.objectContaining({
        properties: { measurement: "active_time", activeSeconds: 15 },
      }),
    );
    state = "hidden";
    document.dispatchEvent(new Event("visibilitychange"));
    vi.advanceTimersByTime(30_000);
    state = "visible";
    document.dispatchEvent(new Event("visibilitychange"));
    vi.advanceTimersByTime(10_000);
    stop();
    expect(trackEngagement).toHaveBeenLastCalledWith(
      "engaged_view",
      expect.objectContaining({
        immediate: true,
        properties: { measurement: "active_time", activeSeconds: 25 },
      }),
    );
  });
  it("stops counting after sixty seconds without activity", () => {
    vi.useFakeTimers({
      toFake: ["setInterval", "clearInterval", "performance"],
    });
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    vi.spyOn(document, "hasFocus").mockReturnValue(true);
    const trackEngagement = vi.fn();
    const stop = startPageEngagement({
      trackEngagement,
    } as unknown as PageTracker);
    vi.advanceTimersByTime(120_000);
    expect(trackEngagement).toHaveBeenLastCalledWith(
      "engaged_view",
      expect.objectContaining({
        properties: { measurement: "active_time", activeSeconds: 60 },
      }),
    );
    window.dispatchEvent(new Event("pointerdown"));
    vi.advanceTimersByTime(15_000);
    stop();
    expect(trackEngagement).toHaveBeenLastCalledWith(
      "engaged_view",
      expect.objectContaining({
        properties: { measurement: "active_time", activeSeconds: 75 },
      }),
    );
  });
});
