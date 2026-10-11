import { PublicFormShell } from "./PublicFormShell";
import styles from "./FormPreview.module.css";
import {
  Skeleton,
  SkeletonForm,
  SkeletonStatCard,
  SkeletonTable,
} from "@/components/shared/Skeleton";
import { StatCardGrid } from "@/components/shared/StatCardGrid";
import { ManagementGrid } from "@/components/shared/ManagementGrid";
import { ManagementCard } from "@/components/shared/ManagementCard";

export function FormsStatsSkeleton({
  label,
  compact = false,
}: {
  label: string;
  compact?: boolean;
}) {
  return (
    <div role="status" aria-busy="true" aria-label={label}>
      <StatCardGrid columns={3} className={compact ? "" : "mb-8"}>
        {Array.from({ length: 6 }, (_, index) => (
          <SkeletonStatCard key={index} />
        ))}
      </StatCardGrid>
    </div>
  );
}

export function FormsCollectionSkeleton({
  label,
  viewMode,
}: {
  label: string;
  viewMode: "grid" | "table";
}) {
  if (viewMode === "table")
    return <SkeletonTable columns={8} loadingLabel={label} />;
  return (
    <div role="status" aria-busy="true" aria-label={label}>
      <ManagementGrid
        desktopColumns={3}
        data={[0, 1, 2, 3, 4, 5]}
        getItemKey={(index) => String(index)}
        renderItem={() => (
          <ManagementCard intrinsicHeight={320}>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-14" rounded="rounded-full" />
                <Skeleton className="h-5 w-2/3" />
              </div>
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
              <div className="flex gap-2 pt-4">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="size-9" />
              </div>
            </div>
          </ManagementCard>
        )}
      />
    </div>
  );
}

/** Also used by the public route while the form's layout is still unknown. */
export function FormPreviewSkeleton({
  publicPage = false,
}: { publicPage?: boolean } = {}) {
  return (
    <div
      aria-hidden="true"
      className={`${publicPage ? `${styles.publicSurface} ${styles.surface}` : "mx-auto w-full max-w-sm rounded-2xl border"} overflow-hidden border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900`}
    >
      <Skeleton
        className={publicPage ? "h-52 w-full sm:h-80" : "h-36 w-full"}
        rounded="rounded-none"
      />
      <div
        className={
          publicPage
            ? "mx-auto w-full max-w-4xl space-y-6 px-5 py-8 sm:px-12"
            : "space-y-6 p-4"
        }
      >
        <Skeleton
          className={publicPage ? "mx-auto size-24" : "mx-auto size-16"}
          rounded="rounded-full"
        />
        <Skeleton className="mx-auto h-5 w-1/2" />
        <Skeleton className="mx-auto h-3 w-3/4" />
        {[0, 1, 2].map((index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className={publicPage ? "h-14 w-full" : "h-10 w-full"} />
          </div>
        ))}
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className={publicPage ? "h-14 w-full" : "h-10 w-full"} />
      </div>
    </div>
  );
}

export function FormEditorSkeleton({
  label,
  previewOnly = false,
}: {
  label: string;
  previewOnly?: boolean;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className="grid min-h-[70dvh] gap-6 lg:h-full lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]"
    >
      {!previewOnly && (
        <div className="space-y-4">
          <Skeleton className="h-10 w-52" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
            <SkeletonForm showMedia={false} fields={4} announce={false} />
          </div>
          <Skeleton className="h-14 w-full" />
        </div>
      )}
      <div className={previewOnly ? "lg:col-span-2" : ""}>
        <FormPreviewSkeleton />
      </div>
    </div>
  );
}

export function PublicFormSkeleton({ label }: { label: string }) {
  return (
    <PublicFormShell loadingLabel={label}>
      <FormPreviewSkeleton publicPage />
    </PublicFormShell>
  );
}
