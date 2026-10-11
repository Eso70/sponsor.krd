"use client";

import { BarChart3, Pause, Play, Radio, Trash2 } from "lucide-react";

import {
  hideBelowClass,
  MANAGEMENT_TABLE_CARD_CLASS,
  MANAGEMENT_TABLE_ROW_CLASS,
  ManagementTable,
  type ManagementTableColumn,
} from "@/components/shared/ManagementTable";
import { Tooltip } from "@/components/shared/Tooltip";
import { OBJECTIVE_LABELS } from "../campaign-objectives";
import { formatCostPerConversion } from "../campaign-metrics";
import type { TikTokCampaign } from "../types";
import { CampaignStatusBadge } from "./CampaignStatusBadge";
import { CampaignVideoPreview } from "./CampaignVideoPreview";
import { usePlatformLocale } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { campaignCopy } from "../campaign-copy";
import { useCampaignText } from "../use-campaign-text";

interface TikTokCampaignsTableProps {
  campaigns: TikTokCampaign[];
  onToggleStatus: (campaignId: string) => void;
  onViewDetails: (campaign: TikTokCampaign) => void;
  onDeleteCampaign: (campaign: TikTokCampaign) => void;
}

function getColumns(labels: (typeof campaignCopy)[keyof typeof campaignCopy]["list"]): ManagementTableColumn[] {
  return [
  { key: "video", header: labels.video, width: "w-28" },
  { key: "campaign", header: labels.campaign },
  { key: "status", header: labels.status, width: "w-36" },
  {
    key: "budget",
    header: labels.budgetSpent,
    width: "w-36",
    hideBelow: "lg",
  },
  { key: "performance", header: labels.performance, width: "w-44" },
  {
    key: "destination",
    header: labels.destination,
    width: "w-40",
    hideBelow: "xl",
  },
  { key: "actions", header: labels.actions, width: "w-28" },
  ];
}

type CampaignActionProps = Omit<TikTokCampaignsTableProps, "campaigns"> & {
  campaign: TikTokCampaign;
};

