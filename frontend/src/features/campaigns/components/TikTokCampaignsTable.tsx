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
import { OBJECTIVE_LABELS } from "../mock-data";
import { formatCostPerConversion } from "../campaign-metrics";
import type { TikTokCampaign } from "../types";
import { CampaignStatusBadge } from "./CampaignStatusBadge";
import { CampaignVideoPreview } from "./CampaignVideoPreview";

interface TikTokCampaignsTableProps {
  campaigns: TikTokCampaign[];
  onToggleStatus: (campaignId: string) => void;
  onViewDetails: (campaign: TikTokCampaign) => void;
  onDeleteCampaign: (campaign: TikTokCampaign) => void;
}

const COLUMNS: ManagementTableColumn[] = [
  { key: "video", header: "ڤیدیۆ", width: "w-28" },
  { key: "campaign", header: "کەمپەین" },
  { key: "status", header: "دۆخ", width: "w-36" },
  {
    key: "budget",
    header: "بودجە / خەرجی",
    width: "w-36",
    hideBelow: "lg",
  },
  { key: "performance", header: "ئەنجام", width: "w-44" },
  {
    key: "destination",
    header: "لاپەڕەی ئامانج",
    width: "w-40",
    hideBelow: "xl",
  },
  { key: "actions", header: "کردارەکان", width: "w-28" },
];

type CampaignActionProps = Omit<TikTokCampaignsTableProps, "campaigns"> & {
  campaign: TikTokCampaign;
};

function CampaignActions({
  campaign,
  onToggleStatus,
  onViewDetails,
  onDeleteCampaign,
}: CampaignActionProps) {
  return (
    <div className="flex items-center justify-start gap-1">
      {(campaign.status === "active" || campaign.status === "paused") && (
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
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-amber-600 transition-all duration-200 hover:border-amber-200/70 hover:bg-amber-50/70 dark:text-amber-300 dark:hover:border-amber-800/40 dark:hover:bg-amber-950/25"
            aria-label={
              campaign.status === "active"
                ? "ڕاگرتنی کەمپەین"
                : "دەستپێکردنەوەی کەمپەین"
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
      <Tooltip content="بینینی وردەکاری و ئامار" side="top">
        <button
          type="button"
          onClick={() => onViewDetails(campaign)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-sky-600 transition-all duration-200 hover:border-sky-200/70 hover:bg-sky-50/70 dark:text-sky-300 dark:hover:border-sky-800/40 dark:hover:bg-sky-950/25"
          aria-label={`بینینی وردەکاری ${campaign.name}`}
        >
          <BarChart3 className="h-4 w-4" />
        </button>
      </Tooltip>
      <Tooltip content="سڕینەوە" side="top">
        <button
          type="button"
          onClick={() => onDeleteCampaign(campaign)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-rose-600 transition-all duration-200 hover:border-rose-200/70 hover:bg-rose-50/70 dark:text-rose-300 dark:hover:border-rose-800/40 dark:hover:bg-rose-950/25"
          aria-label={`سڕینەوەی ${campaign.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </Tooltip>
    </div>
  );
}

function CampaignRow(props: CampaignActionProps) {
  const { campaign } = props;

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
          {OBJECTIVE_LABELS[campaign.objective].label}
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
          ${campaign.dailyBudget.toFixed(2)} / ڕۆژ
        </p>
        <p className="mt-1 font-mono text-[11px] text-slate-500">
          ${campaign.totalSpent.toFixed(2)} خەرجکراوە
        </p>
      </td>
      <td className="px-3 py-3">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px]">
          <span className="text-slate-500">
            Impr. {campaign.impressions.toLocaleString()}
          </span>
          <span className="text-slate-500">
            Clicks {campaign.clicks.toLocaleString()}
          </span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-300">
            CTR {campaign.ctr}%
          </span>
          <span className="text-slate-500">
            Conv. {campaign.conversions.toLocaleString()}
          </span>
          <span className="font-semibold text-violet-600 dark:text-violet-300">
            Cost/Conv. {formatCostPerConversion(campaign)}
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
              /{campaign.destinationPage.slug} · ${campaign.dailyBudget}/ڕۆژ
            </p>
          </div>
          <CampaignStatusBadge status={campaign.status} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="font-mono text-[11px] text-slate-500">
            {campaign.conversions.toLocaleString()} Conv. ·{" "}
            {formatCostPerConversion(campaign)} Cost/Conv.
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
  const actionProps = { onToggleStatus, onViewDetails, onDeleteCampaign };

  return (
    <ManagementTable
      data={campaigns}
      columns={COLUMNS}
      getRowKey={(campaign) => campaign.id}
      pagination={{ mode: "client", pageSize: 10 }}
      minWidth="min-w-[980px]"
      empty={{
        icon: Radio,
        title: "هیچ کەمپەینێک نەدۆزرایەوە",
        description:
          "کەمپەینێکی نوێ دروست بکە یان مەرجی گەڕان و فلتەرەکان بگۆڕە.",
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
