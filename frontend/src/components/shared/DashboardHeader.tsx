"use client";

import { DashboardHeaderFrame } from "./DashboardHeaderFrame";
import { Menu, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { DashboardHeaderActionButton } from "./DashboardHeaderActionButton";
import { DashboardAppearanceControls } from "./DashboardAppearanceControls";
import { MotionSpinner } from "@/components/motion/MotionPrimitives";
import {
  AvatarMenu,
  type AvatarMenuItem,
} from "@/components/shared/AvatarMenu";
import { Tooltip } from "@/components/shared/Tooltip";

export { DashboardHeaderActionButton } from "./DashboardHeaderActionButton";

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
    theme: string;
    darkTheme: string;
    lightTheme: string;
    themeLabel: string;
    accountMenu: string;
  };
  showRefresh?: boolean;
}

const iconClassName = "size-4";

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
    <DashboardHeaderFrame>
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
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

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
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
    </DashboardHeaderFrame>
  );
}
