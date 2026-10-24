"use client";

import { ArrowUpRight, Crown, LifeBuoy } from "lucide-react";
import { sidebarPlanButtonClassName } from "@/components/shared/dashboard-sidebar-styles";
import styles from "@/components/shared/dashboard-sidebar.module.css";
import { Tooltip } from "@/components/shared/Tooltip";
import { DashboardSidebarAction } from "@/components/shared/DashboardSidebarAction";
import { useTranslations } from "next-intl";

interface BusinessSidebarFooterProps {
  collapsed: boolean;
  planCode?: string;
  planName?: string;
  onSupport: () => void;
  onUpgrade: () => void;
}

export function BusinessSidebarFooter({
  collapsed,
  planCode,
  planName,
  onSupport,
  onUpgrade,
}: BusinessSidebarFooterProps) {
  const t = useTranslations("Sidebar");
  const displayPlanName = planName?.trim() || t("planFallback");
  const canUpgrade = Boolean(
    planCode && planCode.trim().toLowerCase() !== "max",
  );
  const planLabel = `${t("currentPlan")}: ${displayPlanName}`;
  return (
    <div className="space-y-1" aria-label={t("planAndSupport")}>
      <Tooltip
        content={canUpgrade ? `${planLabel} · ${t("upgrade")}` : planLabel}
        side="right"
        disabled={!collapsed}
      >
        <button
          type="button"
          onClick={onUpgrade}
          aria-label={planLabel}
          aria-haspopup="dialog"
          className={sidebarPlanButtonClassName(collapsed)}
        >
          <span className={styles.icon} aria-hidden="true">
            <Crown
              aria-hidden="true"
              className={`${styles.planIcon} size-4 shrink-0`}
            />
          </span>
          <div className={`min-w-0 flex-1 ${collapsed ? "md:hidden" : ""}`}>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {t("currentPlan")}
            </p>
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {displayPlanName}
            </p>
          </div>
          {canUpgrade ? (
            <span
              className={`${styles.accent} inline-flex min-w-0 max-w-[55%] shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold ${collapsed ? "md:hidden" : ""}`}
            >
              <span className="truncate">{t("upgrade")}</span>
              <ArrowUpRight className="size-3 shrink-0" aria-hidden="true" />
            </span>
          ) : null}
        </button>
      </Tooltip>
      <DashboardSidebarAction
        collapsed={collapsed}
        label={t("support")}
        icon={
          <LifeBuoy className="size-4 text-emerald-600 dark:text-emerald-400" />
        }
        onClick={onSupport}
      />
    </div>
  );
}
