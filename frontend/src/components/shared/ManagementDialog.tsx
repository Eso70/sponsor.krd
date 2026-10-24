"use client";

import { SHARED_SOFT_BUTTON_CLASS } from "./shared-control-styles";
import { useContext, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Tooltip } from "@/components/shared/Tooltip";
import { useModalKeyboard } from "@/hooks/useModalKeyboard";
import { useIsPresent } from "motion/react";
import { useDocumentScrollLock } from "@/hooks/useDocumentScrollLock";
import { DRAWER_MOTION } from "@/components/motion/drawer-motion";
import { DrawerSessionContext } from "./drawer-session-context";
import type { ManagementModalProps } from "./ManagementModal";
import {
  MotionFade,
  MotionReveal,
  MotionSlide,
} from "@/components/motion/MotionPrimitives";
import {
  MANAGEMENT_MODAL_BACKDROP_CLASS,
  MANAGEMENT_MODAL_FOOTER_CLASS,
  MANAGEMENT_MODAL_HEADER_CLASS,
  MANAGEMENT_MODAL_SURFACE_CLASS,
  MANAGEMENT_DRAWER_SURFACE_CLASS,
} from "@/components/shared/management-modal-styles";
import {
  parseWebsiteColor,
  readableInk,
} from "@/lib/utils/parse-website-color";

export function ManagementDialog({
  onClose,
  title,
  description,
  compactHeader = false,
  stackHeaderOnMobile = false,
  children,
  footer,
  progress,
  headerAction,
  flushFooter = false,
  bodyLayout = "scroll",
  wide = false,
  extraWide = false,
  busy = false,
  createBusinessStyle = false,
  sponsorKrdTheme = true,
  locked = false,
  accentColor = null,
  closeLabel = "داخستن",
  presentation = "modal",
}: ManagementModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const present = useIsPresent();
  const isDrawer = presentation === "drawer";
  useDocumentScrollLock(isDrawer);
  const session = useContext(DrawerSessionContext);
  const [skipEntry] = useState(() => session?.hasEntered() ?? false);
  useLayoutEffect(() => {
    if (isDrawer) session?.markEntered();
  }, [isDrawer, session]);
  useModalKeyboard({
    isOpen: true,
    onEscape: onClose,
    escapeEnabled: present && !busy && !locked,
    dialogRef,
  });

  const Surface = isDrawer ? MotionSlide : MotionReveal;
  const widthClass = isDrawer
    ? extraWide
      ? "sm:w-[90vw] lg:w-[85vw] xl:w-[75vw] max-w-6xl"
      : wide
        ? "sm:max-w-3xl"
        : "sm:max-w-lg"
    : createBusinessStyle
      ? "max-w-2xl"
      : extraWide
        ? "max-w-6xl"
        : wide
          ? "max-w-3xl"
          : "max-w-lg";

  // An explicit accent wins over the platform one: the modal is editing
  // something whose colour the reader is about to see on their own page.
  const accent = accentColor ? parseWebsiteColor(accentColor) : null;
  const themeStyle = accent
    ? ({
        "--theme-primary": accent.primary,
        "--theme-css": accent.css,
        "--theme-ink": readableInk(accent.primary),
        "--sponsor-krd-accent": accent.primary,
        "--sponsor-krd-accent-ink": readableInk(accent.primary),
        "--sponsor-krd-accent-hover": `color-mix(in srgb, ${accent.primary} 88%, black)`,
      } as React.CSSProperties)
    : sponsorKrdTheme
      ? ({
          "--theme-primary": "var(--sponsor-krd-accent)",
          "--theme-css": "var(--sponsor-krd-accent-gradient)",
          "--theme-ink": "var(--sponsor-krd-accent-ink)",
        } as React.CSSProperties)
      : undefined;

  return createPortal(
    <div
      className={`modal-ltr fixed inset-0 z-[140] flex ${isDrawer ? "items-stretch justify-end overflow-clip" : "items-center justify-center overflow-hidden p-2 sm:p-4"}`}
      data-sponsor-krd-theme={sponsorKrdTheme && !accent ? true : undefined}
      data-platform-admin-theme={sponsorKrdTheme && !accent ? true : undefined}
      dir="ltr"
      data-drawer-state={isDrawer ? (present ? "open" : "closing") : undefined}
      onClickCapture={(event) => {
        if (!present) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      style={themeStyle}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && present && !busy && !locked)
          onClose();
      }}
    >
      <MotionFade
        duration={isDrawer ? DRAWER_MOTION.backdrop : 0}
        skipInitialAnimation={isDrawer && skipEntry}
        className={
          isDrawer
            ? "absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            : MANAGEMENT_MODAL_BACKDROP_CLASS
        }
        onMouseDown={() => {
          if (present && !busy && !locked) onClose();
        }}
      />
      <Surface
        {...(isDrawer ? { skipInitialAnimation: skipEntry } : {})}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`${isDrawer ? MANAGEMENT_DRAWER_SURFACE_CLASS : MANAGEMENT_MODAL_SURFACE_CLASS} ${widthClass}`}
      >
        <header
          className={`${MANAGEMENT_MODAL_HEADER_CLASS} ${stackHeaderOnMobile ? "flex-col sm:flex-row" : ""} shrink-0 ${createBusinessStyle ? "items-center" : "items-start"}`}
        >
          <div className="min-w-0">
            <h2
              id={titleId}
              className={`font-bold text-slate-700 dark:text-slate-100 ${compactHeader ? "text-sm sm:text-base" : createBusinessStyle ? "truncate text-lg sm:text-xl md:text-2xl" : "text-lg sm:text-xl"}`}
            >
              {title}
            </h2>
            {description && (
              <p
                id={descriptionId}
                className={`mt-1 text-slate-500 dark:text-slate-400 ${compactHeader ? "text-[10px] leading-4" : createBusinessStyle ? "text-xs sm:text-sm leading-5" : "text-xs leading-5"}`}
              >
                {description}
              </p>
            )}
          </div>
          <div
            className={`flex shrink-0 items-center gap-2 ${stackHeaderOnMobile ? "self-end" : ""}`}
          >
            {headerAction}
            {!locked ? (
              <Tooltip content={closeLabel} side="bottom">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={busy || !present}
                  aria-label={closeLabel}
                  className={`${SHARED_SOFT_BUTTON_CLASS} flex h-9 w-9 shrink-0 items-center justify-center disabled:opacity-50`}
                >
                  <X className={createBusinessStyle ? "h-5 w-5" : "h-4 w-4"} />
                </button>
              </Tooltip>
            ) : null}
          </div>
        </header>
        {progress}
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 md:p-6 ${bodyLayout === "centered" ? "flex flex-col" : bodyLayout === "contained" ? "lg:overflow-hidden" : ""} ${createBusinessStyle ? "bg-linear-to-br from-white to-slate-50/20 dark:from-[#1c222b] dark:to-slate-900/10" : ""}`}
        >
          {children}
        </div>
        {footer && flushFooter ? (
          footer
        ) : footer ? (
          <footer
            className={`${MANAGEMENT_MODAL_FOOTER_CLASS} flex shrink-0 flex-col-reverse sm:flex-row ${createBusinessStyle ? "gap-2 sm:gap-3" : "gap-2 sm:justify-end"}`}
          >
            {footer}
          </footer>
        ) : null}
      </Surface>
    </div>,
    document.body,
  );
}
