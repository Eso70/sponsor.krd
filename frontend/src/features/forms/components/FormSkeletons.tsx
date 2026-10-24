import { formsCopy, type FormsCopy } from "../forms-copy";
import { formEditorCopy } from "../form-editor-copy";
import { PublicFormShell } from "./PublicFormShell";
import styles from "./FormPreview.module.css";
import { SkeletonPageManagement } from "@/components/shared/SkeletonPageLayouts";
import { FormsStats } from "./FormsStats";
import { Skeleton, SkeletonStatCard } from "@/components/shared/Skeleton";
import type { StatCardColor } from "@/components/shared/StatCard";
import { StatCardGrid } from "@/components/shared/StatCardGrid";

export function FormsStatsSkeleton({
  label,
  compact = false,
  copy = formsCopy("en"),
}: {
  label: string;
  compact?: boolean;
  copy?: FormsCopy;
}) {
  if (!compact) return <div role="status" aria-busy="true" aria-label={label}>
    <div aria-hidden="true"><FormsStats count={0} copy={copy} loading /></div>
  </div>;
  const colors: StatCardColor[] = ["purple", "green", "orange", "theme", "slate", "blue"];
  return (
    <div role="status" aria-busy="true" aria-label={label}>
      <StatCardGrid columns={3}>
        {[
          copy.views, copy.starts, copy.submissions,
          copy.rate, copy.visitors, copy.interactions,
        ].map((title, index) => (
          <SkeletonStatCard
            key={title}
            color={colors[index]}
            showDetail={title === copy.rate}
          />
        ))}
      </StatCardGrid>
    </div>
  );
}

/** Also used by the public route while the form's layout is still unknown. */
export function FormPreviewSkeleton({
  publicPage = false,
  copy = formsCopy("en"),
}: { publicPage?: boolean; copy?: FormsCopy } = {}) {
  return (
    <div
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
        <p className="text-sm font-semibold">{copy.questions}</p>
        {[0, 1, 2].map((index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className={publicPage ? "h-14 w-full" : "h-10 w-full"} />
          </div>
        ))}
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" disabled />
          {copy.consentText}
        </label>
        <button
          type="button"
          disabled
          className="h-10 w-full rounded-lg bg-slate-200 text-sm font-semibold opacity-60 dark:bg-white/10"
        >
          {copy.submit}
        </button>
      </div>
    </div>
  );
}

export function FormEditorSkeleton({
  label,
  previewOnly = false,
  copy = formsCopy("en"),
}: {
  label: string;
  previewOnly?: boolean;
  copy?: FormsCopy;
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
          <label className="block space-y-2 text-xs font-semibold">
            {copy.name}
            <Skeleton className="h-10 w-full" />
          </label>
          <div className="flex gap-4 border-b pb-3 text-sm">
            <span>{copy.content}</span>
            <span>{copy.final}</span>
          </div>
          {[
            copy.banner,
            formEditorCopy(
              copy === formsCopy("en")
                ? "en"
                : copy === formsCopy("ar")
                  ? "ar"
                  : "ckb",
            ).introduction,
            copy.questions,
            formEditorCopy(
              copy === formsCopy("en")
                ? "en"
                : copy === formsCopy("ar")
                  ? "ar"
                  : "ckb",
            ).privacy,
          ].map((title) => (
            <div
              key={title}
              className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-white/10"
            >
              <p className="text-sm font-semibold">{title}</p>
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      )}
      <div className={previewOnly ? "lg:col-span-2" : ""}>
        <FormPreviewSkeleton copy={copy} />
      </div>
    </div>
  );
}

export function PublicFormSkeleton({
  label,
  copy = formsCopy("en"),
}: {
  label: string;
  copy?: FormsCopy;
}) {
  return (
    <PublicFormShell loadingLabel={label}>
      <FormPreviewSkeleton publicPage copy={copy} />
    </PublicFormShell>
  );
}

/** Real column headings stay visible; only unknown record cells pulse. */
export function FormRowsSkeleton({
  headers,
  label,
}: {
  headers: string[];
  label: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className="min-w-0 w-full max-w-full overflow-x-auto rounded-2xl border border-slate-200/70 dark:border-white/10"
    >
      <div className="space-y-3 p-3 md:hidden">
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 p-3 dark:border-white/10"
          >
            {headers.map((header) => (
              <div key={header} className="space-y-2">
                <p className="text-xs text-slate-500">{header}</p>
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
      <table className="hidden w-full min-w-[640px] text-start text-xs md:table">
        <thead className="bg-slate-50 dark:bg-white/5">
          <tr>
            {headers.map((header) => (
              <th key={header} className="p-3 text-start font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[0, 1, 2, 3, 4].map((row) => (
            <tr
              key={row}
              className="border-t border-slate-100 dark:border-white/5"
            >
              {headers.map((header) => (
                <td key={header} className="p-3">
                  <Skeleton className="h-4 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function FormResponsesSkeleton({
  copy,
  essential = false,
}: {
  copy: FormsCopy;
  essential?: boolean;
}) {
  return (
    <FormRowsSkeleton
      label={copy.loading}
      headers={[
        copy.submittedAt,
        copy.answerPreview,
        ...(!essential ? [copy.source, copy.timeSpent] : []),
        copy.viewDetails,
      ]}
    />
  );
}

export function FormsPageSkeleton({ copy }: { copy: FormsCopy }) {
  return <SkeletonPageManagement loadingLabel={copy.loading}
    stats={<FormsStats count={0} copy={copy} loading />} />;
}
