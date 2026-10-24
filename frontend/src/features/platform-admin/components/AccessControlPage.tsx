"use client";
import { PAGE_MANAGEMENT_PAGE_SIZE } from "@/components/shared/page-management";



import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlaskConical,
  KeyRound,
  Layers3,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageManagementSection } from "@/components/shared/PageManagementSection";
import { PageManagementActions } from "@/components/shared/PageManagementActions";
import { SettingsActionButton } from "@/components/shared/SettingsActionButton";
import { SearchModal } from "@/components/shared/SearchModal";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import { TablePagination } from "@/components/shared/TablePagination";
import { DashboardRefreshRegion } from "@/components/shared/DashboardRefreshRegion";
import { useRegisterDashboardRefresh } from "@/components/shared/dashboard-refresh";
import { useLatestRequest } from "@/hooks/useLatestRequest";
import { RequestErrorNotice } from "@/components/shared/RequestErrorNotice";
import { StatCard } from "@/components/shared/StatCard";
import { DetailViewModal } from "@/components/shared/DetailViewModal";
import type { Overview, Permission, Tab } from "./access-control/types";
import { AccessTable } from "./access-control/AccessTable";
import { PermissionProfiles } from "./access-control/PermissionProfiles";
import { PolicySimulator } from "./access-control/PolicySimulator";
import { getPermissionCategory, getPermissionDescription } from "./access-control/permission-descriptions";
import {
  Badge,
  riskLevelLabel,
  TableSkeleton,
} from "./access-control/SharedUI";
import { StatCardGrid } from "@/components/shared/StatCardGrid";
import { usePlatformLocale } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { platformLoadingCopy } from "@/features/platform-admin/i18n/loading-copy";
import { accessCopy } from "./access-control/access-copy";
import { platformRequestError } from "@/features/platform-admin/i18n/request-error";

