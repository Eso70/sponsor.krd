"use client";

import { useEffect, useRef } from "react";

/** Keep the footer inside the visible viewport when mobile browser chrome or a keyboard changes it. */
export function usePublicFormViewport() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const viewport = window.visualViewport;
    let frame = 0;
    const measure = () => {
      const height = viewport?.height ?? window.innerHeight;
      // Pinch zoom must not resize/reflow the form under the user's fingers.
      if (height <= 0 || (viewport && viewport.scale !== 1)) return;
      element.style.setProperty("--form-viewport-height", `${height}px`);
      // iOS pans the visual viewport as well as shrinking it for the keyboard.
      const top = Math.max(0, (viewport?.offsetTop ?? 0) + window.scrollY);
      element.style.setProperty("--form-viewport-top", `${top}px`);

      const focused = document.activeElement;
      if (!(focused instanceof HTMLElement) || !element.contains(focused)) return;
      if (!focused.matches("input, textarea, select, [contenteditable=true]")) return;
      const region = focused.closest<HTMLElement>('[role="region"]');
      if (!region || !element.contains(region)) return;
      const field = focused.getBoundingClientRect();
      const bounds = region.getBoundingClientRect();
      if (bounds.height <= 0) return;
      // Scroll the inner body only; scrollIntoView can pan Safari's outer page.
      if (field.bottom > bounds.bottom - 12)
        region.scrollTop += field.bottom - bounds.bottom + 12;
      else if (field.top < bounds.top + 12)
        region.scrollTop = Math.max(0, region.scrollTop + field.top - bounds.top - 12);
    };
    const resize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", resize, { passive: true });
    viewport?.addEventListener("resize", resize);
    viewport?.addEventListener("scroll", resize, { passive: true });
    element.addEventListener("focusin", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", resize);
      viewport?.removeEventListener("resize", resize);
      viewport?.removeEventListener("scroll", resize);
      element.removeEventListener("focusin", resize);
    };
  }, []);
  return ref;
}
