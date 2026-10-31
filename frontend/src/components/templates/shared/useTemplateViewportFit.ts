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
    let pendingFrame = 0;
    const measure = () => {
      pendingFrame = 0;
      const padding = ownerWindow.getComputedStyle(viewport);
      const available = ownerWindow.innerHeight - parseFloat(padding.paddingTop || "0") - parseFloat(padding.paddingBottom || "0");
      const height = content.offsetHeight;
      // Measure the untransformed box, so applying a fit cannot feed back into
      // the next measurement. Never enlarge content or shrink it below 85%.
      const scale = height > 0 && available > 0 ? Math.max(0.85, Math.min(1, available / height)) : 1;
      const fitted = scale < 1;
      content.style.transform = fitted ? `scale(${scale})` : "";
      frame.style.height = fitted ? `${Math.ceil(height * scale)}px` : "";
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
    return () => {
      observer?.disconnect();
      ownerWindow.removeEventListener("resize", schedule);
      ownerWindow.cancelAnimationFrame(pendingFrame);
    };
  }, []);

  return { viewportRef, frameRef, contentRef };
}
