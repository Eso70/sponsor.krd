"use client";

import {
  MotionPulse,
  MotionSpinner,
} from "@/components/motion/MotionPrimitives";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  BarChart3,
  Calendar,
  ChevronDown,
  Eye,
  ExternalLink,
  MousePointerClick,
  RefreshCw,
  Target,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { DateTimeInput } from "@/components/shared/DateTimeInput";
import {
  getPlatformColors,
  getPlatformIcon,
  getPlatformName,
} from "@/components/public/LinktreeButtons";
import { toast } from "sonner";
import { useModalKeyboard } from "@/hooks/useModalKeyboard";
import { StatCard } from "@/components/shared/StatCard";
import { SkeletonPageAnalyticsContent } from "@/components/shared/SkeletonModalLayouts";
import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal";
import { StatCardGrid } from "@/components/shared/StatCardGrid";
import { ANALYTICS_TERMS } from "@/components/shared/analytics-terminology";
import { Tooltip } from "@/components/shared/Tooltip";

interface Totals {
  total_views: number;
  unique_views: number;
  total_clicks: number;
  unique_clicks: number;
  conversions: number;
  conversion_value: number;
}

interface ActionRow {
  id: string;
  actionKey?: string;
  metadata?: Record<string, string>;
  label: string;
  actionType: string;
  destination: string | null;
  totalClicks: number;
  uniqueClickers: number;
  conversions: number;
  conversionValue: number;
  ctr: number;
  recordState?: "current" | "historical" | "unattributed";
}

/**
 * The kind of page being inspected.
 *
 * Linktree analytics use the shared modal across business and platform
 * workspaces.
 */
export type AnalyticsPageKind = "linktree";

export type PageAnalyticsDataSource = "business" | "platform-linktree";

interface BusinessPageAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
  pageName: string;
  pageKind?: AnalyticsPageKind;
  canClearAnalytics?: boolean;
  /** Reuses this modal shell and its stat cards without business-only actions. */
  summaryOnly?: boolean;
  dataSource?: PageAnalyticsDataSource;
  onAnalyticsCleared?: () => void | Promise<void>;
  platformTheme?: boolean;
  copy?: Partial<PageAnalyticsCopy>;
  locale?: "en" | "ar" | "ckb";
}

export interface PageAnalyticsCopy {
  loadFailed: string;
  cleared: string;
  clearFailed: string;
  title: string;
  summary: string;
  allData: string;
  lastUpdated: string;
  clearAll: string;
  nothingToClear: string;
  clearData: string;
  refresh: string;
  close: string;
  totalViews: string;
  uniqueViewer: string;
  totalClicks: string;
  uniqueClicker: string;
  clickRate: string;
  conversions: string;
  conversionValue: string;
  conversionRate: string;
  fromDate: string;
  toDate: string;
  buttons: string;
  historyHint: string;
  noData: string;
  unattributedClicks: string;
  unattributedHint: string;
  historical: string;
  unattributed: string;
  clicks: string;
  unique: string;
  actualConversions: string;
  openDestination: string;
  uniqueHint: string;
  clearTitle: string;
  confirmClear: string;
  clearing: string;
  cancel: string;
  clearQuestion: string;
  today: string;
  todayHint: string;
  last24h: string;
  last24hHint: string;
  last7d: string;
  last7dHint: string;
  all: string;
  allHint: string;
  custom: string;
  customHint: string;
}

