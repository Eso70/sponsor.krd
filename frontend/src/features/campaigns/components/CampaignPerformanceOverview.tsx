"use client";

import {
  BadgeDollarSign,
  CircleDollarSign,
  Eye,
  MousePointerClick,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  campaignReportedValue,
  formatConversionRate,
  formatCostPerConversion,
} from "../campaign-metrics";
import type { TikTokCampaign } from "../types";
import { usePlatformLocale } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { campaignCopy } from "../campaign-copy";

import { StatCard, type StatCardColor } from "@/components/shared/StatCard";
import { StatCardGrid } from "@/components/shared/StatCardGrid";

interface PerformanceMetric {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  color: StatCardColor;
}

export function CampaignPerformanceOverview({
  campaign,
}: {
  campaign: TikTokCampaign;
}) {
  const { locale } = usePlatformLocale();
  const copy = campaignCopy[locale];
  const metrics: PerformanceMetric[] = [
    {
      label: copy.list.impressions,
      value: campaign.impressions.toLocaleString(),
      detail: copy.list.impressions,
      icon: Eye,
      color: "blue",
    },
    {
      label: copy.list.clicks,
      value: campaign.clicks.toLocaleString(),
      detail: `${copy.list.clickRate} ${campaign.ctr.toFixed(2)}%`,
      icon: MousePointerClick,
      color: "green",
    },
    {
      label: copy.list.conversions,
      value: campaign.conversions.toLocaleString(),
      detail: `${copy.detail.conversionRate} ${formatConversionRate(campaign)}`,
      icon: TrendingUp,
      color: "purple",
    },
    {
      label: copy.totalSpent,
      value: `$${campaign.totalSpent.toFixed(2)}`,
      detail: copy.totalSpent,
      icon: CircleDollarSign,
      color: "amber",
    },
    {
      label: copy.detail.costPerClick,
      value: `$${campaign.cpc.toFixed(3)}`,
      detail: copy.detail.costPerClick,
      icon: BadgeDollarSign,
      color: "pink",
    },
    {
      label: copy.costPerConversion,
      value: formatCostPerConversion(campaign),
      detail: copy.costPerConversion,
      icon: Zap,
      color: "purple",
    },
  ];

  return (
    <section aria-labelledby="campaign-performance-title">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h3
            id="campaign-performance-title"
            className="text-sm font-bold text-slate-800 dark:text-slate-100"
          >
            {copy.detail.performance}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {copy.reportingUnavailable}
          </p>
        </div>

      </div>

      <StatCardGrid columns={3}>
        {metrics.map((metric) => (
          <StatCard
            key={metric.label}
            icon={metric.icon}
            color={metric.color}
            label={metric.label}
            value={campaignReportedValue(metric.value)}
            subtitle={
              metric.detail === metric.label ? undefined : String(campaignReportedValue(metric.detail))
            }
          />
        ))}
      </StatCardGrid>
    </section>
  );
}
