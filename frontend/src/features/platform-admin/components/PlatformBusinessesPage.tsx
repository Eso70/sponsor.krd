"use client";

import { useRef, useState } from "react";
import { MotionSpinner } from "@/components/motion/MotionPrimitives";

import {
  ClipboardList,
  Download,
  LayoutGrid,
  Link2,
  Loader2,
  RefreshCw,
  Search,
  Table2,
  Upload,
  Users,
  UserCheck,
  Clock3,
  X,
} from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import type { PlatformBusiness as Business } from "@linktree/types";
import type {
  BusinessPagination,
  BusinessSummary,
} from "@/features/platform-admin/hooks/useBusinesses";
import { StatCardGrid } from "@/components/shared/StatCardGrid";
import { Tooltip } from "@/components/shared/Tooltip";
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
import { DashboardSurface } from "@/components/shared/DashboardSurface";
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
  const [applicationReloadToken, setApplicationReloadToken] = useState(0);
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
          icon={Users}
          label={copy.totalBusinesses}
          value={summary.total}
          color="blue"
        />
        <StatCard
          icon={UserCheck}
          label={copy.active}
          value={summary.active}
          color="green"
        />
        <StatCard
          icon={Clock3}
          label={copy.suspended}
          value={summary.suspended}
          color="orange"
        />
        <StatCard
          icon={ClipboardList}
          label={copy.pendingApplications}
          value={summary.pendingApplications}
          color="purple"
        />
        <StatCard
          icon={ClipboardList}
          label={copy.totalApplications}
          value={summary.totalApplications}
          color="slate"
        />
        <StatCard
          icon={Link2}
          label={copy.activeInvitations}
          value={summary.activeInvitations}
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

      <DashboardSurface as="div" className="space-y-6">
        <PageHeader
          title={section === "businesses" ? copy.businesses : copy.applications}
          description={
            section === "businesses"
              ? copy.businessesDescription
              : copy.applicationsDescription
          }
          icon={Users}
          action={
            <div className="flex items-center gap-2">
              {section === "businesses" ? (
                <>
                  <input
                    ref={importInputRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleImport(file);
                    }}
                  />
                  <Tooltip
                    content={copy.importBackup}
                    side="bottom"
                  >
                    <button
                      type="button"
                      onClick={() => importInputRef.current?.click()}
                      disabled={importing || exporting}
                      className="group flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 cursor-pointer"
                      aria-label={copy.importBackup}
                    >
                      {importing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </button>
                  </Tooltip>
                  <Tooltip content={copy.exportBackup} side="bottom">
                    <button
                      type="button"
                      onClick={() => void handleExport()}
                      disabled={importing || exporting}
                      className="group flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 cursor-pointer"
                      aria-label={copy.exportBackup}
                    >
                      {exporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </button>
                  </Tooltip>
                  <Tooltip
                    content={
                      searchQuery.trim()
                        ? copy.clearSearch
                        : `${copy.search} (Ctrl+K)`
                    }
                    side="bottom"
                  >
                    <button
                      onClick={onSearchAction}
                      className={`group relative flex items-center justify-center h-10 w-10 px-0 rounded-xl border transition-all duration-300 shadow-sm hover:shadow cursor-pointer ${searchQuery.trim() ? "" : "sm:w-44 sm:justify-between sm:px-3.5"} ${
                        isSearchModalOpen
                          ? "sa-soft sa-soft-border"
                          : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-750 dark:text-gray-400 dark:hover:text-white hover:bg-slate-50/50 dark:hover:bg-white/10"
                      }`}
                      aria-label={
                        searchQuery.trim() ? copy.clearSearch : copy.search
                      }
                    >
                      {searchQuery.trim() ? (
                        <X className="h-4 w-4 text-slate-500 transition-transform group-hover:scale-110 dark:text-gray-400" />
                      ) : (
                        <>
                          <div className="flex items-center gap-2 min-w-0">
                            <Search className="h-4 w-4 shrink-0 text-slate-400 dark:text-gray-500 group-hover:scale-110 transition-transform" />
                            <span className="hidden sm:inline text-xs font-semibold text-slate-400 dark:text-gray-500 group-hover:text-slate-650 dark:group-hover:text-gray-300 transition-colors truncate">
                              {copy.searchPlaceholder}
                            </span>
                          </div>
                          <kbd className="hidden sm:inline-flex items-center gap-0.5 font-sans font-bold text-[8px] text-slate-400 dark:text-gray-500 bg-slate-100 dark:bg-white/10 px-1 py-0.5 rounded select-none">
                            <span>Ctrl</span>
                            <span>K</span>
                          </kbd>
                        </>
                      )}
                    </button>
                  </Tooltip>

                  <div className="flex items-center h-10 p-1 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm shrink-0">
                    <Tooltip content={copy.gridView} side="bottom">
                      <button
                        onClick={() => onViewModeChange("grid")}
                        className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-300 cursor-pointer ${viewMode === "grid" ? "sa-gradient sa-ink shadow-md" : "text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white hover:bg-slate-50/50 dark:hover:bg-white/5"}`}
                        aria-label={copy.gridView}
                        title={copy.gridView}
                      >
                        <LayoutGrid className="h-4 w-4 shrink-0" />
                      </button>
                    </Tooltip>
                    <Tooltip content={copy.tableView} side="bottom">
                      <button
                        onClick={() => onViewModeChange("table")}
                        className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-300 cursor-pointer ${viewMode === "table" ? "sa-gradient sa-ink shadow-md" : "text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white hover:bg-slate-50/50 dark:hover:bg-white/5"}`}
                        aria-label={copy.tableView}
                        title={copy.tableView}
                      >
                        <Table2 className="h-4 w-4 shrink-0" />
                      </button>
                    </Tooltip>
                  </div>
                </>
              ) : null}

              <Tooltip content={copy.refresh} side="bottom">
                <button
                  type="button"
                  onClick={() => {
                    if (section === "businesses") onRefresh();
                    else setApplicationReloadToken((value) => value + 1);
                  }}
                  disabled={section === "businesses" && isRefreshing}
                  className="group flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10 cursor-pointer"
                  title={copy.refresh}
                  aria-label={copy.refresh}
                >
                  <MotionSpinner
                    active={section === "businesses" && isRefreshing}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </MotionSpinner>
                </button>
              </Tooltip>

              <BusinessInvitationButton showLabel />
            </div>
          }
        />

        <div className={section === "applications" ? "block" : "hidden"}>
          <SignupApplicationsPanel
            onApproved={onRefresh}
            reloadToken={applicationReloadToken}
          />
        </div>
        <div className={section === "businesses" ? "block" : "hidden"}>
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
        </div>
      </DashboardSurface>
    </>
  );
}
