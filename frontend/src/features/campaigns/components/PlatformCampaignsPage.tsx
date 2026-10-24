"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  CircleDollarSign,
  DollarSign,
  Eye,
  Megaphone,
  MousePointerClick,
  Plus,
  TrendingUp,
} from "lucide-react";

import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal";
import { PageManagementSection } from "@/components/shared/PageManagementSection";
import { PageManagementActions } from "@/components/shared/PageManagementActions";
import { ManagementSearchTrigger } from "@/components/shared/ManagementSearchTrigger";
import { ManagementViewToggle } from "@/components/shared/ManagementViewToggle";
import { SettingsActionButton } from "@/components/shared/SettingsActionButton";
import { DashboardRefreshRegion } from "@/components/shared/DashboardRefreshRegion";
import { useRegisterDashboardRefresh } from "@/components/shared/dashboard-refresh";
import { SHARED_SOFT_BUTTON_CLASS } from "@/components/shared/shared-control-styles";
import { pageActionCopy } from "@/features/shared/i18n/page-action-copy";
import { SearchModal } from "@/components/shared/SearchModal";
import { StatCard } from "@/components/shared/StatCard";
import { StatCardGrid } from "@/components/shared/StatCardGrid";
import { OBJECTIVE_LABELS } from "../campaign-objectives";
import { campaignReportedValue, formatCostPerConversion } from "../campaign-metrics";
import type { CampaignStatus, TikTokCampaign } from "../types";
import { CampaignDetailsModal } from "./CampaignDetailsModal";
import { CampaignStatusBadge } from "./CampaignStatusBadge";
import { CampaignVideoPreview } from "./CampaignVideoPreview";
import { CreateCampaignModal } from "./CreateCampaignModal";
import { TikTokCampaignsGrid } from "./TikTokCampaignsGrid";
import { TikTokCampaignsTable } from "./TikTokCampaignsTable";
import { usePlatformLocale } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { platformLoadingCopy } from "@/features/platform-admin/i18n/loading-copy";
import { campaignCopy } from "../campaign-copy";
import { useCampaignText } from "../use-campaign-text";

type CampaignView = "grid" | "table";
type CampaignFilter = "all" | CampaignStatus;

