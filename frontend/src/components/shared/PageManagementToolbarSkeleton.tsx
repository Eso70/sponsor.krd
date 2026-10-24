import { Skeleton } from "./SkeletonBlock";
import { SHARED_SOFT_BUTTON_CLASS } from "./shared-control-styles";
import styles from "./page-management.module.css";

export function PageManagementToolbarSkeleton() {
  return (
    <div className={`${styles.toolbar} pointer-events-none`} aria-hidden="true">
      <span className={`${SHARED_SOFT_BUTTON_CLASS} ${styles.search}`}>
        <Skeleton className="size-4" rounded="rounded-md" />
        <Skeleton className="h-3 w-16 sm:w-24" rounded="rounded-md" />
      </span>
      {[styles.status, styles.view].map((area) => (
        <span key={area} className={`${styles.segmentGroup} ${area}`}>
          {[0, 1].map((key) => (
            <span key={key} className={styles.segment}>
              <Skeleton className="h-3 w-10" rounded="rounded-md" />
            </span>
          ))}
        </span>
      ))}
      <span className={`${SHARED_SOFT_BUTTON_CLASS} ${styles.create}`}>
        <Skeleton className="size-4" rounded="rounded-md" />
        <Skeleton className="h-3 w-12" rounded="rounded-md" />
      </span>
    </div>
  );
}
