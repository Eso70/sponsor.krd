import { ManagementCard } from "./ManagementCard";
import { ManagementGridLayout } from "./ManagementGridLayout";
import { PageListCardMedia } from "./PageListCardMedia";
import { Skeleton } from "./SkeletonBlock";
import { SkeletonTable } from "./Skeleton";
import styles from "./management-collection.module.css";
import { SHARED_CONTROL_CLASS } from "./shared-control-styles";

/** Server-safe loading geometry shared by Forms and Linktree collections. */
export function PageCollectionSkeleton({
  viewMode = "grid",
  count = 6,
  columns = 8,
  showPageMeta = true,
  showTableBanner = false,
  selectable = false,
  announce = true,
  loadingLabel = "Loading page cards",
}: {
  viewMode?: "grid" | "table";
  count?: number;
  columns?: number;
  showPageMeta?: boolean;
  selectable?: boolean;
  showTableBanner?: boolean;
  announce?: boolean;
  loadingLabel?: string;
}) {
  if (viewMode === "table")
    return (
      <div aria-hidden={announce ? undefined : true}>
        <SkeletonTable
          rows={count}
          columns={columns}
          leadingCell={selectable ? "checkbox" : "text"}
          loadingLabel={loadingLabel}
          mediaColumn={showTableBanner ? (selectable ? 1 : 0) : undefined}
        />
      </div>
    );
  return (
    <div
      role={announce ? "status" : undefined}
      aria-busy={announce ? true : undefined}
      aria-label={announce ? loadingLabel : undefined}
    >
      <ManagementGridLayout
        desktopColumns={3}
        items={Array.from({ length: count }, (_, index) => ({
          key: String(index),
          content: (
            <article aria-hidden="true" className="h-full">
              <ManagementCard
                intrinsicHeight={480}
                className="text-center"
                media={
                  <PageListCardMedia
                    selection={
                      selectable ? (
                        <Skeleton className="size-5" rounded="rounded-md" />
                      ) : undefined
                    }
                    action={
                      <Skeleton className="size-4" rounded="rounded-md" />
                    }
                  >
                    <Skeleton
                      className="aspect-[3/1] w-full"
                      rounded="rounded-none"
                    />
                  </PageListCardMedia>
                }
              >
                <div className="relative -mt-9 mb-3 text-center sm:-mt-12 md:-mt-[52px]">
                  <Skeleton
                    className="relative z-10 mx-auto mb-3 size-10 sm:size-14"
                    rounded="rounded-full"
                  />
                  <Skeleton
                    className="mx-auto mb-2 h-4 w-2/3"
                    rounded="rounded-md"
                  />
                  <div className="flex justify-center gap-1.5">
                    <Skeleton className="h-4 w-16" rounded="rounded-md" />
                    <Skeleton className="h-4 w-20" rounded="rounded-md" />
                  </div>
                </div>
                <Skeleton
                  className="mx-auto mb-3 h-3 w-3/4"
                  rounded="rounded-md"
                />
                <div className={`${SHARED_CONTROL_CLASS} mb-3 p-2 sm:p-2.5`}>
                  <div className="flex items-center gap-2">
                    <Skeleton
                      className="ms-1 size-4 shrink-0"
                      rounded="rounded-md"
                    />
                    <Skeleton className="h-3 flex-1" rounded="rounded-md" />
                    <Skeleton
                      className="size-8 shrink-0 sm:size-9"
                      rounded="rounded-lg"
                    />
                  </div>
                </div>
                {showPageMeta && (
                  <>
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      {[0, 1].map((key) => (
                        <div key={key} className="space-y-1">
                          <Skeleton
                            className="mx-auto h-2 w-12"
                            rounded="rounded-md"
                          />
                          <Skeleton
                            className="mx-auto h-3 w-20 max-w-full"
                            rounded="rounded-md"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      <Skeleton
                        className="h-9 w-full sm:h-10"
                        rounded="rounded-[14px]"
                      />
                      <Skeleton
                        className="h-9 w-full sm:h-10"
                        rounded="rounded-[14px]"
                      />
                    </div>
                  </>
                )}
                <div
                  className={`${styles.cardActions} mt-auto border-t border-gray-200 pt-2 sm:gap-1.5 sm:pt-2.5 dark:border-white/10`}
                >
                  {[0, 1, 2, 3, 4].map((key) => (
                    <div
                      key={key}
                      data-page-action
                      data-primary-action={key < 2}
                      className={`h-8 sm:h-9 ${key < 2 ? "min-w-0 flex-1" : "w-8 shrink-0 sm:w-9"}`}
                    >
                      <Skeleton
                        className="h-full w-full"
                        rounded="rounded-lg sm:rounded-xl"
                      />
                    </div>
                  ))}
                </div>
              </ManagementCard>
            </article>
          ),
        }))}
      />
    </div>
  );
}
