import type { ReactNode } from "react";
import { DashboardSurface } from "./DashboardSurface";
import { Skeleton } from "./SkeletonBlock";
import styles from "./page-management.module.css";

/** One collection shell for Pages and Forms; card/row content remains feature-owned. */
export function PageManagementSection({
  title,
  description,
  icon,
  toolbar,
  action,
  children,
  loading = false,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  toolbar?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  loading?: boolean;
}) {
  return (
    <DashboardSurface padded={false} className={styles.section}>
      <div className={`${styles.heading} flex-wrap`} aria-hidden={loading || undefined}>
        <div className={styles.icon} aria-hidden="true">
          {loading ? (
            <Skeleton className="size-5" rounded="rounded-md" />
          ) : (
            icon
          )}
        </div>
        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-28" rounded="rounded-md" />
              <Skeleton className="h-3 w-72 max-w-full" rounded="rounded-md" />
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {title}
              </h2>
              {description && (
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              )}
            </>
          )}
        </div>
        {action && <div className="ms-auto flex shrink-0 items-center gap-2">{action}</div>}
      </div>
      {toolbar != null && <div className={styles.toolbarArea}>{toolbar}</div>}
      <div className={styles.content}>{children}</div>
    </DashboardSurface>
  );
}
