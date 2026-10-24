import type { PageTracker } from "./page-tracking";

/** Visible, focused reading time; idle/background time never counts. */
export function startPageEngagement(tracker: PageTracker): () => void {
  let activeMs = 0;
  let previous = performance.now();
  let lastInteraction = previous;
  let lastReported = -1;
  let visible = document.visibilityState === "visible";
  let focused = document.hasFocus();
  const update = () => {
    const now = performance.now();
    if (visible && focused)
      activeMs += Math.max(
        0,
        Math.min(now, lastInteraction + 60_000) - previous,
      );
    activeMs = Math.min(activeMs, 86_400_000);
    previous = now;
  };
  const report = (immediate = false) => {
    update();
    const seconds = Math.floor(activeMs / 1000);
    if (seconds === lastReported) return;
    lastReported = seconds;
    tracker.trackEngagement("engaged_view", {
      immediate,
      properties: { measurement: "active_time", activeSeconds: seconds },
    });
  };
  const interaction = () => {
    update();
    lastInteraction = performance.now();
  };
  const visibility = () => {
    report(true);
    visible = document.visibilityState === "visible";
    previous = performance.now();
  };
  const focus = () => {
    update();
    focused = true;
    lastInteraction = performance.now();
  };
  const blur = () => {
    report(true);
    focused = false;
  };
  const exit = () => {
    report(true);
    visible = false;
  };
  const resume = () => {
    visible = document.visibilityState === "visible";
    focused = document.hasFocus();
    previous = lastInteraction = performance.now();
  };
  const interval = window.setInterval(() => report(), 15_000);
  for (const name of ["pointerdown", "keydown", "scroll", "touchstart"])
    window.addEventListener(name, interaction, { passive: true });
  document.addEventListener("visibilitychange", visibility);
  window.addEventListener("focus", focus);
  window.addEventListener("blur", blur);
  window.addEventListener("pagehide", exit);
  window.addEventListener("pageshow", resume);
  return () => {
    report(true);
    window.clearInterval(interval);
    for (const name of ["pointerdown", "keydown", "scroll", "touchstart"])
      window.removeEventListener(name, interaction);
    document.removeEventListener("visibilitychange", visibility);
    window.removeEventListener("focus", focus);
    window.removeEventListener("blur", blur);
    window.removeEventListener("pagehide", exit);
    window.removeEventListener("pageshow", resume);
  };
}
