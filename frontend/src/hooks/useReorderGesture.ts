"use client";
import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type MouseEvent as ReactMouseEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";

/** Shared pointer/keyboard ordering; thumbnails opt into a press-and-hold delay. */
export function useReorderGesture({ id, group, onReorder, onStep, disabled = false, holdDelay = 0 }: {
  id: string; group: string; onReorder: (source: string, target: string) => void;
  onStep: (offset: number) => void; disabled?: boolean; holdDelay?: number;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const target = useRef<HTMLElement | null>(null);
  const held = useRef<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = useRef(false);
  const suppressClick = useRef(false);
  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (document.documentElement.dataset.reorderDragging === id) delete document.documentElement.dataset.reorderDragging;
    target.current?.removeAttribute("data-reorder-target");
    held.current?.removeAttribute("data-reorder-held");
    held.current = null; target.current = null; start.current = null; active.current = false;
  };
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    target.current?.removeAttribute("data-reorder-target");
    held.current?.removeAttribute("data-reorder-held");
    if (document.documentElement.dataset.reorderDragging === id) delete document.documentElement.dataset.reorderDragging;
  }, [id]);
  return {
    onClick: (event: ReactMouseEvent<HTMLButtonElement>) => {
      if (!holdDelay || suppressClick.current) { event.preventDefault(); event.stopPropagation(); }
      suppressClick.current = false;
    },
    onKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (!disabled && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
        event.preventDefault(); event.stopPropagation(); onStep(event.key === "ArrowUp" ? -1 : 1);
      }
    },
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (disabled || event.button !== 0 || start.current) return;
      suppressClick.current = false;
      start.current = { x: event.clientX, y: event.clientY };
      const button = event.currentTarget, pointerId = event.pointerId;
      const activate = () => {
        if (button.disabled || !button.isConnected) { clear(); return; }
        active.current = true;
        if (holdDelay) suppressClick.current = true;
        document.documentElement.dataset.reorderDragging = id;
        let source = button.closest<HTMLElement>("[data-reorder-id]");
        while (source && source.dataset.reorderGroup !== group) source = source.parentElement?.closest<HTMLElement>("[data-reorder-id]") ?? null;
        held.current = source; source?.setAttribute("data-reorder-held", "true");
        button.setPointerCapture(pointerId);
      };
      if (holdDelay) timer.current = setTimeout(activate, holdDelay);
      else { event.preventDefault(); event.stopPropagation(); activate(); }
    },
    onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (!start.current) return;
      const distance = Math.hypot(event.clientX - start.current.x, event.clientY - start.current.y);
      if (!active.current) { if (distance > 8) { suppressClick.current = true; clear(); } return; }
      if (distance < 5) return;
      suppressClick.current = true;
      let pane = event.currentTarget.parentElement;
      while (pane) {
        if (pane.scrollHeight > pane.clientHeight && /auto|scroll/.test(getComputedStyle(pane).overflowY)) {
          const bounds = pane.getBoundingClientRect();
          if (event.clientY < bounds.top + 40) pane.scrollTop -= 20;
          else if (event.clientY > bounds.bottom - 40) pane.scrollTop += 20;
          break;
        }
        pane = pane.parentElement;
      }
      let item = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-reorder-id]");
      while (item && item.dataset.reorderGroup !== group) item = item.parentElement?.closest<HTMLElement>("[data-reorder-id]");
      const next = item?.dataset.reorderGroup === group && item.dataset.reorderId !== id ? item : null;
      if (target.current !== next) { target.current?.removeAttribute("data-reorder-target"); target.current = next; next?.setAttribute("data-reorder-target", "true"); }
    },
    onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => {
      const destination = active.current ? target.current?.dataset.reorderId : undefined;
      clear();
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      if (destination) onReorder(id, destination);
    },
    onPointerCancel: clear,
    onLostPointerCapture: clear,
  };
}
