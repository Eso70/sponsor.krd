"use client";
import { useEffect, useRef, useState } from "react";
import type {
  FormSubmissionFilters,
  FormSubmissionsPage,
  FormSummary,
} from "@linktree/types";
import { toast } from "sonner";
import { ApiRequestError, apiRequest } from "@/lib/api/request";
import { FormExportProgress } from "@/features/forms/components/FormExportProgress";
import { FormResponseFilters } from "@/features/forms/components/FormResponseFilters";
import { FormSubmissionsTable } from "@/features/forms/components/FormSubmissionsTable";
import { FormExportMenu } from "@/features/forms/components/FormExportMenu";
import { FormExportRange } from "@/features/forms/components/FormExportRange";
import { FormResponsesSkeleton } from "@/features/forms/components/FormSkeletons";
import { SHARED_SOFT_BUTTON_CLASS } from "@/components/shared/shared-control-styles";
import { formsCopy } from "@/features/forms/forms-copy";
import { exportResponsePages } from "@/features/forms/form-responses-export";
import { sharingCopy, type SharingLocale } from "../sharing-copy";

function responseUrl(
  base: string,
  page: number,
  filters: FormSubmissionFilters,
) {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(filters.pageSize ?? 20),
  });
  for (const key of ["q", "from", "to", "before"] as const)
    if (filters[key]) query.set(key, filters[key]);
  return `${base}/responses?${query}`;
}

export function SharedFormResponses({
  apiBase,
  initialData,
  name,
  definition,
  locale,
  onAccessLost,
}: {
  apiBase: string;
  initialData: FormSubmissionsPage;
  name: string;
  definition?: Pick<FormSummary, "id" | "name" | "slug">;
  locale: SharingLocale;
  onAccessLost: () => void;
}) {
  const copy = formsCopy(locale);
  const [filters, setFilters] = useState<FormSubmissionFilters>({
    pageSize: 20,
  });
  const [page, setPage] = useState(0);
  const [data, setData] = useState<FormSubmissionsPage | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState({ count: 0, total: 0 });
  const exportController = useRef<AbortController | null>(null);
  const accessLost = useRef(onAccessLost);
  useEffect(() => {
    accessLost.current = onAccessLost;
  }, [onAccessLost]);
  useEffect(() => () => exportController.current?.abort(), []);
  const invalidRange =
    !!filters.from && !!filters.to && filters.from > filters.to;
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(
      () => {
        if (invalidRange) {
          setData(null);
          setLoading(false);
          return;
        }
        if (
          !revision &&
          page === 0 &&
          !filters.q &&
          !filters.from &&
          !filters.to &&
          filters.pageSize === 20
        ) {
          setData(initialData);
          setFailed(false);
          setLoading(false);
          return;
        }
        setLoading(true);
        setFailed(false);
        void apiRequest<FormSubmissionsPage>(
          responseUrl(apiBase, page, filters),
          { signal: controller.signal },
        )
          .then((result) => {
            if (!controller.signal.aborted) setData(result);
          })
          .catch((error) => {
            if (controller.signal.aborted) return;
            setData(null);
            setFailed(true);
            if (
              error instanceof ApiRequestError &&
              (error.status === 401 || error.status === 403)
            )
              accessLost.current();
          })
          .finally(() => {
            if (!controller.signal.aborted) setLoading(false);
          });
      },
      filters.q ? 300 : 0,
    );
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [apiBase, filters, page, initialData, revision, invalidRange]);
  function changeFilters(next: FormSubmissionFilters) {
    setData(null);
    setLoading(true);
    setFilters(next);
    setPage(0);
  }
  async function exportCsv(range?: { from: string; to: string }) {
    if (exportController.current) return;
    const controller = new AbortController();
    exportController.current = controller;
    setExporting(true);
    setProgress({ count: 0, total: 0 });
    try {
      await exportResponsePages({
        definition: definition ?? { id: "", name, slug: "form" },
        filters: {
          ...filters,
          from: range?.from ?? filters.from,
          to: range?.to ?? filters.to,
        },
        copy,
        signal: controller.signal,
        onProgress: (count, total) => setProgress({ count, total }),
        readPage: (index, query) =>
          apiRequest<FormSubmissionsPage>(responseUrl(apiBase, index, query), {
            signal: controller.signal,
          }),
      });
      if (!controller.signal.aborted)
        toast.success(copy.notifications.exported);
    } catch (error) {
      if (!controller.signal.aborted) {
        toast.error(copy.exportError);
        if (
          error instanceof ApiRequestError &&
          (error.status === 401 || error.status === 403)
        )
          accessLost.current();
      }
    } finally {
      if (exportController.current === controller) {
        exportController.current = null;
        setExporting(false);
      }
    }
  }
  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold">
          {copy.submissions}
          {!loading && !failed && data ? ` (${data.total})` : ""}
        </h2>
        <FormExportMenu
          copy={copy}
          disabled={exporting || invalidRange || !data?.total}
          onExport={() => void exportCsv()}
          onExportRange={() => setRangeOpen((open) => !open)}
        />
      </div>
      <FormResponseFilters
        filters={filters}
        onChange={changeFilters}
        copy={copy}
        disabled={exporting}
      />
      {invalidRange && (
        <p role="alert" className="text-xs text-rose-600 dark:text-rose-300">
          {copy.exportRangeError}
        </p>
      )}
      {rangeOpen && (
        <FormExportRange
          copy={copy}
          locale={locale}
          disabled={exporting}
          onClose={() => setRangeOpen(false)}
          onExport={(range) => void exportCsv(range)}
        />
      )}
      {exporting && (
        <FormExportProgress
          copy={copy}
          count={progress.count}
          total={progress.total}
          onCancel={() => exportController.current?.abort()}
        />
      )}
      {failed && (
        <div role="alert" className="space-y-2">
          <p className="text-sm text-rose-600 dark:text-rose-300">
            {sharingCopy(locale).failed}
          </p>
          <button
            type="button"
            className={`${SHARED_SOFT_BUTTON_CLASS} px-3 py-2 text-xs`}
            onClick={() => setRevision((value) => value + 1)}
          >
            {sharingCopy(locale).retry}
          </button>
        </div>
      )}
      {loading ? (
        <FormResponsesSkeleton copy={copy} />
      ) : (
        data && (
          <FormSubmissionsTable
            data={data}
            page={page}
            pageSize={filters.pageSize ?? 20}
            onPageChange={(next) => {
              setData(null);
              setLoading(true);
              setPage(next);
            }}
            copy={copy}
            locale={locale}
          />
        )
      )}
    </div>
  );
}
