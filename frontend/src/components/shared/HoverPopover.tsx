"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { createPortal } from "react-dom";

/** Interactive help: hover/focus on desktop, tap on touch, with reachable links. */
export function HoverPopover({
  label,
  trigger,
  children,
  panelStyle,
}: {
  label: string;
  trigger: ReactNode;
  children: ReactNode;
  panelStyle?: CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<CSSProperties>({});
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();
  const contains = (target: EventTarget | null) =>
    target instanceof Node &&
    (container.current?.contains(target) || panel.current?.contains(target));
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      if (!button.current || !panel.current) return;
      const rect = button.current.getBoundingClientRect();
      const width = Math.min(280, window.innerWidth - 24);
      const height = panel.current.getBoundingClientRect().height;
      const computed = getComputedStyle(button.current);
      const palette = Object.fromEntries(
        ["--preview-surface", "--preview-text", "--preview-border"].map(
          (key) => [key, computed.getPropertyValue(key)],
        ),
      );
      setPosition({
        ...palette,
        width,
        left: Math.max(
          12,
          Math.min(rect.right - width, window.innerWidth - width - 12),
        ),
        top: Math.max(
          12,
          Math.min(
            rect.top >= height + 8 ? rect.top - height : rect.bottom,
            window.innerHeight - height - 12,
          ),
        ),
        direction: computed.direction as "ltr" | "rtl",
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !container.current?.contains(event.target) &&
        !panel.current?.contains(event.target)
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);
  return (
    <div
      ref={container}
      className="relative inline-flex shrink-0"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={(event) => {
        if (!contains(event.relatedTarget) && !contains(document.activeElement))
          setOpen(false);
      }}
      onFocus={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(true);
      }}
      onBlur={(event) => {
        if (!contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (open && event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          button.current?.focus({ preventScroll: true });
          setOpen(false);
        }
      }}
    >
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen(true)}
        className="flex size-7 items-center justify-center rounded-full opacity-65 hover:opacity-100"
      >
        {trigger}
      </button>
      {open &&
        createPortal(
          <div
            ref={panel}
            className="fixed z-[10001] max-h-[calc(100dvh-24px)] overflow-y-auto p-1"
            style={position}
          >
            <div
              id={id}
              role="region"
              aria-label={label}
              className="space-y-3 rounded-xl border p-3 text-xs leading-5 shadow-lg"
              style={{
                background: "var(--theme-surface, #fff)",
                color: "var(--theme-text-primary, #334155)",
                borderColor: "var(--theme-border, #e2e8f0)",
                ...panelStyle,
              }}
            >
              {children}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
