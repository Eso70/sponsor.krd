"use client";

import Image from "next/image";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useModalKeyboard } from "@/hooks/useModalKeyboard";
import { Globe2, X } from "lucide-react";
import { useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { sidebarSelectionColor } from "./dashboard-sidebar-theme";
import styles from "./dashboard-sidebar.module.css";
import chrome from "./dashboard-chrome.module.css";
import { SegmentedTabsFrame } from "./SegmentedTabsFrame";
import { DashboardSidebarAction } from "./DashboardSidebarAction";
import { Tooltip } from "@/components/shared/Tooltip";

export interface DashboardSidebarItem {
  id: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onClick: () => void;
}

interface DashboardSidebarProps {
  brandName: string;
  brandSubtitle: string;
  brandImage: string;
  brandImageAlt?: string;
  items: DashboardSidebarItem[];
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  closeLabel?: string;
  closeTooltip?: string;
  footer?: ReactNode;
  websiteLabel?: string;
  accentColor?: string | null;
}

export function DashboardSidebar({
  brandName,
  brandSubtitle,
  brandImage,
  brandImageAlt = "Logo",
  items,
  collapsed,
  mobileOpen,
  onCloseMobile,
  closeLabel = "Close sidebar",
  closeTooltip = "داخستن",
  footer,
  websiteLabel = "Website",
  accentColor,
}: DashboardSidebarProps) {
  const sidebarRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const isMobile = useMediaQuery("(max-width: 767px)");
  useModalKeyboard({
    isOpen: isMobile && mobileOpen,
    dialogRef: sidebarRef,
    initialFocusRef: closeRef,
    onEscape: onCloseMobile,
    enterEnabled: false,
  });
  const themeStyle = useMemo(() => {
    return {
      "--sidebar-primary": sidebarSelectionColor(accentColor),
      "--sidebar-ink": "#ffffff",
    } as CSSProperties;
  }, [accentColor]);
  return (
    <>
      <button
        type="button"
        className={`${styles.backdrop} fixed inset-0 z-40 bg-black/45 backdrop-blur-sm md:hidden`}
        data-open={mobileOpen}
        aria-hidden={!mobileOpen}
        tabIndex={-1}
        onClick={onCloseMobile}
        aria-label={closeLabel}
      />

      <aside
        ref={sidebarRef}
        inert={isMobile && !mobileOpen}
        data-open={mobileOpen}
        data-dashboard-sidebar
        style={themeStyle}
        className={`${styles.sidebar} fixed left-0 top-0 z-50 flex flex-col border-r border-slate-200 bg-white will-change-transform dark:border-white/10 dark:bg-[#161B22] md:sticky md:top-0 md:translate-x-0 md:will-change-auto ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-64 md:w-20" : "w-64 md:w-72"}`}
      >
        <div
          className={`${chrome.headerRow} flex shrink-0 items-center justify-between border-b border-slate-200 px-5 dark:border-white/10 ${collapsed ? "md:justify-center" : ""}`}
        >
          <div
            className={`flex items-center ${collapsed ? "md:justify-center md:gap-0" : "gap-3"}`}
          >
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200/60 dark:border-white/10">
              <Image
                src={brandImage}
                alt={brandImageAlt}
                width={48}
                height={48}
                className="h-full w-full object-cover"
                unoptimized
                priority
              />
            </div>
            <div
              className={`transition-all duration-300 ${collapsed ? "overflow-hidden md:pointer-events-none md:w-0 md:opacity-0" : "opacity-100"}`}
            >
              <h2 className="whitespace-nowrap text-base font-bold leading-tight">
                {brandName}
              </h2>
              <span className="block whitespace-nowrap text-xs text-slate-400 dark:text-gray-500">
                {brandSubtitle}
              </span>
            </div>
          </div>

          <Tooltip content={closeTooltip} side="left">
            <button
              type="button"
              ref={closeRef}
              onClick={onCloseMobile}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-[background-color,color,transform] duration-200 hover:bg-slate-50 hover:text-slate-600 active:scale-95 dark:hover:bg-white/5 dark:hover:text-gray-300 md:hidden cursor-pointer"
              aria-label={closeLabel}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </Tooltip>
        </div>

        <nav
          className={`${styles.navigation} flex flex-1 flex-col gap-1.5 p-3`}
        >
          <SegmentedTabsFrame vertical fullWidth plain>
          {items
            .filter((item) => !item.hidden)
            .map((item) => (
              <DashboardSidebarAction
                key={item.id}
                collapsed={collapsed}
                label={item.label}
                icon={item.icon}
                active={item.active}
                disabled={item.disabled}
                disabledReason={item.disabled ? item.disabledReason : undefined}
                onClick={() => {
                  item.onClick();
                  onCloseMobile();
                }}
              />
            ))}
          </SegmentedTabsFrame>
        </nav>

        <div
          data-dashboard-sidebar-footer
          className={`${styles.footer} shrink-0 border-t border-slate-200 p-3 dark:border-white/10`}
        >
          {footer}
          <DashboardSidebarAction
            collapsed={collapsed}
            label={websiteLabel}
            icon={<Globe2 className="size-4 text-sky-600 dark:text-sky-400" />}
            href="/"
            onClick={onCloseMobile}
          />
        </div>
      </aside>
    </>
  );
}
