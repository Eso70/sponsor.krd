"use client";
import { apiRequest } from "@/lib/api/request";
import { PageAnalyticsContent } from "./PageAnalyticsContent";

import { PageAnalyticsHeaderActions } from "./PageAnalyticsHeaderActions";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ManagementDrawer } from "@/components/shared/ManagementDrawer";
import { PageAnalyticsRange } from "./PageAnalyticsRange";
import { toast } from "sonner";
import { PageAnalyticsSkeleton } from "./PageAnalyticsSkeleton";
import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal";
import {
  pageAnalyticsCopy,
  type PageAnalyticsCopy,
} from "../page-analytics-copy";
export type { PageAnalyticsCopy } from "../page-analytics-copy";
import type {
  PageAnalyticsTotals as Totals,
  PageAnalyticsAction as ActionRow,
} from "@linktree/types";
import { presetToRange, type DateRangePreset } from "../page-analytics-range";
export type { DateRangePreset } from "../page-analytics-range";
import { InlineRequestError } from "@/components/shared/InlineRequestError";

/**
 * The kind of page being inspected.
 *
 * Linktree analytics use the shared drawer across business and platform
 * workspaces.
 */
export type AnalyticsPageKind = "linktree";

export type PageAnalyticsDataSource = "business" | "platform-linktree";

interface PageAnalyticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
  pageName: string;
  pageKind?: AnalyticsPageKind;
  canClearAnalytics?: boolean;
  /** Reuses this drawer shell and its stat cards without business-only actions. */
  summaryOnly?: boolean;
  dataSource?: PageAnalyticsDataSource;
  onAnalyticsCleared?: () => void | Promise<void>;
  platformTheme?: boolean;
  copy?: Partial<PageAnalyticsCopy>;
  locale?: "en" | "ar" | "ckb";
  headerControls?: ReactNode;
}

function summaryUrl(
  dataSource: PageAnalyticsDataSource,
  pageId: string,
  bypassCache: boolean,
  from?: string,
  to?: string,
): string {
  const params = new URLSearchParams();
  if (bypassCache) params.set("_t", String(Date.now()));
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  if (dataSource === "platform-linktree") {
    const query = params.toString();
    return `/api/platform/linktrees/${pageId}/analytics${query ? `?${query}` : ""}`;
  }

  params.set("pageId", pageId);
  return `/api/analytics/v2/summary?${params}`;
}

/**
 * The per-action rows for a page.
 *
 * Each role uses its own guarded endpoint while this shared modal keeps the
 * date filters, totals, conversions, and button rows identical.
 */
function actionsUrl(
  dataSource: PageAnalyticsDataSource,
  pageId: string,
  bypassCache: boolean,
  from?: string,
  to?: string,
): string {
  const params = new URLSearchParams();
  if (bypassCache) params.set("_t", String(Date.now()));
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  if (dataSource === "platform-linktree") {
    const query = params.toString();
    return `/api/platform/linktrees/${pageId}/analytics/actions${query ? `?${query}` : ""}`;
  }

  params.set("pageId", pageId);
  return `/api/analytics/v2/pages/${pageId}/actions?${params}`;
}

function clearUrl(dataSource: PageAnalyticsDataSource, pageId: string): string {
  return dataSource === "platform-linktree"
    ? `/api/platform/linktrees/${pageId}/analytics`
    : `/api/analytics/v2/pages/${pageId}`;
}