const KURDISH_COPY: PageAnalyticsCopy = {
  loadFailed: "داتاکانی ئامار بارنەکران",
  cleared: "داتاکانی ئامار پاککرانەوە",
  clearFailed: "پاککردنەوەی داتاکان سەرکەوتوو نەبوو",
  title: "ئاماری",
  summary: "کورتەی ئاماری هەموو ماوە",
  allData: "هەموو داتاکان",
  lastUpdated: "دواین نوێکردنەوە:",
  clearAll: "پاککردنەوەی هەموو داتاکانی ئامار",
  nothingToClear: "هیچ داتایەک نییە بۆ پاککردنەوە",
  clearData: "پاککردنەوەی داتاکان",
  refresh: "نوێکردنەوە",
  close: "داخستن",
  totalViews: ANALYTICS_TERMS.totalViews,
  uniqueViewer: ANALYTICS_TERMS.uniqueViewer,
  totalClicks: ANALYTICS_TERMS.totalClicks,
  uniqueClicker: ANALYTICS_TERMS.uniqueClicker,
  clickRate: ANALYTICS_TERMS.clickRate,
  conversions: "گۆڕانەکان",
  conversionValue: "بەهای گۆڕان",
  conversionRate: "ڕێژەی گۆڕان",
  fromDate: "لە بەرواری",
  toDate: "بۆ بەرواری",
  buttons: "دوگمەکان",
  historyHint:
    "کۆی سەرەوە هەموو کلیکە تۆمارکراوەکان دەگرێتەوە؛ دوگمە سڕاوە یان گۆڕاوەکان لێرە وەک مێژوویی نیشان دەدرێن.",
  noData: "هێشتا هیچ داتایەک نییە",
  unattributedClicks: "کلیکە دیارینەکراوەکان",
  unattributedHint: "کردارێک کە بە دوگمەیەکی دیاریکراو نەبەستراوەتەوە",
  historical: "مێژوویی",
  unattributed: "دیارینەکراو",
  clicks: "کلیک",
  unique: "تاک",
  actualConversions: "گۆڕانی ڕاستەقینە",
  openDestination: "کردنەوەی بەستەری مەبەست",
  uniqueHint:
    "ژمارەی «تاک» بۆ هەر دوگمەیەک بە جیاوازی هەژمار دەکرێت؛ یەک کەس دەتوانێت زیاتر لە دوگمەیەک کلیک بکات، بۆیە ئەو ژمارانە کۆ ناکرێنەوە.",
  clearTitle: "پاککردنەوەی داتاکانی ئامار",
  confirmClear: "بەڵێ، پاکی بکەوە",
  clearing: "پاکدەکرێتەوە...",
  cancel: "هەڵوەشاندنەوە",
  clearQuestion:
    "دڵنیایت لە پاککردنەوەی هەموو داتاکانی بینین و کلیکی ئەم پەڕەیە؟ ئەم کردارە ناگەڕێتەوە.",
  today: "ئەمڕۆ",
  todayHint: "لە سەرەتای ئەمڕۆ",
  last24h: "٢٤ ساعت",
  last24hHint: "٢٤ ساعتی ڕابردوو",
  last7d: "٧ ڕۆژ",
  last7dHint: "٧ ڕۆژی ڕابردوو",
  all: "هەموو",
  allHint: "هەموو ماوەکان",
  custom: "تایبەت",
  customHint: "دیاریکردنی بەروار بە دەستی",
};

/**
 * Every control in the header is the same 40px square, or the same 40px tall
 * with a label. They were a mix of `px-3 py-2.5` and `p-2.5` with 16px and 20px
 * icons, so the four buttons sat at three different heights.
 */
const HEADER_BUTTON_BASE =
  "group relative inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border text-xs font-bold shadow-sm transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 hover:shadow";

const HEADER_ICON_BUTTON = `${HEADER_BUTTON_BASE} w-10 shrink-0`;

const HEADER_NEUTRAL_BUTTON =
  "bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-200 dark:hover:border-white/20 hover:text-slate-700 dark:hover:text-gray-200";

const HEADER_DANGER_BUTTON =
  "bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/15 hover:border-rose-200 dark:hover:border-rose-500/30";

/** The preset options shown in the time-range filter strip. */
export type DateRangePreset = "today" | "24h" | "7d" | "all" | "custom";

const DATE_RANGE_OPTIONS: DateRangePreset[] = [
  "today",
  "24h",
  "7d",
  "all",
  "custom",
];

function toLocalDateString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Converts a preset (plus optional custom bounds) to the `from`/`to` query
 * param pair the backend expects (`YYYY-MM-DD` strings, or undefined for
 * all-time / missing bound).
 */
