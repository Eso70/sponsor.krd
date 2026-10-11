"use client";

import { House, Menu, RefreshCw } from "lucide-react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import {
  DashboardHeaderActionButton,
  dashboardHeaderActionClassName,
} from "./DashboardHeaderActionButton";
import { DashboardAppearanceControls } from "./DashboardAppearanceControls";
import { MotionSpinner } from "@/components/motion/MotionPrimitives";
import {
  AvatarMenu,
  type AvatarMenuItem,
} from "@/components/shared/AvatarMenu";
import { Tooltip } from "@/components/shared/Tooltip";

export { DashboardHeaderActionButton } from "./DashboardHeaderActionButton";

function DashboardHeaderActionLink({
  className = "",
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={`${dashboardHeaderActionClassName} ${className}`} {...props}>
      {children}
    </a>
  );
}

interface DashboardHeaderProps {
  title: string;
  theme: "light" | "dark";
  mounted: boolean;
  refreshing: boolean;
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
  onRefresh: () => void | Promise<void>;
  notifications: ReactNode;
  profile: {
    name?: string;
    email?: string;
    badge?: string;
    avatarSrc?: string | null;
    items: AvatarMenuItem[];
  };
  onProfileItemClick?: () => void;
  languageControl?: ReactNode;
  labels?: {
    menu: string;
    menuLabel: string;
    refresh: string;
    refreshLabel: string;
    home: string;
    homeLabel: string;
    theme: string;
    darkTheme: string;
    lightTheme: string;
    themeLabel: string;
    accountMenu: string;
  };
  showRefresh?: boolean;
}

const iconClassName =
  "h-4 w-4 transition-transform group-hover:scale-110 sm:h-4 sm:w-4 md:h-5 md:w-5";

export function DashboardHeader({
  title,
  theme,
  mounted,
  refreshing,
  onToggleSidebar,
  onToggleTheme,
  onRefresh,
  notifications,
  profile,
  onProfileItemClick,
  languageControl,
  labels,
  showRefresh = true,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-slate-200 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-[#161B22]/80">
      <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex min-w-0 items-center gap-3">
          <Tooltip
            content={labels?.menu ?? "کردنەوە / داخستنی مینیو"}
            side="bottom"
          >
            <DashboardHeaderActionButton
              onClick={onToggleSidebar}
              aria-label={labels?.menuLabel ?? "Toggle sidebar"}
            >
              <Menu className={iconClassName} aria-hidden="true" />
            </DashboardHeaderActionButton>
          </Tooltip>
          <h1 className="truncate text-base font-bold sm:text-lg">{title}</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {showRefresh ? (
            <Tooltip
              content={labels?.refresh ?? "نوێکردنەوەی داتا"}
              side="bottom"
            >
              <DashboardHeaderActionButton
                onClick={() => void onRefresh()}
                disabled={refreshing}
                aria-busy={refreshing}
                aria-label={labels?.refreshLabel ?? "Refresh dashboard data"}
              >
                <MotionSpinner active={refreshing}>
                  <RefreshCw className={iconClassName} aria-hidden="true" />
                </MotionSpinner>
              </DashboardHeaderActionButton>
            </Tooltip>
          ) : null}

          <Tooltip
            content={labels?.home ?? "کردنەوەی ماڵپەڕ لە تابێکی نوێ"}
            side="bottom"
          >
            <DashboardHeaderActionLink
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={labels?.homeLabel ?? "Open home page in new tab"}
            >
              <House className={iconClassName} aria-hidden="true" />
            </DashboardHeaderActionLink>
          </Tooltip>

          {notifications}

          <DashboardAppearanceControls
            languageControl={languageControl}
            theme={theme}
            mounted={mounted}
            onToggleTheme={onToggleTheme}
            labels={labels}
          />
          <AvatarMenu
            name={profile.name}
            email={profile.email}
            badge={profile.badge}
            avatarSrc={profile.avatarSrc}
            ariaLabel={labels?.accountMenu ?? "Account menu"}
            items={profile.items}
            onItemClick={onProfileItemClick}
          />
        </div>
      </div>
    </header>
  );
}