export function PageAnalyticsDrawer({
  isOpen,
  onClose,
  pageId,
  pageName,
  canClearAnalytics = true,
  summaryOnly = false,
  dataSource = "business",
  locale,
  onAnalyticsCleared,
  platformTheme = false,
  copy,
  headerControls,
}: PageAnalyticsDrawerProps) {
  const activeLocale =
    locale ?? (copy?.refresh === "Refresh" ? "en" : copy ? "ar" : "ckb");
  const labels = { ...pageAnalyticsCopy(activeLocale), ...copy };
  const labelsRef = useRef(labels);
  useEffect(() => {
    labelsRef.current = labels;
  });
  const [totals, setTotals] = useState<Totals | null>(null);
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Time-range filter
  const [preset, setPreset] = useState<DateRangePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const dataRef = useRef(0);

  /** Derived from/to strings that are passed to every API request. */
  const effectiveRange = useMemo(
    () => presetToRange(preset, customFrom, customTo),
    [preset, customFrom, customTo],
  );

  const load = useCallback(
    async (bypassCache = false, range?: { from?: string; to?: string }) => {
      const reqId = ++dataRef.current;
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;

      // Both reads are addressed by data source so platform requests never
      // fall through to business endpoints protected by `BusinessGuard`.
      const [totalsResult, actionsResult] = await Promise.allSettled([
        apiRequest<Totals>(
          summaryUrl(dataSource, pageId, bypassCache, range?.from, range?.to),
          { signal: controller.signal },
        ),
        summaryOnly
          ? Promise.resolve<ActionRow[]>([])
          : apiRequest<ActionRow[]>(
              actionsUrl(
                dataSource,
                pageId,
                bypassCache,
                range?.from,
                range?.to,
              ),
              { signal: controller.signal },
            ),
      ]);
      if (reqId !== dataRef.current || controller.signal.aborted) return;

      let hadError = false;

      if (totalsResult.status === "fulfilled") {
        setTotals(totalsResult.value ?? null);
      } else {
        hadError = true;
        setTotals(null);
        console.error("Analytics summary load failed:", totalsResult.reason);
      }

      if (actionsResult.status === "fulfilled") {
        // A malformed payload would otherwise crash the list on `.filter`.
        setActions(
          Array.isArray(actionsResult.value) ? actionsResult.value : [],
        );
      } else {
        hadError = true;
        setActions([]);
        console.error("Analytics actions load failed:", actionsResult.reason);
      }

      if (hadError) {
        toast.error(labelsRef.current.loadFailed);
      } else {
        setLastUpdated(new Date());
      }
      setLoadFailed(hadError);

      if (reqId === dataRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dataSource, pageId, summaryOnly],
  );

  // Initial load / re-load when the modal opens (or when pageId changes).
  useEffect(() => {
    if (!isOpen) return;
    const frame = window.requestAnimationFrame(() => {
      setLoading(true);
      setTotals(null);
      setActions([]);
      setLoadFailed(false);

      // Reset time filter to "all" when the modal re-opens for a new page.
      setPreset("all");
      setCustomFrom("");
      setCustomTo("");
      void load(false, {});
    });
    return () => {
      window.cancelAnimationFrame(frame);
      requestRef.current?.abort();
    };
  }, [isOpen, load]);

  // Re-fetch whenever the effective date range changes (user picks a preset
  // or finishes entering a custom range). Skip the very first render because
  // the modal-open effect above handles that initial fetch.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (!isOpen) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setLoading(true);

    void load(false, effectiveRange);
    // load is stable (useCallback); effectiveRange identity changes only when
    // preset / customFrom / customTo actually change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveRange]);

  const refresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    void load(true, effectiveRange);
  };

  const handleClearAnalytics = async () => {
    setIsClearing(true);
    try {
      await apiRequest(clearUrl(dataSource, pageId), {
        method: "DELETE",
      });
      setTotals(null);
      setActions([]);
      setLastUpdated(new Date());
      await onAnalyticsCleared?.();
      toast.success(labels.cleared);
    } catch (error) {
      toast.error(labels.clearFailed, {
        description: error instanceof Error ? error.message : undefined,
      });
      throw error;
    } finally {
      setIsClearing(false);
    }
  };

  // Clicks count too: a page can be reached from a QR code or a shared button
  // and record clicks without a single recorded view.
  const hasAnyData = totals
    ? totals.total_views > 0 ||
      totals.total_clicks > 0 ||
      actions.some((action) => action.totalClicks > 0 || action.conversions > 0)
    : actions.some(
        (action) => action.totalClicks > 0 || action.conversions > 0,
      );

  return (
    <>
      <ManagementDrawer
        isOpen={isOpen}
        onClose={onClose}
        extraWide
        compactHeader
        stackHeaderOnMobile
        sponsorKrdTheme={platformTheme}
        busy={isClearing}
        title={`${labels.title} ${pageName}`}
        closeLabel={labels.close}
        description={
          lastUpdated
            ? `${labels.lastUpdated} ${new Intl.DateTimeFormat(activeLocale, { hour: "2-digit", minute: "2-digit" }).format(lastUpdated)}`
            : summaryOnly
              ? labels.summary
              : labels.allData
        }
        headerAction={
          <PageAnalyticsHeaderActions
            labels={labels}
            canClear={canClearAnalytics}
            hasData={hasAnyData}
            refreshing={refreshing}
            clearing={isClearing}
            onClear={() => setIsClearModalOpen(true)}
            onRefresh={refresh}
            headerControls={headerControls}
          />
        }
      >
        {loadFailed && (
          <InlineRequestError
            error={{
              code: "ANALYTICS_LOAD_FAILED",
              status: null,
              title: labels.loadFailed,
              message: labels.refresh,
            }}
          />
        )}
        {loading ? (
          // Shaped like what loads: the stat tiles, then the action list.
          <PageAnalyticsSkeleton
            summaryOnly={summaryOnly}
            locale={activeLocale}
            labels={labels}
          />
        ) : (
          <PageAnalyticsContent
            totals={totals}
            actions={actions}
            summaryOnly={summaryOnly}
            pageId={pageId}
            locale={activeLocale}
            labels={labels}
            rangeControl={
              !summaryOnly && (
                <PageAnalyticsRange
                  labels={labels}
                  locale={activeLocale}
                  preset={preset}
                  setPreset={setPreset}
                  customFrom={customFrom}
                  setCustomFrom={setCustomFrom}
                  customTo={customTo}
                  setCustomTo={setCustomTo}
                />
              )
            }
          />
        )}
      </ManagementDrawer>

      {canClearAnalytics && (
        <ConfirmDeleteModal
          isOpen={isOpen && isClearModalOpen}
          onClose={() => {
            if (!isClearing) setIsClearModalOpen(false);
          }}
          onConfirm={handleClearAnalytics}
          title={labels.clearTitle}
          confirmLabel={labels.confirmClear}
          loadingLabel={labels.clearing}
          cancelLabel={labels.cancel}
          closeLabel={labels.close}
          isDeleting={isClearing}
          zIndexClassName="z-[160]"
          message={<p>{labels.clearQuestion}</p>}
        />
      )}
    </>
  );
}
