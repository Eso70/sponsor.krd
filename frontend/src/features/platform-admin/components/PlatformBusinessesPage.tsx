"use client";

import { useRef, useState } from "react";

import {
  ClipboardList,
  Download,
  Link2,
  Upload,
  Users,
  UserCheck,
  Clock3,
} from "lucide-react";
import { DashboardRefreshRegion } from "@/components/shared/DashboardRefreshRegion";
import { platformLoadingCopy } from "@/features/platform-admin/i18n/loading-copy";
import { StatCard } from "@/components/shared/StatCard";
import { PageManagementSection } from "@/components/shared/PageManagementSection";
import { PageManagementActions } from "@/components/shared/PageManagementActions";
import { ManagementSearchTrigger } from "@/components/shared/ManagementSearchTrigger";
import { ManagementViewToggle } from "@/components/shared/ManagementViewToggle";
import { pageActionCopy } from "@/features/shared/i18n/page-action-copy";
import { SettingsActionButton } from "@/components/shared/SettingsActionButton";
import type { PlatformBusiness as Business } from "@linktree/types";
import type {
  BusinessPagination,
  BusinessSummary,
} from "@/features/platform-admin/hooks/useBusinesses";
import { StatCardGrid } from "@/components/shared/StatCardGrid";
import { SignupApplicationsPanel } from "@/features/platform-admin/components/SignupApplicationsPanel";
import { BusinessInvitationButton } from "@/features/platform-admin/components/BusinessInvitationButton";
import {
  SegmentedTabs,
  type SegmentedTab,
} from "@/components/shared/SegmentedTabs";
import { PlatformBusinessDirectoryContent } from "@/features/platform-admin/components/PlatformBusinessDirectoryContent";
import {
  downloadBusinessBackup,
  uploadBusinessBackup,
} from "@/features/platform-admin/business-backup-transfer";
import { toast } from "sonner";
import { usePlatformCopy } from "@/features/platform-admin/i18n/copy";
import { usePlatformLocale } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { platformRequestError } from "@/features/platform-admin/i18n/request-error";

type BusinessManagementSection = "businesses" | "applications";

interface PlatformBusinessesPageProps {
  businesses: Business[];
  filteredBusinesses: Business[];
  isRefreshing: boolean;
  searchQuery: string;
  isSearchModalOpen: boolean;
  viewMode: "grid" | "table";
  page: number;
  pagination: BusinessPagination;
  summary: BusinessSummary;
  summaryUnavailable?: boolean;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onSearchAction: () => void;
  onViewModeChange: (viewMode: "grid" | "table") => void;
  onEdit: (business: Business) => void;
  onDelete: (id: string) => void;
  onViewAnalytics: (business: Business) => void;
  onManageSessions: (business: Business) => void;
  onOpenDashboard: (business: Business) => void;
}

