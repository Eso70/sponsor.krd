import { SegmentedTabsFrame } from "./SegmentedTabsFrame";
import styles from "./dashboard-sidebar.module.css";
import chrome from "./dashboard-chrome.module.css";
import { sidebarPlanButtonClassName } from "./dashboard-sidebar-styles";
import { Skeleton } from "./SkeletonBlock";

/** Mirrors the real sidebar, including the distinct Business and Platform footers. */
export function DashboardSidebarSkeleton({
  navigationItems,
  platformAdminTheme = false,
  collapsed = false,
}: {
  navigationItems?: number;
  platformAdminTheme?: boolean;
  collapsed?: boolean;
}) {
  const count = navigationItems ?? (platformAdminTheme ? 9 : 5);
  return (
    <aside
      aria-hidden="true"
      className={`${styles.sidebar} pointer-events-none hidden shrink-0 flex-col border-r border-slate-200 bg-white dark:border-white/10 dark:bg-[#161B22] md:flex ${collapsed ? "w-20" : "w-72"}`}
    >
      <div
        className={`${chrome.headerRow} flex shrink-0 items-center border-b border-slate-200 px-5 dark:border-white/10 ${collapsed ? "justify-center" : "gap-3"}`}
      >
        <div className="size-12 shrink-0 overflow-hidden rounded-xl border border-slate-200/60 dark:border-white/10">
          <Skeleton className="h-full w-full" rounded="rounded-none" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="flex h-5 items-center">
              <Skeleton className="h-4 w-24" rounded="rounded-md" />
            </div>
            <div className="flex h-4 items-center">
              <Skeleton className="h-3 w-32" rounded="rounded-md" />
            </div>
          </div>
        )}
      </div>
      <div
        data-sidebar-skeleton="navigation"
        className={`${styles.navigation} flex flex-1 flex-col gap-1.5 p-3`}
      >
        <SegmentedTabsFrame vertical fullWidth plain>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            data-sidebar-skeleton="item"
            data-collapsed={collapsed || undefined}
            className={styles.action}
          >
            <span className={styles.icon}>
              <Skeleton className="size-4" rounded="rounded-md" />
            </span>
            {!collapsed && (
              <Skeleton className="h-3 w-24" rounded="rounded-md" />
            )}
          </div>
        ))}
        </SegmentedTabsFrame>
      </div>
      <div
        className={`${styles.footer} shrink-0 border-t border-slate-200 p-3 dark:border-white/10`}
      >
        {!platformAdminTheme && (
          <div className="space-y-1">
            <div
              data-sidebar-skeleton="plan"
              className={sidebarPlanButtonClassName(collapsed)}
            >
              <span className={styles.icon}>
                <Skeleton className="size-4" rounded="rounded-md" />
              </span>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="flex h-[15px] items-center">
                    <Skeleton className="h-2.5 w-16" rounded="rounded-md" />
                  </div>
                  <div className="flex h-5 items-center">
                    <Skeleton className="h-3.5 w-16" rounded="rounded-md" />
                  </div>
                </div>
              )}
            </div>
            <div
              data-sidebar-skeleton="support"
              data-collapsed={collapsed || undefined}
              className={styles.action}
            >
              <span className={styles.icon}>
                <Skeleton className="size-4" rounded="rounded-md" />
              </span>
              {!collapsed && (
                <Skeleton className="h-3 w-28" rounded="rounded-md" />
              )}
            </div>
          </div>
        )}
        {platformAdminTheme && (
          <div
            data-sidebar-skeleton="settings"
            data-collapsed={collapsed || undefined}
            className={styles.action}
          >
            <span className={styles.icon}>
              <Skeleton className="size-4" rounded="rounded-md" />
            </span>
            {!collapsed && (
              <Skeleton className="h-3 w-24" rounded="rounded-md" />
            )}
          </div>
        )}
        <div
          data-sidebar-skeleton="website"
          data-collapsed={collapsed || undefined}
          className={styles.action}
        >
          <span className={styles.icon}>
            <Skeleton className="size-4" rounded="rounded-md" />
          </span>
          {!collapsed && <Skeleton className="h-3 w-16" rounded="rounded-md" />}
        </div>
      </div>
    </aside>
  );
}