function presetToRange(
  preset: DateRangePreset,
  customFrom: string,
  customTo: string,
): { from?: string; to?: string } {
  if (preset === "today") {
    // From midnight of the current calendar day — distinct from "24h"
    // which goes back exactly 24 clock-hours from now.
    return { from: toLocalDateString(new Date()) };
  }
  if (preset === "24h") {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return { from: toLocalDateString(d) };
  }
  if (preset === "7d") {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return { from: toLocalDateString(d) };
  }
  if (preset === "custom") {
    return {
      from: customFrom || undefined,
      to: customTo || undefined,
    };
  }
  // "all" — no bounds
  return {};
}

/**
 * The brand to show for a row.
 *
 * Recorded facts first, guesswork last. A page that knows its button opens
 * YouTube says so in `metadata.platform`; the action type is authoritative for
 * a phone or an email; only a legacy linktree row, which carries neither, falls
 * through to reading the label.
 */
function resolvePlatform(action: {
  actionType: string;
  label: string;
  metadata?: Record<string, string>;
}): string {
  const declared = action.metadata?.platform;
  if (declared) return declared;
  return detectPlatform(action.actionType, action.label);
}

function detectPlatform(actionType: string, label: string): string {
  const direct: Record<string, string> = {
    whatsapp: "whatsapp",
    call: "phone",
    email: "email",
    booking: "custom",
    custom: "custom",
  };
  if (direct[actionType]) return direct[actionType];
  const l = label.toLowerCase();
  if (l.includes("whatsapp") || l.includes("واتس")) return "whatsapp";
  if (l.includes("viber") || l.includes("ڤایب")) return "viber";
  if (
    l.includes("telegram") ||
    l.includes("تیلی") ||
    l.includes("تێلی") ||
    l.includes("tele")
  )
    return "telegram";
  if (l.includes("instagram") || l.includes("ئینست")) return "instagram";
  if (l.includes("facebook") || l.includes("فیسب")) return "facebook";
  if (l.includes("youtube") || l.includes("یوت")) return "youtube";
  if (l.includes("tiktok") || l.includes("تیک") || l.includes("تيك"))
    return "tiktok";
  if (l.includes("snapchat") || l.includes("سناپ")) return "snapchat";
  // Only the brand itself. «لینک» is simply the Kurdish word for "link", so
  // matching it here labelled every ordinary link on the page as LinkedIn.
  if (l.includes("linkedin") || l.includes("لینکدئین") || l.includes("لینکدین"))
    return "linkedin";
  if (l.includes("discord") || l.includes("دسک")) return "discord";
  if (l.includes("x.com") || l.includes("twitter") || l.includes("تویت"))
    return "x";
  if (
    l.includes("phone") ||
    l.includes("call") ||
    l.includes("ناو") ||
    l.includes("پەی") ||
    l.includes("تەل")
  )
    return "phone";
  if (
    l.includes("website") ||
    l.includes("web") ||
    l.includes("site") ||
    l.includes("ماڵ") ||
    l.includes("وێب")
  )
    return "custom";
  if (
    l.includes("email") ||
    l.includes("مەی") ||
    l.includes("ئیمەی") ||
    l.includes("ایم")
  )
    return "email";
  if (
    l.includes("gps") ||
    l.includes("map") ||
    l.includes("نەخش") ||
    l.includes("شوێ")
  )
    return "gps";
  if (l.includes("link") || l.includes("لینک")) return "custom";
  return "custom";
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    cache: "no-store",
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || `Request failed (${res.status}): ${url}`);
  }
  return json.data as T;
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

