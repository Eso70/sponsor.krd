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
      if (height > 0 && (!viewport || viewport.scale === 1))
        element.style.setProperty("--form-viewport-height", `${height}px`);
    };
    const resize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("resize", resize);
    viewport?.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      viewport?.removeEventListener("resize", resize);
    };
  }, []);
  return ref;
}