export function AccessControlPage() {
  const { locale } = usePlatformLocale();
  const copy = accessCopy[locale];
  const copyRef = useRef(copy);
  useEffect(() => { copyRef.current = copy; }, [copy]);
  const tabs = [
    { id: "profiles" as const, label: copy.tabs.profiles, icon: Layers3 },
    { id: "permissions" as const, label: copy.tabs.permissions, icon: KeyRound },
    { id: "simulator" as const, label: copy.tabs.simulator, icon: FlaskConical },
  ];
  const startRequest = useLatestRequest();
  const [loadFailed, setLoadFailed] = useState(false);
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [tab, setTab] = useState<Tab>("profiles");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [searchOpen, setSearchOpen] = useState(false);
  const [createProfileOpen, setCreateProfileOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] =
    useState<Permission | null>(null);

  const load = useCallback(async (rethrow = false) => {
    setLoading(true);
    const current = startRequest();
    try {
      const response = await fetch(
        `/api/platform/access-control?refresh=${reload}`,
        { credentials: "include", cache: "no-store" },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(platformRequestError(result.message, copyRef.current.loadFailed, locale));
      }
      if (!result.data?.summary) throw new Error("Invalid dashboard summary");
      if (!current()) return;
      setLoadFailed(false);
      setData(result.data);
    } catch (error) {
      if (!current()) return;
      setLoadFailed(true);
      toast.error(
        platformRequestError(error instanceof Error ? error.message : null, copyRef.current.loadFailed, locale),
      );
      if (rethrow) throw error;
    } finally {
      if (current()) setLoading(false);
    }
  }, [reload, locale, startRequest]);

  useRegisterDashboardRefresh("access-control", () => load(true));

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.permissions.filter((permission) => {
      const text =
        `${permission.key} ${permission.description} ${getPermissionDescription(permission.key, locale)} ${permission.category}`.toLowerCase();
      return !deferredSearch || text.includes(deferredSearch);
    });
  }, [data, deferredSearch, locale]);

  const pageSize = PAGE_MANAGEMENT_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const items = filtered.slice((page - 1) * pageSize, page * pageSize);
  const title = copy.title[tab];
  const description = copy.description[tab];
  const SectionIcon =
    tab === "profiles"
      ? Layers3
      : tab === "permissions"
        ? KeyRound
        : FlaskConical;

  return (
    <div className="space-y-5" dir="ltr">
      {loadFailed && <RequestErrorNotice message={copy.loadFailed} />}
      <StatCardGrid columns={2}>
        <StatCard
          loading={loading}
          loadingLabel={platformLoadingCopy[locale].loading}
          icon={KeyRound}
          label={copy.businessPermissions}
          value={loadFailed ? "—" : data?.summary.permissions ?? "—"}
          color="green"
        />
        <StatCard
          loading={loading}
          loadingLabel={platformLoadingCopy[locale].loading}
          icon={Layers3}
          label={copy.permissionProfiles}
          value={loadFailed ? "—" : data?.summary.profiles ?? "—"}
          color="blue"
        />
      </StatCardGrid>

      <SegmentedTabs
        tabs={tabs}
        value={tab}
        onChange={(value) => {
          setTab(value);
          setPage(1);
          setSearch("");
        }}
        accent="var(--sponsor-krd-accent)"
      />

      <PageManagementSection
          title={title}
          description={description}
          icon={<SectionIcon className="size-5" />}
          toolbar={
            <PageManagementActions>
              {tab === "permissions" && <SettingsActionButton label={copy.search} icon={SlidersHorizontal} variant="soft" onClick={() => setSearchOpen(true)} />}
              {tab === "profiles" && <SettingsActionButton label={copy.newProfile} icon={Plus} onClick={() => setCreateProfileOpen(true)} />}
            </PageManagementActions>
          }
      >

          <DashboardRefreshRegion loading={loading} label={platformLoadingCopy[locale].loading}>
          {tab === "profiles" && data ? (
            <PermissionProfiles
              permissions={data.permissions}
              profiles={data.profiles}
              createOpen={createProfileOpen}
              onCreateOpenChange={setCreateProfileOpen}
              onChanged={() => setReload((value) => value + 1)}
            />
          ) : tab === "simulator" && data ? (
            <PolicySimulator data={data} />
          ) : loading && !data ? (
            <TableSkeleton loadingLabel={locale === "ar" ? "جارٍ تحميل جدول الصلاحيات" : locale === "en" ? "Loading permissions table" : "خشتەی مۆڵەتەکان بار دەکرێت"} />
          ) : items.length ? (
            <AccessTable items={items} onPermission={setSelectedPermission} />
          ) : (
            <EmptyState
              icon={KeyRound}
              title={copy.empty}
              description={copy.emptyDescription}
            />
          )}

          </DashboardRefreshRegion>

          {tab === "permissions" && (
            <TablePagination
              page={page}
              pageSize={pageSize}
              totalItems={filtered.length}
              totalPages={totalPages}
              onPageChange={setPage}
              copy={{ of: copy.of, previous: copy.previous, next: copy.next }}
            />
          )}
      </PageManagementSection>

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        placeholder={copy.searchPlaceholder}
        clearLabel={copy.clear}
        applyLabel={copy.close}
        clearAriaLabel={copy.clear}
        applyAriaLabel={copy.close}
        searchQuery={search}
        onSearchQueryChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
      >
        <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs text-slate-500 dark:border-white/10">
          <span>{filtered.length} {copy.results}</span>
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="flex items-center gap-1 text-red-500"
            >
              <X className="h-3.5 w-3.5" />
              {copy.clear}
            </button>
          )}
        </div>
        <div className="mt-2">
          {!search ? (
            <div className="flex flex-col items-center gap-2 py-8 text-xs text-slate-400">
              <Search className="h-5 w-5 opacity-40" />
              {copy.searchPrompt}
            </div>
          ) : (
            filtered.slice(0, 20).map((permission) => (
              <button
                key={permission.id}
                type="button"
                onClick={() => {
                  setSelectedPermission(permission);
                  setSearchOpen(false);
                }}
                className="block w-full rounded-xl p-2.5 text-left hover:bg-slate-50 dark:hover:bg-white/5"
              >
                <p className="font-mono text-xs font-bold sa-accent-text">
                  {permission.key}
                </p>
                <p
                  className="mt-1 text-[10px] font-medium text-slate-500"
                  dir={locale === "en" ? "ltr" : "rtl"}
                >
                  {getPermissionDescription(permission.key, locale)}
                </p>
              </button>
            ))
          )}
        </div>
      </SearchModal>

      <DetailViewModal
        isOpen={!!selectedPermission}
        onClose={() => setSelectedPermission(null)}
        title={selectedPermission?.key || ""}
        subtitle={copy.detailSubtitle}
        icon={KeyRound}
        iconClassName="sa-soft sa-soft-border"
        fields={
          selectedPermission
            ? [
                {
                  label: copy.category,
                  value: getPermissionCategory(selectedPermission.category, locale),
                },
                {
                  label: copy.resource,
                  value: (
                    <span className="font-mono text-xs">
                      {selectedPermission.resource}
                    </span>
                  ),
                },
                {
                  label: copy.action,
                  value: (
                    <span className="font-mono text-xs">
                      {selectedPermission.action}
                    </span>
                  ),
                },
                {
                  label: copy.risk,
                  value: (
                    <Badge
                      text={riskLevelLabel(selectedPermission.riskLevel, locale)}
                      tone={
                        selectedPermission.riskLevel === "critical"
                          ? "red"
                          : selectedPermission.riskLevel === "sensitive"
                            ? "orange"
                            : "green"
                      }
                    />
                  ),
                },
                {
                  label: copy.approval,
                  value: selectedPermission.supportsApproval
                    ? copy.supported
                    : copy.unsupported,
                },
                {
                  label: copy.profiles,
                  value: selectedPermission.profiles.length
                    ? selectedPermission.profiles.join("، ")
                    : copy.notInProfile,
                },
                {
                  label: copy.explanation,
                  value: (
                    <div className="space-y-2">
                      <p
                        className="font-semibold leading-6 text-slate-700 dark:text-slate-200"
                        dir={locale === "en" ? "ltr" : "rtl"}
                      >
                        {getPermissionDescription(selectedPermission.key, locale)}
                      </p>
                    </div>
                  ),
                  fullWidth: true,
                },
                {
                  label: copy.fields,
                  value: Object.keys(selectedPermission.fieldSchema).length ? (
                    <div className="overflow-hidden rounded-xl border border-slate-200 divide-y divide-slate-100 dark:border-white/10 dark:divide-white/5">
                      {Object.entries(selectedPermission.fieldSchema).map(
                        ([field, label]) => (
                          <div
                            key={field}
                            className="flex items-center justify-between gap-3 px-3 py-2"
                          >
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              {label}
                            </span>
                            <span
                              className="font-mono text-[10px] font-bold sa-accent-text"
                              dir="ltr"
                            >
                              {field}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    copy.noFields
                  ),
                  fullWidth: true,
                },
              ]
            : []
        }
      />
    </div>
  );
}
