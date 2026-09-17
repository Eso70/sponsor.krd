"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  CircleDollarSign,
  DollarSign,
  Eye,
  LayoutGrid,
  Megaphone,
  MousePointerClick,
  Plus,
  Search,
  Table2,
  TrendingUp,
  X,
} from "lucide-react";

import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchModal } from "@/components/shared/SearchModal";
import { StatCard } from "@/components/shared/StatCard";
import { StatCardGrid } from "@/components/shared/StatCardGrid";
import { Tooltip } from "@/components/shared/Tooltip";
import { INITIAL_MOCK_CAMPAIGNS, OBJECTIVE_LABELS } from "../mock-data";
import { formatCostPerConversion } from "../campaign-metrics";
import type { CampaignStatus, TikTokCampaign } from "../types";
import { CampaignDetailsModal } from "./CampaignDetailsModal";
import { CampaignStatusBadge } from "./CampaignStatusBadge";
import { CampaignVideoPreview } from "./CampaignVideoPreview";
import { CreateCampaignModal } from "./CreateCampaignModal";
import { TikTokCampaignsGrid } from "./TikTokCampaignsGrid";
import { TikTokCampaignsTable } from "./TikTokCampaignsTable";

type CampaignView = "grid" | "table";
type CampaignFilter = "all" | CampaignStatus;

const STATUS_FILTERS: ReadonlyArray<{
  id: CampaignFilter;
  label: string;
}> = [
  { id: "all", label: "هەمووی" },
  { id: "active", label: "چالاک" },
  { id: "paused", label: "ڕاگیراو" },
  { id: "review", label: "پێداچوونەوە" },
  { id: "completed", label: "تەواوبوو" },
];

export function summarizeCampaigns(campaigns: TikTokCampaign[]) {
  return campaigns.reduce(
    (summary, campaign) => ({
      campaigns: summary.campaigns + 1,
      activeCampaigns:
        summary.activeCampaigns + (campaign.status === "active" ? 1 : 0),
      impressions: summary.impressions + campaign.impressions,
      clicks: summary.clicks + campaign.clicks,
      totalSpent: summary.totalSpent + campaign.totalSpent,
      conversions: summary.conversions + campaign.conversions,
    }),
    {
      campaigns: 0,
      activeCampaigns: 0,
      impressions: 0,
      clicks: 0,
      totalSpent: 0,
      conversions: 0,
    },
  );
}

