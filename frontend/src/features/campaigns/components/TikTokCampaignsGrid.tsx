"use client";

import { BarChart3, Pause, Play, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { ManagementGrid } from "@/components/shared/ManagementGrid";
import { Tooltip } from "@/components/shared/Tooltip";
import { OBJECTIVE_LABELS } from "../mock-data";
import { formatCostPerConversion } from "../campaign-metrics";
import type { TikTokCampaign } from "../types";
import { CampaignStatusBadge } from "./CampaignStatusBadge";
import { CampaignVideoPreview } from "./CampaignVideoPreview";

interface TikTokCampaignsGridProps {
  campaigns: TikTokCampaign[];
  onToggleStatus: (campaignId: string) => void;
  onViewDetails: (campaign: TikTokCampaign) => void;
  onDeleteCampaign: (campaign: TikTokCampaign) => void;
}

export function TikTokCampaignsGrid({
  campaigns,
  onToggleStatus,
  onViewDetails,
  onDeleteCampaign,
}: TikTokCampaignsGridProps) {
  if (!campaigns.length) {
    return (
      <EmptyState
        icon={BarChart3}
        title="هیچ کەمپەینێک نەدۆزرایەوە"
        description="کەمپەینێکی نوێ دروست بکە یان مەرجی گەڕان و فلتەرەکان بگۆڕە."
      />
    );
  }

  return (
    <ManagementGrid
      data={campaigns}
      getItemKey={(campaign) => campaign.id}
      desktopColumns={2}
      pagination={{ mode: "client", pageSize: 8 }}
      renderItem={(campaign) => (
        <article className="group flex h-full min-w-0 flex-col bg-transparent transition-colors duration-300 hover:bg-slate-50/50 dark:hover:bg-white/[0.025]">
          <div className="p-3.5 pb-0">
            <CampaignVideoPreview campaign={campaign} />
          </div>

          <div className="flex flex-1 flex-col p-4.5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                  {campaign.name}
                </h3>
                <p className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {OBJECTIVE_LABELS[campaign.objective].label} · /
                  {campaign.destinationPage.slug}
                </p>
              </div>
              <CampaignStatusBadge status={campaign.status} />
            </div>

            <dl className="grid grid-cols-3 border-y border-slate-200/55 py-2 text-center dark:border-white/7">
              <div className="border-b border-r border-slate-200/45 p-2.5 dark:border-white/5">
                <dt className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                  Impr.
                </dt>
                <dd className="mt-1 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                  {campaign.impressions.toLocaleString()}
                </dd>
              </div>
              <div className="border-b border-r border-slate-200/45 p-2.5 dark:border-white/5">
                <dt className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                  Clicks
                </dt>
                <dd className="mt-1 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                  {campaign.clicks.toLocaleString()}
                </dd>
              </div>
              <div className="border-b border-slate-200/45 p-2.5 dark:border-white/5">
                <dt className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                  CTR
                </dt>
                <dd className="mt-1 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-300">
                  {campaign.ctr}%
                </dd>
              </div>
              <div className="border-r border-slate-200/45 p-2.5 dark:border-white/5">
                <dt className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                  Spent
                </dt>
                <dd className="mt-1 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                  ${campaign.totalSpent.toFixed(0)}
                </dd>
              </div>
              <div className="border-r border-slate-200/45 p-2.5 dark:border-white/5">
                <dt className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                  Conv.
                </dt>
                <dd className="mt-1 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                  {campaign.conversions.toLocaleString()}
                </dd>
              </div>
              <div className="p-2.5">
                <dt className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                  Cost / Conv.
                </dt>
                <dd className="mt-1 font-mono text-xs font-bold text-violet-600 dark:text-violet-300">
                  {formatCostPerConversion(campaign)}
                </dd>
              </div>
            </dl>

            <div className="mt-3 grid grid-cols-2 divide-x divide-slate-200/60 text-[11px] dark:divide-white/7">
              <div className="pr-3">
                <p className="text-slate-400">بودجەی ڕۆژانە</p>
                <p className="mt-0.5 font-mono font-bold text-slate-700 dark:text-slate-200">
                  ${campaign.dailyBudget.toFixed(2)}
                </p>
              </div>
              <div className="pl-3">
                <p className="text-slate-400">تێچووی هەر گۆڕانێک</p>
                <p className="mt-0.5 font-mono font-bold text-slate-700 dark:text-slate-200">
                  {formatCostPerConversion(campaign)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-slate-200/55 pt-3.5 dark:border-white/7">
              <button
                type="button"
                onClick={() => onViewDetails(campaign)}
                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-sky-200/70 bg-sky-50/70 text-xs font-semibold text-sky-700 transition-all duration-200 hover:border-sky-300 hover:bg-sky-100/70 dark:border-sky-800/40 dark:bg-sky-950/20 dark:text-sky-300 dark:hover:bg-sky-950/35"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                وردەکاری
              </button>
              {(campaign.status === "active" ||
                campaign.status === "paused") && (
                <Tooltip
                  content={
                    campaign.status === "active"
                      ? "ڕاگرتنی کەمپەین"
                      : "دەستپێکردنەوەی کەمپەین"
                  }
                  side="top"
                >
                  <button
                    type="button"
                    onClick={() => onToggleStatus(campaign.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200/70 bg-amber-50/70 text-amber-700 transition-all duration-200 hover:border-amber-300 hover:bg-amber-100/70 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-300 dark:hover:bg-amber-950/35"
                    aria-label={
                      campaign.status === "active"
                        ? "ڕاگرتنی کەمپەین"
                        : "دەستپێکردنەوەی کەمپەین"
                    }
                  >
                    {campaign.status === "active" ? (
                      <Pause className="h-3.5 w-3.5" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                  </button>
                </Tooltip>
              )}
              <Tooltip content="سڕینەوە" side="top">
                <button
                  type="button"
                  onClick={() => onDeleteCampaign(campaign)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200/70 bg-rose-50/70 text-rose-700 transition-all duration-200 hover:border-rose-300 hover:bg-rose-100/70 dark:border-rose-800/40 dark:bg-rose-950/20 dark:text-rose-300 dark:hover:bg-rose-950/35"
                  aria-label={`سڕینەوەی ${campaign.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </Tooltip>
            </div>
          </div>
        </article>
      )}
    />
  );
}
