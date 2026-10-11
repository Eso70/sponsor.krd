"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { FormAnalytics, FormSubmissionFilters } from "@linktree/types";
import { X } from "lucide-react";
import { ManagementDrawer } from "@/components/shared/ManagementDrawer";
import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal";
import { FormInsightsActions } from "./FormInsightsActions";
import { SkeletonTable } from "@/components/shared/Skeleton";
import { FormsStatsSkeleton } from "./FormSkeletons";
import { FormAnalyticsOverview } from "./FormAnalyticsOverview";
import { FormResponseFilters } from "./FormResponseFilters";
import { exportFormResponses } from "../form-responses-export";
import { FormRequestError } from "./FormRequestError";
import { FormSubmissionsTable } from "./FormSubmissionsTable";
import { formsApi, type FormsScope } from "../api";
import type { FormSummary, FormSubmissionsPage, FormLanguage } from "../types";
import type { FormsCopy } from "../forms-copy";

export function FormInsightsModal({
  form,
  scope,
  locale,
  copy,
  onClose,
  accentColor,
  headerControls,
  canDeleteResponses = false,
  onResponsesDeleted,
}: {
  form: FormSummary;
  scope: FormsScope;
  locale: FormLanguage;
  copy: FormsCopy;
  onClose: () => void;
  accentColor?: string | null;
  headerControls?: ReactNode;
  canDeleteResponses?: boolean;
  onResponsesDeleted?: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const deleteLock = useRef(false);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<FormSubmissionFilters>({
    pageSize: 20,
  });
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ count: 0, total: 0 });
  const [exportFailed, setExportFailed] = useState(false);
  const exportController = useRef<AbortController | null>(null);
  useEffect(() => () => exportController.current?.abort(), []);

  const [data, setData] = useState<FormSubmissionsPage>({
    items: [],
    total: 0,
  });
  const [metrics, setMetrics] = useState<FormAnalytics | undefined>();
  const [responseLoading, setResponseLoading] = useState(true),
    [statsLoading, setStatsLoading] = useState(true);
  const [responseFailed, setResponseFailed] = useState(false),
    [statsFailed, setStatsFailed] = useState(false);
  const [responseRevision, setResponseRevision] = useState(0),
    [statsRevision, setStatsRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const request = () => {
      formsApi
        .submissions(scope, form.id, page, controller.signal, filters)
        .then((result) => {
          if (!controller.signal.aborted) setData(result);
        })
        .catch(() => {
          if (!controller.signal.aborted) setResponseFailed(true);
        })
        .finally(() => {
          if (!controller.signal.aborted) setResponseLoading(false);
        });
    };
    const timeout = filters.q ? window.setTimeout(request, 300) : undefined;
    if (!filters.q) request();
    return () => {
      if (timeout !== undefined) window.clearTimeout(timeout);
      controller.abort();
    };
  }, [scope, form.id, page, responseRevision, filters]);
  useEffect(() => {
    const controller = new AbortController();
    formsApi
      .analytics(scope, form.id, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setMetrics(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatsFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setStatsLoading(false);
      });
    return () => controller.abort();
  }, [scope, form.id, statsRevision]);
  const retryResponses = () => {
    setResponseFailed(false);
    setResponseLoading(true);
    setResponseRevision((value) => value + 1);
  };
  const retryStats = () => {
    setStatsFailed(false);
    setStatsLoading(true);
    setStatsRevision((value) => value + 1);
  };
  const exportResponses = async () => {
    const controller = new AbortController();
    exportController.current = controller;
    setExporting(true);
    setExportFailed(false);
    setExportProgress({ count: 0, total: 0 });
    try {
      await exportFormResponses(
        scope,
        form,
        filters,
        copy,
        controller.signal,
        (count, total) => setExportProgress({ count, total }),
      );
    } catch {
      if (!controller.signal.aborted) setExportFailed(true);
    } finally {
      if (exportController.current === controller) {
        exportController.current = null;
        setExporting(false);
      }
    }
  };
  const deleteResponses = async () => {
    if (deleteLock.current || !canDeleteResponses) return;
    deleteLock.current = true;
    setDeleting(true);
    setDeleteFailed(false);
    try {
      await formsApi.deleteSubmissions(scope, form.id);
      setData({ items: [], total: 0 });
      setMetrics(undefined);
      setPage(0);
      setFilters({ pageSize: filters.pageSize });
      setExportFailed(false);
      retryResponses();
      retryStats();
      onResponsesDeleted?.();
    } catch (error) {
      setDeleteFailed(true);
      throw error;
    } finally {
      deleteLock.current = false;
      setDeleting(false);
    }
  };
  return (
    <>
      <ManagementDrawer
        isOpen
        onClose={onClose}
        title={`${copy.insights} · ${form.name}`}
        closeLabel={copy.close}
        extraWide
        accentColor={accentColor}
        busy={deleting}
        stackHeaderOnMobile
        headerAction={
          <FormInsightsActions
            copy={copy}
            headerControls={headerControls}
            refreshing={responseLoading || statsLoading}
            refreshDisabled={
              responseLoading || statsLoading || exporting || deleting
            }
            exportDisabled={
              exporting ||
              responseLoading ||
              responseFailed ||
              !data.total ||
              deleting
            }
            deleteDisabled={
              responseLoading ||
              statsLoading ||
              responseFailed ||
              exporting ||
              deleting
            }
            canDelete={canDeleteResponses}
            onRefresh={() => {
              retryResponses();
              retryStats();
            }}
            onExport={() => {
              void exportResponses();
            }}
            onDelete={() => {
              setDeleteFailed(false);
              setConfirmDelete(true);
            }}
          />
        }
      >
        <div dir={locale === "en" ? "ltr" : "rtl"} className="space-y-5">
          <section aria-label={copy.analytics}>
            {statsLoading ? (
              <FormsStatsSkeleton compact label={copy.loading} />
            ) : statsFailed ? (
              <>
                <FormRequestError message={copy.analyticsError} />
                <button
                  type="button"
                  onClick={retryStats}
                  className="text-sm font-semibold underline"
                >
                  {copy.retry}
                </button>
              </>
            ) : metrics ? (
              <FormAnalyticsOverview
                metrics={metrics}
                copy={copy}
                locale={locale}
              />
            ) : null}
          </section>
          <section aria-label={copy.submissions} className="space-y-4">
            <h2 className="text-base font-bold">
              {copy.submissions}
              {!responseLoading && !responseFailed ? ` (${data.total})` : ""}
            </h2>
            <FormResponseFilters
              filters={filters}
              disabled={exporting}
              copy={copy}
              onChange={(next) => {
                setResponseFailed(false);
                setResponseLoading(true);
                setPage(0);
                setFilters(next);
              }}
            />
            {exportFailed && <FormRequestError message={copy.exportError} />}
            {exporting && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-center justify-between rounded-xl bg-sky-50 px-4 py-3 text-xs text-sky-700 dark:bg-sky-500/10 dark:text-sky-200"
              >
                <span>
                  {copy.exporting} · {exportProgress.count.toLocaleString()} /{" "}
                  {exportProgress.total.toLocaleString()}
                </span>
                <button
                  type="button"
                  aria-label={copy.cancelExport}
                  onClick={() => exportController.current?.abort()}
                  className="rounded-lg p-1"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
            {responseLoading ? (
              <SkeletonTable columns={3} loadingLabel={copy.loading} />
            ) : responseFailed ? (
              <>
                <FormRequestError message={copy.responsesError} />
                <button
                  type="button"
                  onClick={retryResponses}
                  className="text-sm font-semibold underline"
                >
                  {copy.retry}
                </button>
              </>
            ) : (
              <FormSubmissionsTable
                key={`${page}-${filters.pageSize}-${responseRevision}`}
                data={data}
                pageSize={filters.pageSize}
                page={page}
                onPageChange={(next) => {
                  setResponseLoading(true);
                  setResponseFailed(false);
                  setPage(next);
                }}
                copy={copy}
                locale={locale}
              />
            )}
          </section>
        </div>
      </ManagementDrawer>
      <ConfirmDeleteModal
        zIndexClassName="z-[150]"
        isOpen={confirmDelete}
        onClose={() => {
          if (!deleteLock.current) setConfirmDelete(false);
        }}
        onConfirm={deleteResponses}
        title={copy.deleteResponses}
        message={
          <>
            {copy.deleteResponsesMessage}
            {deleteFailed && (
              <FormRequestError message={copy.deleteResponsesError} />
            )}
          </>
        }
        confirmLabel={copy.deleteResponses}
        loadingLabel={copy.deletingResponses}
        cancelLabel={copy.cancel}
        closeLabel={copy.close}
        isDeleting={deleting}
      />
    </>
  );
}
