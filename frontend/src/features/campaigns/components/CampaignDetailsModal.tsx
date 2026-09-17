"use client";

import { CalendarDays, MapPin, Target, Video } from "lucide-react";
import { ManagementModal } from "@/components/shared/ManagementModal";
import { OBJECTIVE_LABELS } from "../mock-data";
import type { TikTokCampaign } from "../types";
import { buildTikTokApiPayload } from "../tiktok-payload-builder";
import { CampaignPerformanceOverview } from "./CampaignPerformanceOverview";
import { CampaignStatusBadge } from "./CampaignStatusBadge";
import { CampaignVideoPreview } from "./CampaignVideoPreview";

interface CampaignDetailsModalProps {
  campaign: TikTokCampaign | null;
  isOpen: boolean;
  onClose: () => void;
  sponsorKrdTheme?: boolean;
}

export function CampaignDetailsModal({
  campaign,
  isOpen,
  onClose,
  sponsorKrdTheme = false,
}: CampaignDetailsModalProps) {
  if (!campaign) return null;

  const objectiveInfo = OBJECTIVE_LABELS[campaign.objective] || {
    label: campaign.objective,
    description: "",
  };

  const payload =
    campaign.tiktokPayload ||
    buildTikTokApiPayload({
      campaignName: campaign.name,
      objective: campaign.objective,
      optimizationGoal: campaign.setup?.optimizationGoal || "REACH",
      dataConnectionId: campaign.setup?.dataConnectionId || "",
      optimizationEvent: campaign.setup?.optimizationEvent || "",
      bidStrategy: campaign.setup?.bidStrategy || "MAXIMIZE_DELIVERY",
      dailyBudget: campaign.dailyBudget,
      scheduleType: campaign.setup?.scheduleType || "START_NOW",
      startDate: campaign.setup?.startDate || "",
      endDate: campaign.setup?.endDate || "",
      location: campaign.targetAudience.location,
      gender: campaign.targetAudience.gender,
      ageGroups: campaign.targetAudience.ageGroups,
      languages: campaign.targetAudience.languages.join(", "),
      placement: campaign.setup?.placement || "TIKTOK_ONLY",
      destinationUrl: campaign.destinationPage.url || "https://sponsor.krd",
      videoCode: campaign.setup?.videoCode || "CREATOR_SPARK_CODE",
      adText: campaign.setup?.adText || campaign.name,
      callToAction: campaign.callToAction,
      interactiveAddOnEnabled: false,
      addOnMode: "CREATE",
      newAddOnType: "",
      existingAddOnId: "",
    });

  return (
    <ManagementModal
      isOpen={isOpen}
      onClose={onClose}
      sponsorKrdTheme={sponsorKrdTheme}
      title={campaign.name}
      description="وردەکاری ئەنجام و زانیارییەکانی کەمپەین لە تیکتۆک"
      headerAction={<CampaignStatusBadge status={campaign.status} />}
      extraWide
      footer={
        <div className="flex justify-end w-full">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200/70 bg-slate-50/70 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            داخستن
          </button>
        </div>
      }
    >
      <div className="space-y-7" dir="rtl">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)] lg:items-stretch">
          <CampaignVideoPreview campaign={campaign} />
          <div className="flex min-w-0 flex-col border-y border-slate-200/70 dark:border-white/10">
            <div className="flex flex-1 items-start gap-3 py-4">
              <Video className="mt-0.5 size-4 shrink-0 text-sky-500" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  ڤیدیۆی ڕیکلام
                </p>
                <bdi className="mt-1 block truncate font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {campaign.video.title}
                </bdi>
                <p className="mt-1 font-mono text-[11px] text-slate-400">
                  {campaign.video.format} · {campaign.video.resolution} ·{" "}
                  {campaign.video.duration}
                </p>
              </div>
            </div>
            <div className="flex flex-1 items-start gap-3 border-t border-slate-200/60 py-4 dark:border-white/7">
              <Target className="mt-0.5 size-4 shrink-0 text-violet-500" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  ئامانجی کەمپەین
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {objectiveInfo.label}
                </p>
                <p className="mt-1 text-[11px] leading-5 text-slate-400">
                  {objectiveInfo.description}
                </p>
              </div>
            </div>
            <div className="flex flex-1 items-start gap-3 border-t border-slate-200/60 py-4 dark:border-white/7">
              <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  پەیجی ئامانج
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {campaign.destinationPage.title}
                </p>
                <bdi className="mt-1 block truncate font-mono text-[11px] text-slate-400">
                  /{campaign.destinationPage.slug}
                </bdi>
              </div>
            </div>
          </div>
        </section>

        <CampaignPerformanceOverview campaign={campaign} />

        <section className="border-t border-slate-200/70 pt-5 dark:border-white/10">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="size-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              ڕێکخستنەکانی کەمپەین
            </h3>
          </div>

          <dl className="grid grid-cols-1 text-xs sm:grid-cols-2 sm:gap-x-8">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200/50 py-3 dark:border-white/7">
              <span className="text-slate-500 dark:text-slate-400">
                ئامانج:
              </span>
              <span className="text-left font-semibold text-slate-800 dark:text-slate-200">
                {objectiveInfo.label}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 border-b border-slate-200/50 py-3 dark:border-white/7">
              <span className="text-slate-500 dark:text-slate-400">
                بودجەی ڕۆژانە:
              </span>
              <bdi className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                ${campaign.dailyBudget.toFixed(2)} / ڕۆژ
              </bdi>
            </div>

            <div className="flex items-center justify-between gap-4 border-b border-slate-200/50 py-3 dark:border-white/7">
              <span className="text-slate-500 dark:text-slate-400">
                پەیجی ئامانج:
              </span>
              <bdi className="truncate font-mono font-semibold text-slate-800 dark:text-slate-200">
                /{campaign.destinationPage.slug}
              </bdi>
            </div>

            <div className="flex items-center justify-between gap-4 border-b border-slate-200/50 py-3 dark:border-white/7">
              <span className="text-slate-500 dark:text-slate-400">
                دوگمەی بانگەواز:
              </span>
              <span className="text-left font-semibold text-slate-800 dark:text-slate-200">
                {campaign.callToAction}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 border-b border-slate-200/50 py-3 dark:border-white/7">
              <span className="text-slate-500 dark:text-slate-400">
                ناوچەی نیشانکراو:
              </span>
              <span className="text-left font-semibold text-slate-800 dark:text-slate-200">
                {campaign.targetAudience.location}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 border-b border-slate-200/50 py-3 dark:border-white/7">
              <span className="text-slate-500 dark:text-slate-400">
                ڕێکەوتی دەستپێکردن:
              </span>
              <bdi className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {new Date(campaign.createdAt).toLocaleDateString()}
              </bdi>
            </div>
          </dl>
        </section>

        {/* TikTok Marketing API v2.0 Payload Inspector */}
        <section className="border-t border-slate-200/70 pt-5 dark:border-white/10" dir="ltr">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600 border border-rose-200 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400">
                TikTok Marketing API v2.0
              </span>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Exact Production JSON Structure
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 cursor-pointer"
            >
              Copy Full JSON
            </button>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-900 p-3.5 text-xs text-slate-100 font-mono shadow-inner overflow-x-auto max-h-60">
            <pre className="text-[11px] leading-relaxed">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        </section>
      </div>
    </ManagementModal>
  );
}