function CampaignActions({
  campaign,
  onToggleStatus,
  onViewDetails,
  onDeleteCampaign,
}: CampaignActionProps) {
  const { locale } = usePlatformLocale();
  const labels = campaignCopy[locale].list;
  return (
    <div className="flex items-center justify-start gap-1">
      {(campaign.status === "active" || campaign.status === "paused") && (
        <Tooltip
          content={
            campaign.status === "active"
              ? labels.pause
              : labels.resume
          }
          side="top"
        >
          <button
            type="button"
            onClick={() => onToggleStatus(campaign.id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-amber-600 transition-all duration-200 hover:border-amber-200/70 hover:bg-amber-50/70 dark:text-amber-300 dark:hover:border-amber-800/40 dark:hover:bg-amber-950/25"
            aria-label={
              campaign.status === "active"
                ? labels.pause
                : labels.resume
            }
          >
            {campaign.status === "active" ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>
        </Tooltip>
      )}
      <Tooltip content={labels.detailsAnalytics} side="top">
        <button
          type="button"
          onClick={() => onViewDetails(campaign)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-sky-600 transition-all duration-200 hover:border-sky-200/70 hover:bg-sky-50/70 dark:text-sky-300 dark:hover:border-sky-800/40 dark:hover:bg-sky-950/25"
          aria-label={`${labels.viewDetails} ${campaign.name}`}
        >
          <BarChart3 className="h-4 w-4" />
        </button>
      </Tooltip>
      <Tooltip content={labels.delete} side="top">
        <button
          type="button"
          onClick={() => onDeleteCampaign(campaign)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-rose-600 transition-all duration-200 hover:border-rose-200/70 hover:bg-rose-50/70 dark:text-rose-300 dark:hover:border-rose-800/40 dark:hover:bg-rose-950/25"
          aria-label={`${labels.deleteItem} ${campaign.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </Tooltip>
    </div>
  );
}

function CampaignRow(props: CampaignActionProps) {
  const { campaign } = props;
  const { locale } = usePlatformLocale();
  const labels = campaignCopy[locale].list;
  const t = useCampaignText();

  return (
    <tr className={MANAGEMENT_TABLE_ROW_CLASS}>
      <td className="px-3 py-3">
        <CampaignVideoPreview campaign={campaign} compact />
      </td>
      <td className="px-3 py-3">
        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
          {campaign.name}
        </p>
        <p className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">
          {t(OBJECTIVE_LABELS[campaign.objective].label)}
        </p>
        <p className="mt-0.5 truncate font-mono text-[10px] text-slate-400">
          {campaign.video.title} · {campaign.video.resolution}
        </p>
      </td>
      <td className="px-3 py-3">
        <CampaignStatusBadge status={campaign.status} />
      </td>
      <td className={`px-3 py-3 ${hideBelowClass("lg")}`}>
        <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
          ${campaign.dailyBudget.toFixed(2)} / {labels.perDay}
        </p>
        <p className="mt-1 font-mono text-[11px] text-slate-500">
          ${campaign.totalSpent.toFixed(2)} {labels.spentSuffix}
        </p>
      </td>
      <td className="px-3 py-3">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px]">
          <span className="text-slate-500">
            {labels.impressions} {campaign.impressions.toLocaleString()}
          </span>
          <span className="text-slate-500">
            {labels.clicks} {campaign.clicks.toLocaleString()}
          </span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-300">
            {labels.clickRate} {campaign.ctr}%
          </span>
          <span className="text-slate-500">
            {labels.conversions} {campaign.conversions.toLocaleString()}
          </span>
          <span className="font-semibold text-violet-600 dark:text-violet-300">
            {labels.costPerConversion} {formatCostPerConversion(campaign)}
          </span>
        </div>
      </td>
      <td className={`px-3 py-3 ${hideBelowClass("xl")}`}>
        <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
          {campaign.destinationPage.title}
        </p>
        <p className="mt-1 truncate font-mono text-[11px] text-slate-400">
          /{campaign.destinationPage.slug}
        </p>
      </td>
      <td className="px-3 py-3">
        <CampaignActions {...props} />
      </td>
    </tr>
  );
}

function CampaignMobileCard(props: CampaignActionProps) {
  const { campaign } = props;
  const { locale } = usePlatformLocale();
  const labels = campaignCopy[locale].list;

  return (
    <div className={MANAGEMENT_TABLE_CARD_CLASS}>
      <CampaignVideoPreview campaign={campaign} compact />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
              {campaign.name}
            </p>
            <p className="mt-1 truncate text-[11px] text-slate-500">
              /{campaign.destinationPage.slug} · ${campaign.dailyBudget}/{labels.perDay}
            </p>
          </div>
          <CampaignStatusBadge status={campaign.status} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="font-mono text-[11px] text-slate-500">
            {campaign.conversions.toLocaleString()} {labels.conversions} ·{" "}
            {formatCostPerConversion(campaign)} {labels.costPerConversion}
          </p>
          <CampaignActions {...props} />
        </div>
      </div>
    </div>
  );
}

export function TikTokCampaignsTable({
  campaigns,
  onToggleStatus,
  onViewDetails,
  onDeleteCampaign,
}: TikTokCampaignsTableProps) {
  const { locale } = usePlatformLocale();
  const copy = campaignCopy[locale];
  const actionProps = { onToggleStatus, onViewDetails, onDeleteCampaign };

  return (
    <ManagementTable
      data={campaigns}
      noDataLabel={copy.noCampaigns}
      columns={getColumns(copy.list)}
      getRowKey={(campaign) => campaign.id}
      pagination={{ mode: "client", pageSize: 10 }}
      paginationCopy={copy.list.pagination}
      minWidth="min-w-[980px]"
      empty={{
        icon: Radio,
        title: copy.noCampaigns,
        description: copy.list.emptyDescription,
      }}
      renderRow={(campaign) => (
        <CampaignRow campaign={campaign} {...actionProps} />
      )}
      renderCard={(campaign) => (
        <CampaignMobileCard campaign={campaign} {...actionProps} />
      )}
    />
  );
}
