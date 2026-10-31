"use client";

import { useLayoutEffect, useRef } from "react";

/** Fit ordinary pages to their own window (including the preview iframe).
 * Keep long pages readable and let the document scroll beyond that limit.
 */
export function useTemplateViewportFit() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const frame = frameRef.current;
    const content = contentRef.current;
    const ownerWindow = viewport?.ownerDocument.defaultView;
    if (!viewport || !frame || !content || !ownerWindow) return;
    const visibleViewport = ownerWindow.visualViewport;
    // Reuse the shared shell's height contract; setting only the inner page
    // would leave the shell's 100dvh minimum creating hidden blank overflow.
    const heightOwner = viewport.closest<HTMLElement>(".public-template-shell") ?? viewport;
    const previousHeight = heightOwner.style.getPropertyValue("--template-viewport-height");
    // The app shell's large-viewport minimum must not add blank scrolling
    // below an otherwise fitted public page. Preview iframes have no app shell.
    const background = viewport.closest<HTMLElement>("[data-theme-background]");
    const previousMinHeight = background?.style.minHeight ?? "";
    if (background) background.style.minHeight = "0";
    let pendingFrame = 0;
    const measure = () => {
      pendingFrame = 0;
      // Pinch zoom intentionally magnifies the page; do not fit it back down.
      if (Math.abs((visibleViewport?.scale ?? 1) - 1) > 0.01) return;
      const visibleHeight = Math.floor(Math.min(ownerWindow.innerHeight, visibleViewport?.height || ownerWindow.innerHeight));
      heightOwner.style.setProperty("--template-viewport-height", `${visibleHeight}px`);
      const padding = ownerWindow.getComputedStyle(viewport);
      const available = visibleHeight - parseFloat(padding.paddingTop || "0") - parseFloat(padding.paddingBottom || "0");
      const height = content.offsetHeight;
      // Measure the untransformed box, so applying a fit cannot feed back into
      // the next measurement. Never enlarge content or shrink it below 85%.
      const scale = height > 0 && available > 0 ? Math.max(0.85, Math.min(1, available / height)) : 1;
      const fitted = scale < 1;
      content.style.setProperty("--template-fit-scale", String(scale));
      content.style.transform = fitted ? `scale(${scale})` : "";
      frame.style.height = fitted ? `${height * scale}px` : "";
      frame.dataset.fitted = String(fitted);
    };
    const schedule = () => {
      if (!pendingFrame) pendingFrame = ownerWindow.requestAnimationFrame(measure);
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    observer?.observe(viewport);
    observer?.observe(content);
    const footer = viewport.querySelector("[data-linktree-footer]");
    if (footer) observer?.observe(footer);
    ownerWindow.addEventListener("resize", schedule);
    visibleViewport?.addEventListener("resize", schedule);
    return () => {
      observer?.disconnect();
      ownerWindow.removeEventListener("resize", schedule);
      visibleViewport?.removeEventListener("resize", schedule);
      ownerWindow.cancelAnimationFrame(pendingFrame);
      if (previousHeight) heightOwner.style.setProperty("--template-viewport-height", previousHeight);
      else heightOwner.style.removeProperty("--template-viewport-height");
      if (background) background.style.minHeight = previousMinHeight;
    };
  }, []);

  return { viewportRef, frameRef, contentRef };
}