export function PlatformBusinessesPage({
  businesses,
  filteredBusinesses,
  isRefreshing,
  searchQuery,
  isSearchModalOpen,
  viewMode,
  page,
  pagination,
  summary,
  summaryUnavailable = false,
  onPageChange,
  onRefresh,
  onSearchAction,
  onViewModeChange,
  onEdit,
  onDelete,
  onViewAnalytics,
  onManageSessions,
  onOpenDashboard,
}: PlatformBusinessesPageProps) {
  const copy = usePlatformCopy();
  const { locale } = usePlatformLocale();
  const [section, setSection] =
    useState<BusinessManagementSection>("businesses");
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      await uploadBusinessBackup("/api/platform/businesses/import", file);
      toast.success(copy.importSuccess);
      onRefresh();
    } catch (error) {
      toast.error(copy.importFailure, {
        description: platformRequestError(error instanceof Error ? error.message : null, copy.importFailure, locale),
      });
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadBusinessBackup(
        "/api/platform/businesses/export",
        "sponsor-krd-businesses.json",
      );
      toast.success(copy.exportSuccess);
    } catch (error) {
      toast.error(copy.exportFailure, {
        description: platformRequestError(error instanceof Error ? error.message : null, copy.exportFailure, locale),
      });
    } finally {
      setExporting(false);
    }
  };
  const tabs: SegmentedTab<BusinessManagementSection>[] = [
    {
      id: "businesses",
      label: copy.businesses,
      icon: Users,
    },
    {
      id: "applications",
      label: copy.applications,
      icon: ClipboardList,
    },
  ];

  return (
    <>
      <StatCardGrid columns={3} className="mb-8">
        <StatCard
          loading={isRefreshing}
          icon={Users}
          label={copy.totalBusinesses}
          value={summaryUnavailable ? "—" : summary.total}
          color="blue"
        />
        <StatCard
          loading={isRefreshing}
          icon={UserCheck}
          label={copy.active}
          value={summaryUnavailable ? "—" : summary.active}
          color="green"
        />
        <StatCard
          loading={isRefreshing}
          icon={Clock3}
          label={copy.suspended}
          value={summaryUnavailable ? "—" : summary.suspended}
          color="orange"
        />
        <StatCard
          loading={isRefreshing}
          icon={ClipboardList}
          label={copy.pendingApplications}
          value={summaryUnavailable ? "—" : summary.pendingApplications}
          color="purple"
        />
        <StatCard
          loading={isRefreshing}
          icon={ClipboardList}
          label={copy.totalApplications}
          value={summaryUnavailable ? "—" : summary.totalApplications}
          color="slate"
        />
        <StatCard
          loading={isRefreshing}
          icon={Link2}
          label={copy.activeInvitations}
          value={summaryUnavailable ? "—" : summary.activeInvitations}
          color="pink"
        />
      </StatCardGrid>

      <SegmentedTabs
        fullWidth
        tabs={tabs}
        value={section}
        onChange={setSection}
        accent="var(--sponsor-krd-accent)"
        className="mb-6"
      />

      <PageManagementSection
          title={section === "businesses" ? copy.businesses : copy.applications}
          description={
            section === "businesses"
              ? copy.businessesDescription
              : copy.applicationsDescription
          }
          icon={<Users className="size-5" />}
          toolbar={
            <PageManagementActions>
              {section === "businesses" && <>
                <input ref={importInputRef} type="file" accept="application/json,.json" className="hidden"
                  onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleImport(file); }} />
                <ManagementSearchTrigger query={searchQuery} open={isSearchModalOpen} onClick={onSearchAction}
                  labels={{ clearSearch: copy.clearSearch, searchTooltip: `${copy.search} (Ctrl+K)`, search: copy.search, searchPlaceholder: copy.searchPlaceholder }} />
                <ManagementViewToggle value={viewMode} onChange={onViewModeChange} gridLabel={pageActionCopy(locale).gridView} tableLabel={pageActionCopy(locale).tableView} accentMode="platform" />
                <SettingsActionButton label={copy.importBackup} icon={Upload} variant="soft" iconOnly busy={importing} disabled={exporting} onClick={() => importInputRef.current?.click()} />
                <SettingsActionButton label={copy.exportBackup} icon={Download} variant="soft" iconOnly busy={exporting} disabled={importing} onClick={() => void handleExport()} />
              </>}
              <BusinessInvitationButton showLabel />
            </PageManagementActions>
          }
      >

        <div className={section === "applications" ? "block" : "hidden"}>
          <SignupApplicationsPanel
            onApproved={onRefresh}
          />
        </div>
        <div className={section === "businesses" ? "block" : "hidden"}>
          <DashboardRefreshRegion loading={isRefreshing} label={platformLoadingCopy[locale].businessDirectory}>
        <PlatformBusinessDirectoryContent
            businesses={businesses}
            filteredBusinesses={filteredBusinesses}
            viewMode={viewMode}
            page={page}
            pagination={pagination}
            onPageChange={onPageChange}
            onEdit={onEdit}
            onDelete={onDelete}
            onViewAnalytics={onViewAnalytics}
            onManageSessions={onManageSessions}
            onOpenDashboard={onOpenDashboard}
          />
        </DashboardRefreshRegion>
        </div>
      </PageManagementSection>
    </>
  );
}
