"use client";
import { useEffect, useRef } from "react";
import { GripVertical } from "lucide-react";

/** Pointer capture supports mouse and touch; arrow keys provide the same ordering action. */
export function ReorderHandle({
  id,
  group,
  label,
  onReorder,
  onStep,
}: {
  id: string;
  group: string;
  label: string;
  onReorder: (source: string, target: string) => void;
  onStep: (offset: number) => void;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const target = useRef<HTMLElement | null>(null);
  const held = useRef<HTMLElement | null>(null);
  const clear = () => {
    if (document.documentElement.dataset.reorderDragging === id)
      delete document.documentElement.dataset.reorderDragging;
    target.current?.removeAttribute("data-reorder-target");
    held.current?.removeAttribute("data-reorder-held");
    held.current = null;
    target.current = null;
    start.current = null;
  };
  useEffect(
    () => () => {
      target.current?.removeAttribute("data-reorder-target");
      held.current?.removeAttribute("data-reorder-held");
      if (document.documentElement.dataset.reorderDragging === id)
        delete document.documentElement.dataset.reorderDragging;
    },
    [id],
  );
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="flex size-8 shrink-0 touch-none items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 active:cursor-grabbing dark:hover:bg-white/10 cursor-grab focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-primary)]"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
          event.preventDefault();
          event.stopPropagation();
          onStep(event.key === "ArrowUp" ? -1 : 1);
        }
      }}
      onPointerDown={(event) => {
        if (event.button !== 0 || start.current) return;
        event.preventDefault();
        event.stopPropagation();
        start.current = { x: event.clientX, y: event.clientY };
        document.documentElement.dataset.reorderDragging = id;
        let source =
          event.currentTarget.closest<HTMLElement>("[data-reorder-id]");
        while (source && source.dataset.reorderGroup !== group) {
          source =
            source.parentElement?.closest<HTMLElement>("[data-reorder-id]") ??
            null;
        }
        held.current = source;
        source?.setAttribute("data-reorder-held", "true");
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (
          !start.current ||
          Math.hypot(
            event.clientX - start.current.x,
            event.clientY - start.current.y,
          ) < 5
        )
          return;
        // Keep longer editor lists reachable while dragging with mouse or touch.
        let pane = event.currentTarget.parentElement;
        while (pane) {
          const overflow = getComputedStyle(pane).overflowY;
          if (
            pane.scrollHeight > pane.clientHeight &&
            /auto|scroll/.test(overflow)
          ) {
            const bounds = pane.getBoundingClientRect();
            if (event.clientY < bounds.top + 40) pane.scrollTop -= 20;
            else if (event.clientY > bounds.bottom - 40) pane.scrollTop += 20;
            break;
          }
          pane = pane.parentElement;
        }
        let item = document
          .elementFromPoint(event.clientX, event.clientY)
          ?.closest<HTMLElement>("[data-reorder-id]");
        while (item && item.dataset.reorderGroup !== group) {
          item = item.parentElement?.closest<HTMLElement>("[data-reorder-id]");
        }
        const next =
          item?.dataset.reorderGroup === group && item.dataset.reorderId !== id
            ? item
            : null;
        if (target.current !== next) {
          target.current?.removeAttribute("data-reorder-target");
          target.current = next;
          next?.setAttribute("data-reorder-target", "true");
        }
      }}
      onPointerUp={(event) => {
        const destination = target.current?.dataset.reorderId;
        clear();
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId);
        if (destination) onReorder(id, destination);
      }}
      onPointerCancel={clear}
      onLostPointerCapture={clear}
    >
      <GripVertical aria-hidden className="size-4" />
    </button>
  );
}