const STATUS_FILTERS: ReadonlyArray<CampaignFilter> = ["all", "active", "paused", "review", "completed"];

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
  const { locale } = usePlatformLocale();
  const copy = campaignCopy[locale];
  const t = useCampaignText();
  const localStorageKey = "platform_tiktok_campaigns";

  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<TikTokCampaign[]>([]);
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

  const loadCampaigns = useCallback((rethrow = false) => {
    try {
      const stored = window.localStorage.getItem(localStorageKey);
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(parsed)) throw new Error("Invalid stored campaigns");
      const savedCampaigns = (parsed as TikTokCampaign[]).filter((campaign) => !/^camp-00[1-4]$/.test(campaign?.id));
      setCampaigns(savedCampaigns);
      if (savedCampaigns.length !== parsed.length) window.localStorage.setItem(localStorageKey, JSON.stringify(savedCampaigns));
    } catch (error) {
      if (rethrow) throw error;
    } finally {
      setLoading(false);
    }
  }, [localStorageKey]);
  const refreshing = useRegisterDashboardRefresh("campaigns", () => loadCampaigns(true));
  useEffect(() => {
    const timer = window.setTimeout(() => loadCampaigns(), 0);
    return () => window.clearTimeout(timer);
  }, [loadCampaigns]);

  const saveCampaigns = (
    updater: TikTokCampaign[] | ((prev: TikTokCampaign[]) => TikTokCampaign[]),
  ) => {
    setCampaigns((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      try {
        window.localStorage.setItem(localStorageKey, JSON.stringify(next));
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
          t(OBJECTIVE_LABELS[campaign.objective].label),
          campaign.destinationPage.title,
          campaign.destinationPage.slug,
          campaign.targetAudience.location,
          campaign.callToAction,
        ]
          .join(" ")
          .toLowerCase();
        return searchable.includes(deferredSearch);
      }),
    [campaigns, deferredSearch, statusFilter, t],
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
      <p className="text-xs text-slate-500 dark:text-slate-400">{copy.reportingUnavailable}</p>
      <StatCardGrid columns={3}>
        <StatCard
          loading={loading || refreshing}
          loadingLabel={platformLoadingCopy[locale].loading}
          icon={Megaphone}
          label={copy.totalCampaigns}
          value={summary.campaigns}
          subtitle={`${summary.activeCampaigns.toLocaleString()} ${copy.activeCampaigns}`}
          color="blue"
        />
        <StatCard
          loading={loading || refreshing}
          loadingLabel={platformLoadingCopy[locale].loading}
          icon={Eye}
          label={copy.totalImpressions}
          value={campaignReportedValue(summary.impressions)}
          color="purple"
        />
        <StatCard
          loading={loading || refreshing}
          loadingLabel={platformLoadingCopy[locale].loading}
          icon={MousePointerClick}
          label={copy.totalClicks}
          value={campaignReportedValue(summary.clicks)}
          color="green"
        />
        <StatCard
          loading={loading || refreshing}
          loadingLabel={platformLoadingCopy[locale].loading}
          icon={DollarSign}
          label={copy.totalSpent}
          value={campaignReportedValue(`$${summary.totalSpent.toFixed(2)}`)}
          color="orange"
        />
        <StatCard
          loading={loading || refreshing}
          loadingLabel={platformLoadingCopy[locale].loading}
          icon={TrendingUp}
          label={copy.totalConversions}
          value={campaignReportedValue(summary.conversions)}
          color="pink"
        />
        <StatCard
          loading={loading || refreshing}
          loadingLabel={platformLoadingCopy[locale].loading}
          icon={CircleDollarSign}
          label={copy.costPerConversion}
          value={campaignReportedValue(formatCostPerConversion({
            totalSpent: summary.totalSpent,
            conversions: summary.conversions,
          }))}
          color="slate"
        />
      </StatCardGrid>

      <PageManagementSection title={copy.title} description={copy.description} icon={<Megaphone className="size-5" />}
        toolbar={<PageManagementActions>
          <ManagementSearchTrigger query={searchQuery} open={searchOpen}
            onClick={() => searchQuery.trim() ? setSearchQuery("") : setSearchOpen(true)}
            labels={{ clearSearch: copy.clearSearch, searchTooltip: copy.searchShortcut, search: copy.search, searchPlaceholder: copy.searchPlaceholder }} />
          <ManagementViewToggle value={view} onChange={setView} gridLabel={pageActionCopy(locale).gridView} tableLabel={pageActionCopy(locale).tableView} accentMode="platform" />
          <SettingsActionButton label={copy.newCampaign} icon={Plus} onClick={() => setCreateOpen(true)} />
        </PageManagementActions>}>
        <DashboardRefreshRegion loading={loading || refreshing} label={platformLoadingCopy[locale].loading}>

        <div className="flex flex-wrap items-center gap-2 pb-5">
          {STATUS_FILTERS.map((filter) => {
            const count =
              filter === "all"
                ? campaigns.length
                : campaigns.filter((campaign) => campaign.status === filter)
                    .length;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`${SHARED_SOFT_BUTTON_CLASS} inline-flex h-9 items-center gap-2 px-3 text-xs font-semibold`}
                aria-pressed={statusFilter === filter}
              >
                {copy.filters[filter]}
                <span className="text-[10px] tabular-nums opacity-70">
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
        </DashboardRefreshRegion>
      </PageManagementSection>

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        placeholder={copy.searchCampaigns}
        clearLabel={copy.clearSearch}
        applyLabel={copy.close}
        clearAriaLabel={copy.clearSearch}
        applyAriaLabel={copy.close}
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
              {copy.noCampaigns}
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
        title={copy.deleteTitle}
        confirmLabel={copy.confirmDelete}
        cancelLabel={copy.cancel}
        closeLabel={copy.close}
        message={
          deleteCampaign
            ? `${copy.deleteQuestion} «${deleteCampaign.name}»؟`
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
