"use client";

import { useEffect, useRef } from "react";
import styles from "./cursor-glow.module.css";

/** Decorative only: the browser cursor always retains immediate mouse feedback. */
export function CursorGlow() {
  const glow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(any-pointer: fine) and (prefers-reduced-motion: no-preference)");
    const element = glow.current;
    if (!element) return;
    let frame = 0;
    let lastTime = 0;
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let visible = false;

    const hide = () => {
      visible = false;
      element.style.opacity = "0";
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    };
    const animate = (time: number) => {
      const elapsed = lastTime ? Math.min(time - lastTime, 50) : 16;
      lastTime = time;
      const ease = 1 - Math.exp(-elapsed / 45);
      x += (targetX - x) * ease;
      y += (targetY - y) * ease;
      element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (Math.hypot(targetX - x, targetY - y) > 0.2) {
        frame = requestAnimationFrame(animate);
      } else {
        frame = 0;
        lastTime = 0;
      }
    };
    const move = (event: PointerEvent) => {
      if (!media.matches || event.pointerType !== "mouse" || event.buttons || document.hidden) {
        hide();
        return;
      }
      const target = event.target;
      const cursor = target instanceof Element ? getComputedStyle(target).cursor : "";
      // Leave native resizing, disabled and drag feedback undisturbed.
      if (cursor !== "default" && cursor !== "auto" && cursor !== "pointer" && !cursor.includes("/cursors/") && !cursor.includes("data:image/svg+xml")) {
        hide();
        return;
      }
      targetX = event.clientX;
      targetY = event.clientY;
      if (!visible) {
        x = targetX;
        y = targetY;
        visible = true;
        element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        element.style.opacity = "1";
      }
      if (!frame) frame = requestAnimationFrame(animate);
    };
    const leave = (event: PointerEvent) => {
      if (!event.relatedTarget) hide();
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerout", leave);
    window.addEventListener("pointerdown", hide);
    window.addEventListener("blur", hide);
    document.addEventListener("visibilitychange", hide);
    media.addEventListener("change", hide);
    return () => {
      hide();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerout", leave);
      window.removeEventListener("pointerdown", hide);
      window.removeEventListener("blur", hide);
      document.removeEventListener("visibilitychange", hide);
      media.removeEventListener("change", hide);
    };
  }, []);

  return <div ref={glow} aria-hidden="true" className={styles.glow} />;
}
