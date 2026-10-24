"use client";

import type { ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { DashboardHeaderActionButton } from "./DashboardHeaderActionButton";
import { Tooltip } from "./Tooltip";
import type { AppTheme } from "@/lib/app-theme";

export interface DashboardAppearanceControlsProps {
  languageControl?: ReactNode;
  theme: AppTheme;
  mounted: boolean;
  onToggleTheme: () => void;
  compact?: boolean;
  labels?: {
    theme: string;
    darkTheme: string;
    lightTheme: string;
    themeLabel: string;
  };
}

/** One controlled language/theme group for dashboard headers and editor drawers. */
export function DashboardAppearanceControls({
  languageControl,
  theme,
  mounted,
  onToggleTheme,
  compact = false,
  labels,
}: DashboardAppearanceControlsProps) {
  const iconClass = "size-4";
  return (
    <>
      {languageControl}
      <Tooltip
        content={
          !mounted
            ? (labels?.theme ?? "دۆخی ڕەنگ")
            : theme === "light"
              ? (labels?.darkTheme ?? "دۆخی تاریک")
              : (labels?.lightTheme ?? "دۆخی ڕووناک")
        }
        side="bottom"
      >
        <DashboardHeaderActionButton
          onClick={onToggleTheme}
          aria-label={labels?.themeLabel ?? "Toggle theme"}
          className={compact ? "!size-9 !p-0" : undefined}
        >
          {!mounted ? (
            <span className={iconClass} />
          ) : theme === "light" ? (
            <Moon className={iconClass} aria-hidden="true" />
          ) : (
            <Sun className={iconClass} aria-hidden="true" />
          )}
        </DashboardHeaderActionButton>
      </Tooltip>
    </>
  );
}
