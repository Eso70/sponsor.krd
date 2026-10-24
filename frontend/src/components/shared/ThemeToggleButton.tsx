"use client";

import { Moon, Sun } from "lucide-react";
import { useAppTheme } from "@/hooks/useAppTheme";
import { HEADER_ACTION_SIZE_CLASS } from "./shared-control-styles";
import { DashboardHeaderActionButton } from "./DashboardHeaderActionButton";
import { Tooltip } from "@/components/shared/Tooltip";

export function ThemeToggleButton({
  className = "",
  copy,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
  copy?: { label: string; light: string; dark: string };
}) {
  const { theme, toggleTheme } = useAppTheme();
  const isDark = theme === "dark";

  return (
    <Tooltip
      content={
        isDark ? (copy?.light ?? "دۆخی ڕووناک") : (copy?.dark ?? "دۆخی تاریک")
      }
      side="bottom"
    >
      <DashboardHeaderActionButton
        type="button"
        onClick={toggleTheme}
        className={`${compact ? "!size-9 !p-0 shrink-0" : HEADER_ACTION_SIZE_CLASS} ${className}`}
        aria-label={copy?.label ?? "Change theme"}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </DashboardHeaderActionButton>
    </Tooltip>
  );
}
