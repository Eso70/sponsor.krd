"use client";

import { flushSync } from "react-dom";
import { persistAppTheme, readAppTheme, type AppTheme } from "./app-theme";

let pendingTheme: AppTheme | undefined;
let revision = 0;
let activeTransition: { skipTransition(): void } | undefined;
let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

/** Animate deliberate appearance changes, never initial hydration or storage sync. */
export function toggleAppTheme() {
  const nextTheme =
    (pendingTheme ?? readAppTheme()) === "dark" ? "light" : "dark";
  pendingTheme = nextTheme;
  const currentRevision = ++revision;
  const root = document.documentElement;
  activeTransition?.skipTransition();
  activeTransition = undefined;
  clearTimeout(fallbackTimer);
  root.removeAttribute("data-app-theme-fallback");

  const apply = () => {
    // Skipped transitions may still invoke their queued update callback.
    if (currentRevision !== revision) return;
    flushSync(() => persistAppTheme(nextTheme));
    pendingTheme = undefined;
  };
  const cleanup = () => {
    if (currentRevision !== revision) return;
    root.removeAttribute("data-app-theme-changing");
    activeTransition = undefined;
  };
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (reducedMotion || document.visibilityState === "hidden") {
    cleanup();
    root.setAttribute("data-app-theme-fallback", "");
    apply();
    fallbackTimer = setTimeout(
      () => root.removeAttribute("data-app-theme-fallback"),
      200,
    );
    return;
  }

  if (typeof document.startViewTransition !== "function") {
    cleanup();
    root.setAttribute("data-app-theme-fallback", "");
    apply();
    fallbackTimer = setTimeout(() => {
      root.removeAttribute("data-app-theme-fallback");
    }, 200);
    return;
  }

  root.setAttribute("data-app-theme-changing", "");
  try {
    const transition = document.startViewTransition(apply);
    activeTransition = transition;
    // A hidden document or another native transition can reject the snapshot.
    void transition.ready.catch(() => {});
    void transition.finished.catch(apply).finally(cleanup);
  } catch {
    apply();
    cleanup();
  }
}
