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
import surfaceStyles from "./picker-popup-surface.module.css";
import { pickerAppearance } from "@/lib/utils/picker-appearance";

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
  const [portalDocument, setPortalDocument] = useState<Document | null>(null);
  const [appearance, setAppearance] = useState<"light" | "dark">("light");
  const container = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<CSSProperties>({});
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();
  const contains = (target: EventTarget | null) =>
    target !== null && "nodeType" in target &&
    (container.current?.contains(target as Node) || panel.current?.contains(target as Node));
  useLayoutEffect(() => {
    if (!open) return;
    const ownerDocument = button.current?.ownerDocument ?? document;
    const ownerWindow = ownerDocument.defaultView ?? window;
    const update = () => {
      if (!button.current || !panel.current) return;
      const rect = button.current.getBoundingClientRect();
      const width = Math.min(280, ownerWindow.innerWidth - 24);
      const height = panel.current.getBoundingClientRect().height;
      const computed = ownerWindow.getComputedStyle(button.current);
      const palette = Object.fromEntries(
        ["--preview-surface", "--preview-text", "--preview-border", "--shared-control-surface", "--shared-control-hover", "--shared-control-text", "--shared-control-muted", "--shared-control-radius"].map(
          (key) => [key, computed.getPropertyValue(key)],
        ),
      );
      setPosition({
        ...palette,
        width,
        left: Math.max(
          12,
          Math.min(rect.right - width, ownerWindow.innerWidth - width - 12),
        ),
        top: Math.max(
          12,
          Math.min(
            rect.top >= height + 8 ? rect.top - height : rect.bottom,
            ownerWindow.innerHeight - height - 12,
          ),
        ),
        direction: computed.direction as "ltr" | "rtl",
      });
    };
    update();
    ownerWindow.addEventListener("resize", update);
    ownerWindow.addEventListener("scroll", update, true);
    return () => {
      ownerWindow.removeEventListener("resize", update);
      ownerWindow.removeEventListener("scroll", update, true);
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const ownerDocument = button.current?.ownerDocument ?? document;
    const dismiss = (event: PointerEvent) => {
      if (
        event.target !== null && "nodeType" in event.target &&
        !container.current?.contains(event.target as Node) &&
        !panel.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    ownerDocument.addEventListener("pointerdown", dismiss);
    return () => ownerDocument.removeEventListener("pointerdown", dismiss);
  }, [open]);
  const show = () => {
    setPortalDocument(button.current?.ownerDocument ?? document);
    setAppearance(pickerAppearance(button.current));
    setOpen(true);
  };
  return (
    <div
      ref={container}
      className="relative inline-flex shrink-0"
      onMouseEnter={show}
      onMouseLeave={(event) => {
        if (!contains(event.relatedTarget) && !contains(event.currentTarget.ownerDocument.activeElement))
          setOpen(false);
      }}
      onFocus={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) show();
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
        onClick={show}
        className="flex size-7 items-center justify-center rounded-full opacity-65 hover:opacity-100"
      >
        {trigger}
      </button>
      {open && portalDocument &&
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
              className={`${surfaceStyles.surface} space-y-3 border p-3 text-xs leading-5`}
              data-picker-surface data-appearance={appearance}
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
          portalDocument.body,
        )}
    </div>
  );
}
