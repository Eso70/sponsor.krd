"use client";
import { useMemo, useState, type ReactNode } from "react";
import {
  ChevronDown,
  Eye,
  ExternalLink,
  MousePointerClick,
  Target,
  Users,
} from "lucide-react";
import {
  getPlatformColors,
  getPlatformIcon,
  getPlatformName,
} from "@/components/public/LinktreeButtons";
import { StatCard } from "@/components/shared/StatCard";
import { StatCardGrid } from "@/components/shared/StatCardGrid";
import { Tooltip } from "@/components/shared/Tooltip";
import type { PageAnalyticsTotals, PageAnalyticsAction } from "@linktree/types";
import type { PageAnalyticsCopy } from "../page-analytics-copy";
import { PageEngagementOverview } from "./PageEngagementOverview";
import { analyticsInsightsCopy } from "../analytics-insights-copy";

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

export function PageAnalyticsContent({
  totals,
  actions,
  summaryOnly = false,
  pageId,
  locale: activeLocale,
  labels,
  rangeControl,
}: {
  totals: PageAnalyticsTotals | null;
  actions: PageAnalyticsAction[];
  summaryOnly?: boolean;
  pageId: string;
  locale: "en" | "ar" | "ckb";
  labels: PageAnalyticsCopy;
  rangeControl?: ReactNode;
}) {
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);
  const insightsCopy = analyticsInsightsCopy[activeLocale];
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

  const clickRate = useMemo(() => {
    if (!totals || totals.unique_views === 0) return "0.0";
    return ((totals.unique_clicks / totals.unique_views) * 100).toFixed(1);
  }, [totals]);

  return (
    <section aria-label={labels.title} className="space-y-5">
      {rangeControl}
      <StatCardGrid columns={2}>
        {summaryOnly ? (
          <>
            <StatCard
              icon={Eye}
              label={labels.uniqueViewer}
              value={totals?.unique_views ?? "—"}
              color="blue"
            />
            <StatCard
              icon={MousePointerClick}
              label={labels.totalClicks}
              value={totals?.total_clicks ?? "—"}
              color="purple"
            />
            <StatCard
              icon={Users}
              label={labels.uniqueClicker}
              value={totals?.unique_clicks ?? "—"}
              color="green"
            />
            <StatCard
              icon={Target}
              label={labels.clickRate}
              value={totals ? `${clickRate}%` : "—"}
              color="orange"
            />
          </>
        ) : (
          <>
            <StatCard
              icon={Eye}
              label={labels.totalViews}
              value={totals?.total_views ?? "—"}
              color="blue"
            />
            <StatCard
              icon={Users}
              label={labels.uniqueViewer}
              value={totals?.unique_views ?? "—"}
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
              value={totals?.total_clicks ?? "—"}
              color="purple"
            />
            <StatCard
              icon={Target}
              label={labels.uniqueClicker}
              value={totals?.unique_clicks ?? "—"}
              color="orange"
            />
          </>
        )}
      </StatCardGrid>

      {!summaryOnly && (
        <PageEngagementOverview
          key={pageId}
          insights={totals?.insights}
          locale={activeLocale}
        />
      )}

      {!summaryOnly && (
        <div>
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
                const isHistorical = action.recordState === "historical";
                const isUnattributed = action.recordState === "unattributed";
                const displayLabel = isUnattributed
                  ? labels.unattributedClicks
                  : action.label;
                const isExpanded = expandedActionId === action.id;
                return (
                  <div key={action.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedActionId(isExpanded ? null : action.id)
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
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                              {formatNumber(action.conversions)}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">
                              {insightsCopy.contact}
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
    </section>
  );
}
