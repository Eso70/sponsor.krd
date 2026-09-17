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
  formatConversionRate,
  formatCostPerConversion,
} from "../campaign-metrics";
import type { TikTokCampaign } from "../types";

interface PerformanceMetric {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  iconClassName: string;
}

export function CampaignPerformanceOverview({
  campaign,
}: {
  campaign: TikTokCampaign;
}) {
  const metrics: PerformanceMetric[] = [
    {
      label: "پیشاندان",
      value: campaign.impressions.toLocaleString(),
      detail: "Impressions",
      icon: Eye,
      iconClassName: "text-sky-500",
    },
    {
      label: "کلیک",
      value: campaign.clicks.toLocaleString(),
      detail: `CTR ${campaign.ctr.toFixed(2)}%`,
      icon: MousePointerClick,
      iconClassName: "text-emerald-500",
    },
    {
      label: "گۆڕان",
      value: campaign.conversions.toLocaleString(),
      detail: `ڕێژەی گۆڕان ${formatConversionRate(campaign)}`,
      icon: TrendingUp,
      iconClassName: "text-violet-500",
    },
    {
      label: "خەرجی گشتی",
      value: `$${campaign.totalSpent.toFixed(2)}`,
      detail: "Total spend",
      icon: CircleDollarSign,
      iconClassName: "text-amber-500",
    },
    {
      label: "تێچووی هەر کلیکێک",
      value: `$${campaign.cpc.toFixed(3)}`,
      detail: "Cost per click",
      icon: BadgeDollarSign,
      iconClassName: "text-rose-500",
    },
    {
      label: "تێچووی هەر گۆڕانێک",
      value: formatCostPerConversion(campaign),
      detail: "Cost per conversion",
      icon: Zap,
      iconClassName: "text-indigo-500",
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
            ئەنجامی کەمپەین
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            پوختەی ئەنجام و تێچووی ڕیکلامەکە
          </p>
        </div>
        <span className="hidden text-[11px] font-medium text-slate-400 sm:block">
          ئاماری ڕاستەوخۆ
        </span>
      </div>

      <div className="grid grid-cols-2 overflow-hidden border-y border-slate-200/70 sm:grid-cols-3 dark:border-white/10">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.label}
              className={`min-w-0 px-3 py-4 sm:px-5 sm:py-5 ${
                index % 2 === 0 ? "border-r sm:border-r-0" : ""
              } ${index % 3 !== 2 ? "sm:border-r" : ""} ${
                index < 4 ? "border-b sm:border-b-0" : ""
              } ${index < 3 ? "sm:border-b" : ""} border-slate-200/60 dark:border-white/7`}
            >
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <Icon className={`size-4 ${metric.iconClassName}`} />
                <span className="truncate">{metric.label}</span>
              </div>
              <bdi className="mt-2 block truncate font-mono text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                {metric.value}
              </bdi>
              <p className="mt-1 truncate text-[11px] text-slate-400 dark:text-slate-500">
                {metric.detail}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