export function BusinessPageAnalyticsModal({
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
}: BusinessPageAnalyticsModalProps) {
  const labels = { ...KURDISH_COPY, ...copy };
  const [totals, setTotals] = useState<Totals | null>(null);
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Time-range filter
  const [preset, setPreset] = useState<DateRangePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const dataRef = useRef(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  /** Derived from/to strings that are passed to every API request. */
  const effectiveRange = useMemo(
    () => presetToRange(preset, customFrom, customTo),
    [preset, customFrom, customTo],
  );

  const load = useCallback(
    async (bypassCache = false, range?: { from?: string; to?: string }) => {
      const reqId = ++dataRef.current;

      // Both reads are addressed by data source so platform requests never
      // fall through to business endpoints protected by `BusinessGuard`.
      const [totalsResult, actionsResult] = await Promise.allSettled([
        fetchJson<Totals>(
          summaryUrl(dataSource, pageId, bypassCache, range?.from, range?.to),
        ),
        summaryOnly
          ? Promise.resolve<ActionRow[]>([])
          : fetchJson<ActionRow[]>(
              actionsUrl(
                dataSource,
                pageId,
                bypassCache,
                range?.from,
                range?.to,
              ),
            ),
      ]);
      if (reqId !== dataRef.current) return;

      let hadError = false;

      if (totalsResult.status === "fulfilled") {
        setTotals(totalsResult.value ?? null);
      } else {
        hadError = true;
        console.error("Analytics summary load failed:", totalsResult.reason);
      }

      if (actionsResult.status === "fulfilled") {
        // A malformed payload would otherwise crash the list on `.filter`.
        setActions(
          Array.isArray(actionsResult.value) ? actionsResult.value : [],
        );
      } else {
        hadError = true;
        console.error("Analytics actions load failed:", actionsResult.reason);
      }

      if (hadError) {
        toast.error(labels.loadFailed);
      } else {
        setLastUpdated(new Date());
      }

      if (reqId === dataRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dataSource, pageId, summaryOnly, labels.loadFailed],
  );

  // Initial load / re-load when the modal opens (or when pageId changes).
  useEffect(() => {
    if (!isOpen) return;
    const frame = window.requestAnimationFrame(() => {
      setLoading(true);
      setExpandedActionId(null);
      // Reset time filter to "all" when the modal re-opens for a new page.
      setPreset("all");
      setCustomFrom("");
      setCustomTo("");
      void load(false, {});
    });
    return () => window.cancelAnimationFrame(frame);
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
    setExpandedActionId(null);
    void load(false, effectiveRange);
    // load is stable (useCallback); effectiveRange identity changes only when
    // preset / customFrom / customTo actually change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveRange]);

  useModalKeyboard({
    isOpen,
    onEscape: onClose,
    escapeEnabled: !isClearModalOpen && !isClearing,
    dialogRef,
  });

  const refresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    void load(true, effectiveRange);
  };

  const handleClearAnalytics = async () => {
    setIsClearing(true);
    try {
      await fetchJson(clearUrl(dataSource, pageId), {
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

  // `mousedown`, not `click`: a click fires on the common ancestor, so a drag
  // that starts inside the panel and ends on the backdrop used to close the
  // modal and throw away what the reader was looking at.
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const filteredActions = useMemo(
    () => actions.filter((a) => a.totalClicks > 0 || a.conversions > 0),
    [actions],
  );
  const hasHistoricalActions = useMemo(
    () =>
      filteredActions.some(
        (action) =>
          action.recordState === "historical" ||
          action.recordState === "unattributed",
      ),
    [filteredActions],
  );

  // Clicks count too: a page can be reached from a QR code or a shared button
  // and record clicks without a single recorded view.
  const hasAnyData = totals
    ? totals.total_views > 0 ||
      totals.total_clicks > 0 ||
      filteredActions.length > 0
    : filteredActions.length > 0;

  const conversionRate = useMemo(() => {
    if (!totals || totals.total_views === 0) return "0.0";
    return ((totals.conversions / totals.total_views) * 100).toFixed(1);
  }, [totals]);

  const clickRate = useMemo(() => {
    if (!totals || totals.unique_views === 0) return "0.0";
    return ((totals.unique_clicks / totals.unique_views) * 100).toFixed(1);
  }, [totals]);

  // After every hook, so the early return cannot change the hook order.
  if (!isOpen) return null;

  // Rendered on `document.body` like every other modal here. Left in place it
  // inherits the dashboard card's stacking context and transforms, which is how
  // a fixed overlay ends up clipped to the panel that opened it.
  return createPortal(
    <>
      <div
        className="modal-ltr fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/40 dark:bg-black/60 backdrop-blur-md overflow-y-auto"
        data-sponsor-krd-theme={platformTheme ? true : undefined}
        data-platform-admin-theme={platformTheme ? true : undefined}
        onMouseDown={handleBackdrop}
        dir="ltr"
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="relative w-full max-w-4xl my-4 sm:my-8 rounded-2xl overflow-hidden shadow-2xl outline-none bg-white dark:bg-[#161B22] border border-gray-100/80 dark:border-white/8"
        >
          <div className="relative p-5 sm:p-6 border-b border-gray-100/80 dark:border-white/8 bg-gradient-to-r from-white to-slate-50/30 dark:from-[#161B22] dark:to-slate-800/5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="theme-fill p-2.5 rounded-xl shadow-sm">
                    <BarChart3 className="h-5 w-5 text-[var(--theme-ink,#fff)]" />
                  </div>
                  <div>
                    <h2
                      id={titleId}
                      className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-gray-100 font-kurdish"
                    >
                      {labels.title} {pageName}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 dark:text-gray-500 mt-0.5 font-kurdish truncate">
                      {summaryOnly ? labels.summary : labels.allData}
                    </p>
                  </div>
                </div>
                {lastUpdated && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 dark:text-gray-500">
                    <MotionPulse className="theme-fill h-1.5 w-1.5 rounded-full shadow-sm" />
                    <span className="font-kurdish">
                      {labels.lastUpdated}{" "}
                      {new Intl.DateTimeFormat(
                        locale ?? (copy ? "ar-IQ" : "ckb-IQ"),
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        },
                      ).format(lastUpdated)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {canClearAnalytics && (
                  <Tooltip
                    content={
                      hasAnyData ? labels.clearAll : labels.nothingToClear
                    }
                    side="bottom"
                  >
                    <button
                      type="button"
                      onClick={() => setIsClearModalOpen(true)}
                      disabled={refreshing || isClearing || !hasAnyData}
                      className={`${HEADER_ICON_BUTTON} ${HEADER_DANGER_BUTTON}`}
                      aria-label={labels.clearData}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </Tooltip>
                )}
                <Tooltip content={labels.refresh} side="bottom">
                  <button
                    type="button"
                    onClick={refresh}
                    disabled={refreshing}
                    aria-busy={refreshing}
                    className={`${HEADER_ICON_BUTTON} ${HEADER_NEUTRAL_BUTTON}`}
                    aria-label={labels.refresh}
                  >
                    <MotionSpinner active={refreshing}>
                      <RefreshCw className="h-4 w-4" />
                    </MotionSpinner>
                  </button>
                </Tooltip>
                <Tooltip content={labels.close} side="bottom">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`${HEADER_ICON_BUTTON} ${HEADER_NEUTRAL_BUTTON}`}
                    aria-label={labels.close}
                  >
                    <X className="h-4 w-4 transition-transform group-hover:rotate-90" />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 md:p-6 overflow-y-auto max-h-[calc(100vh-180px)] sm:max-h-[calc(100vh-200px)] md:max-h-[calc(100vh-220px)] custom-scrollbar bg-white dark:bg-[#161B22]">
            {loading ? (
              // Shaped like what loads: the stat tiles, then the action list.
              <SkeletonPageAnalyticsContent summaryOnly={summaryOnly} />
            ) : (
              <div className="space-y-5">
                <StatCardGrid columns={2}>
                  {summaryOnly ? (
                    <>
                      <StatCard
                        icon={Eye}
                        label={labels.uniqueViewer}
                        value={totals?.unique_views || 0}
                        color="blue"
                      />
                      <StatCard
                        icon={MousePointerClick}
                        label={labels.totalClicks}
                        value={totals?.total_clicks || 0}
                        color="purple"
                      />
                      <StatCard
                        icon={Users}
                        label={labels.uniqueClicker}
                        value={totals?.unique_clicks || 0}
                        color="green"
                      />
                      <StatCard
                        icon={Target}
                        label={labels.clickRate}
                        value={`${clickRate}%`}
                        color="orange"
                      />
                    </>
                  ) : (
                    <>
                      <StatCard
                        icon={Eye}
                        label={labels.totalViews}
                        value={totals?.total_views || 0}
                        color="blue"
                      />
                      <StatCard
                        icon={Users}
                        label={labels.uniqueViewer}
                        value={totals?.unique_views || 0}
                        color="green"
                      />
                      {/*
                        The page's own click total, which is not the sum of the
                        button list below it. That list only shows buttons that
                        still exist, so a page whose links were replaced would
                        otherwise read as having never been clicked at all.
                      */}
                      <StatCard
                        icon={MousePointerClick}
                        label={labels.totalClicks}
                        value={totals?.total_clicks || 0}
                        color="purple"
                      />
                      <StatCard
                        icon={Target}
                        label={labels.uniqueClicker}
                        value={totals?.unique_clicks || 0}
                        color="orange"
                      />
                    </>
                  )}
                </StatCardGrid>

                {!summaryOnly && !!totals && totals.conversions > 0 && (
                  <StatCardGrid columns={2}>
                    <StatCard
                      icon={TrendingUp}
                      label={labels.conversions}
                      value={totals.conversions}
                      color="slate"
                    />
                    <StatCard
                      icon={BarChart3}
                      label={labels.conversionValue}
                      value={totals.conversion_value}
                      color="slate"
                      subtitle={`${conversionRate}% ${labels.conversionRate}`}
                    />
                  </StatCardGrid>
                )}

                {!summaryOnly && (
                  <div>
                    {/* ── Time-range filter ── */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <div className="flex gap-1.5 flex-wrap">
                          {DATE_RANGE_OPTIONS.map((id) => {
                            const active = preset === id;
                            const label =
                              id === "24h"
                                ? labels.last24h
                                : id === "7d"
                                  ? labels.last7d
                                  : labels[id];
                            const hint =
                              id === "24h"
                                ? labels.last24hHint
                                : id === "7d"
                                  ? labels.last7dHint
                                  : labels[`${id}Hint`];
                            return (
                              <Tooltip key={id} content={hint} side="top">
                                <button
                                  type="button"
                                  aria-label={hint}
                                  aria-pressed={active}
                                  onClick={() => setPreset(id)}
                                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all cursor-pointer whitespace-nowrap ${
                                    active
                                      ? "theme-fill border-transparent text-[var(--theme-ink,#fff)] shadow-sm"
                                      : "bg-white dark:bg-[#161B22] border-slate-100 dark:border-white/8 text-slate-500 dark:text-gray-400 hover:border-slate-200 dark:hover:border-white/20"
                                  }`}
                                >
                                  {label}
                                </button>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </div>

                      {preset === "custom" && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <DateTimeInput
                              label={labels.fromDate}
                              value={customFrom}
                              onChange={setCustomFrom}
                              dateOnly
                              accent="var(--theme-primary, #64748b)"
                              max={customTo || undefined}
                            />
                          </div>
                          <span className="text-slate-300 dark:text-white/20 text-sm font-light shrink-0 mt-5">
                            →
                          </span>
                          <div className="flex-1 min-w-0">
                            <DateTimeInput
                              label={labels.toDate}
                              value={customTo}
                              onChange={setCustomTo}
                              dateOnly
                              accent="var(--theme-primary, #64748b)"
                              min={customFrom || undefined}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="theme-fill p-1.5 rounded-lg shadow-sm">
                        <Target className="h-3.5 w-3.5 text-[var(--theme-ink,#fff)]" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-200 font-kurdish">
                        {labels.buttons} ({filteredActions.length})
                      </h3>
                    </div>

                    {hasHistoricalActions && (
                      <p className="mb-3 rounded-xl border border-amber-200/70 bg-amber-50/70 px-3 py-2 text-[11px] leading-5 text-amber-800 dark:border-amber-400/15 dark:bg-amber-400/8 dark:text-amber-200 font-kurdish">
                        {labels.historyHint}
                      </p>
                    )}

                    {filteredActions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                        <Eye className="h-10 w-10 text-slate-300 dark:text-gray-600" />
                        <p className="text-sm text-slate-400 dark:text-gray-500 font-kurdish">
                          {labels.noData}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-100 dark:border-white/8 divide-y divide-slate-100 dark:divide-white/5 overflow-hidden">
                        {filteredActions.map((action) => {
                          const platform = resolvePlatform(action);
                          const colors = getPlatformColors(platform);
                          const icon = getPlatformIcon(platform, "h-4 w-4");
                          const rowCaption = getPlatformName(platform);
                          const isHistorical =
                            action.recordState === "historical";
                          const isUnattributed =
                            action.recordState === "unattributed";
                          const displayLabel = isUnattributed
                            ? labels.unattributedClicks
                            : action.label;
                          const isExpanded = expandedActionId === action.id;
                          return (
                            <div key={action.id}>
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedActionId(
                                    isExpanded ? null : action.id,
                                  )
                                }
                                aria-expanded={isExpanded}
                                className="w-full flex items-center gap-3 p-3 text-left cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                              >
                                <div
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                                  style={{
                                    background: `linear-gradient(135deg, ${colors.from}, ${colors.via}, ${colors.to})`,
                                  }}
                                >
                                  {icon}
                                </div>
                                <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 items-center">
                                  <div className="col-span-2 sm:col-span-2 min-w-0">
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                                      {displayLabel}
                                    </p>
                                    <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                                      <p className="truncate text-[10px] text-slate-400 dark:text-gray-500">
                                        {isUnattributed
                                          ? labels.unattributedHint
                                          : rowCaption}
                                      </p>
                                      {(isHistorical || isUnattributed) && (
                                        <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300 font-kurdish">
                                          {isHistorical
                                            ? labels.historical
                                            : labels.unattributed}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                      {formatNumber(action.totalClicks)}
                                    </p>
                                    <p className="text-[10px] text-slate-400 dark:text-gray-500">
                                      {labels.clicks}
                                    </p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                      {formatNumber(action.uniqueClickers)}
                                    </p>
                                    <p className="text-[10px] text-slate-400 dark:text-gray-500">
                                      {labels.unique}
                                    </p>
                                  </div>
                                  <div className="text-center">
                                    <p
                                      className="text-sm font-bold"
                                      style={{ color: "var(--theme-primary)" }}
                                    >
                                      {action.ctr.toFixed(1)}%
                                    </p>
                                    <p className="text-[10px] text-slate-400 dark:text-gray-500">
                                      CTR
                                    </p>
                                  </div>
                                </div>
                                <ChevronDown
                                  className={`h-4 w-4 shrink-0 text-slate-400 dark:text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                />
                              </button>
                              {isExpanded && (
                                <div className="px-3 pb-3 pl-[3.25rem]">
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] p-3">
                                    <div>
                                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                                        <Target
                                          className="h-3 w-3"
                                          style={{
                                            color: "var(--theme-primary)",
                                          }}
                                        />
                                        {formatNumber(action.conversions)}
                                      </p>
                                      <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5">
                                        {labels.actualConversions}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                                        <TrendingUp
                                          className="h-3 w-3"
                                          style={{
                                            color: "var(--theme-primary)",
                                          }}
                                        />
                                        {formatNumber(action.conversionValue)}
                                      </p>
                                      <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5">
                                        {labels.conversionValue}
                                      </p>
                                    </div>
                                    {action.destination && (
                                      <Tooltip
                                        content={labels.openDestination}
                                        side="top"
                                        className="col-span-2 sm:col-span-1 min-w-0"
                                      >
                                        <a
                                          href={action.destination}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-gray-400 hover:underline truncate self-center"
                                        >
                                          <ExternalLink className="h-3 w-3 shrink-0" />
                                          <span className="truncate">
                                            {action.destination}
                                          </span>
                                        </a>
                                      </Tooltip>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {filteredActions.length > 1 && (
                      <p className="mt-2 text-[10px] leading-5 text-slate-400 dark:text-gray-500 font-kurdish">
                        {labels.uniqueHint}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {canClearAnalytics && (
        <ConfirmDeleteModal
          isOpen={isClearModalOpen}
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
          zIndexClassName="z-[60]"
          message={<p>{labels.clearQuestion}</p>}
        />
      )}
    </>,
    document.body,
  );
}