export function PlatformCampaignsPage() {
  const localStorageKey = "platform_tiktok_campaigns";

  const [campaigns, setCampaigns] = useState<TikTokCampaign[]>(
    INITIAL_MOCK_CAMPAIGNS,
  );
  const [view, setView] = useState<CampaignView>("grid");
  const [statusFilter, setStatusFilter] = useState<CampaignFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] =
    useState<TikTokCampaign | null>(null);
  const [deleteCampaign, setDeleteCampaign] = useState<TikTokCampaign | null>(
    null,
  );
  const deferredSearch = useDeferredValue(searchQuery.trim().toLowerCase());

  // Load persisted campaigns if available
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(localStorageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCampaigns(parsed);
          }
        }
      } catch {
        // ignore
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [localStorageKey]);

  const saveCampaigns = (
    updater: TikTokCampaign[] | ((prev: TikTokCampaign[]) => TikTokCampaign[]),
  ) => {
    setCampaigns((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const summary = useMemo(() => summarizeCampaigns(campaigns), [campaigns]);
  const filteredCampaigns = useMemo(
    () =>
      campaigns.filter((campaign) => {
        if (statusFilter !== "all" && campaign.status !== statusFilter) {
          return false;
        }
        if (!deferredSearch) return true;
        const searchable = [
          campaign.name,
          campaign.video.title,
          OBJECTIVE_LABELS[campaign.objective].label,
          campaign.destinationPage.title,
          campaign.destinationPage.slug,
          campaign.targetAudience.location,
          campaign.callToAction,
        ]
          .join(" ")
          .toLowerCase();
        return searchable.includes(deferredSearch);
      }),
    [campaigns, deferredSearch, statusFilter],
  );

  const toggleStatus = (campaignId: string) => {
    saveCampaigns((current) =>
      current.map((campaign) =>
        campaign.id === campaignId
          ? {
              ...campaign,
              status: campaign.status === "active" ? "paused" : "active",
              updatedAt: new Date().toISOString(),
            }
          : campaign,
      ),
    );
  };

  const collectionProps = {
    campaigns: filteredCampaigns,
    onToggleStatus: toggleStatus,
    onViewDetails: setSelectedCampaign,
    onDeleteCampaign: setDeleteCampaign,
  };

  return (
    <div className="space-y-8" dir="ltr">
      <StatCardGrid columns={3}>
        <StatCard
          icon={Megaphone}
          label="کۆی کەمپەینەکان"
          value={summary.campaigns}
          subtitle={`${summary.activeCampaigns.toLocaleString()} کەمپەینی چالاک`}
          color="blue"
        />
        <StatCard
          icon={Eye}
          label="کۆی پیشاندانەکان"
          value={summary.impressions}
          color="purple"
        />
        <StatCard
          icon={MousePointerClick}
          label="کۆی کلیکەکان"
          value={summary.clicks}
          color="green"
        />
        <StatCard
          icon={DollarSign}
          label="کۆی خەرجی"
          value={`$${summary.totalSpent.toFixed(2)}`}
          color="orange"
        />
        <StatCard
          icon={TrendingUp}
          label="کۆی گۆڕانەکان"
          value={summary.conversions}
          color="pink"
        />
        <StatCard
          icon={CircleDollarSign}
          label="تێچووی هەر گۆڕانێک"
          value={formatCostPerConversion({
            totalSpent: summary.totalSpent,
            conversions: summary.conversions,
          })}
          color="slate"
        />
      </StatCardGrid>

      <section className="w-full space-y-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1c222b] sm:p-6">
        <PageHeader
          title="بەڕێوەبردنی کەمپەینەکان"
          description="کەمپەینە ڤیدیۆییەکانی تیکتۆک ببینە، بگەڕێ و بە شێوەی گرید یان خشتە بەڕێوەیان ببە."
          icon={Megaphone}
          action={
            <>
              <Tooltip
                content={
                  searchQuery.trim() ? "پاککردنەوەی گەڕان" : "گەڕان (Ctrl+K)"
                }
                side="bottom"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (searchQuery.trim()) setSearchQuery("");
                    else setSearchOpen(true);
                  }}
                  className={`group flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm transition hover:shadow sm:px-3.5 ${searchQuery.trim() ? "sa-soft sa-soft-border" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 sm:w-44 sm:justify-between"}`}
                  aria-label={
                    searchQuery.trim() ? "پاککردنەوەی گەڕان" : "گەڕان"
                  }
                >
                  {searchQuery.trim() ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <>
                      <span className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        <span className="hidden text-xs font-semibold sm:inline">
                          گەڕان...
                        </span>
                      </span>
                      <kbd className="hidden rounded bg-slate-100 px-1 py-0.5 font-sans text-[8px] font-bold text-slate-400 dark:bg-white/10 sm:inline-flex">
                        Ctrl K
                      </kbd>
                    </>
                  )}
                </button>
              </Tooltip>

              <div className="flex h-10 shrink-0 items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-white/5">
                <Tooltip content="بینینی گرید" side="bottom">
                  <button
                    type="button"
                    onClick={() => setView("grid")}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${view === "grid" ? "sa-gradient sa-ink shadow-md" : "text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"}`}
                    aria-label="بینینی گرید"
                    aria-pressed={view === "grid"}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </Tooltip>
                <Tooltip content="بینینی خشتە" side="bottom">
                  <button
                    type="button"
                    onClick={() => setView("table")}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${view === "table" ? "sa-gradient sa-ink shadow-md" : "text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"}`}
                    aria-label="بینینی خشتە"
                    aria-pressed={view === "table"}
                  >
                    <Table2 className="h-4 w-4" />
                  </button>
                </Tooltip>
              </div>

              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="sa-gradient sa-ink flex h-10 items-center justify-center gap-2 rounded-xl px-3.5 text-xs font-bold shadow-md transition hover:brightness-95"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">کەمپەینی نوێ</span>
              </button>
            </>
          }
        />

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5 dark:border-white/5">
          {STATUS_FILTERS.map((filter) => {
            const count =
              filter.id === "all"
                ? campaigns.length
                : campaigns.filter((campaign) => campaign.status === filter.id)
                    .length;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setStatusFilter(filter.id)}
                className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-all duration-200 ${statusFilter === filter.id ? "sa-soft sa-soft-border shadow-sm" : "border-transparent bg-transparent text-slate-500 hover:border-slate-200/70 hover:bg-white dark:text-slate-400 dark:hover:border-white/10 dark:hover:bg-white/5"}`}
                aria-pressed={statusFilter === filter.id}
              >
                {filter.label}
                <span className="font-mono text-[10px] opacity-70">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {view === "grid" ? (
          <TikTokCampaignsGrid {...collectionProps} />
        ) : (
          <TikTokCampaignsTable {...collectionProps} />
        )}
      </section>

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        placeholder="گەڕان بە ناوی کەمپەین، ڤیدیۆ یان لاپەڕە..."
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        wide
      >
        <div className="space-y-1 p-1">
          {filteredCampaigns.length ? (
            filteredCampaigns.slice(0, 6).map((campaign) => (
              <button
                key={campaign.id}
                type="button"
                onClick={() => {
                  setSelectedCampaign(campaign);
                  setSearchOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-slate-50 dark:hover:bg-white/5"
              >
                <CampaignVideoPreview campaign={campaign} compact />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {campaign.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                    {campaign.video.title} · /{campaign.destinationPage.slug}
                  </span>
                </span>
                <CampaignStatusBadge status={campaign.status} />
              </button>
            ))
          ) : (
            <p className="p-6 text-center text-sm text-slate-500">
              هیچ کەمپەینێک نەدۆزرایەوە
            </p>
          )}
        </div>
      </SearchModal>

      <CreateCampaignModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        sponsorKrdTheme
        onCreate={(campaign) =>
          saveCampaigns((current) => [campaign, ...current])
        }
      />

      <CampaignDetailsModal
        campaign={selectedCampaign}
        isOpen={!!selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
        sponsorKrdTheme
      />

      <ConfirmDeleteModal
        isOpen={!!deleteCampaign}
        onClose={() => setDeleteCampaign(null)}
        title="سڕینەوەی کەمپەین"
        message={
          deleteCampaign
            ? `دڵنیایت لە سڕینەوەی «${deleteCampaign.name}»؟`
            : ""
        }
        onConfirm={async () => {
          if (!deleteCampaign) return;
          saveCampaigns((current) =>
            current.filter((campaign) => campaign.id !== deleteCampaign.id),
          );
        }}
      />
    </div>
  );
}
