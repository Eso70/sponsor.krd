"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { LinktreeListItem } from "@linktree/types";

import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal";
import { LinktreeSearchModal } from "@/components/shared/LinktreeSearchModal";
import { PlatformLinktreeAnalyticsSkeleton, PlatformLinktreeEditorSkeleton } from "@/features/platform-admin/components/PlatformLinktreesModalSkeletons";
import type {
  EditLinkData,
  LinktreeEditorSubmitData,
} from "@/features/link-editor/editor-types";
import { LinktreesManagementPage } from "@/features/link-editor/components/LinktreesManagementPage";
import { ThemeProvider } from "@/lib/contexts/ThemeProvider";
import { apiRequest } from "@/lib/api/request";
import { buildPlatformLinktreePayload } from "@/features/platform-admin/api/platform-linktrees";
import { usePlatformLocale } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { platformLinktreesCopy } from "@/features/platform-admin/i18n/linktrees-copy";
import { sharedArabicLinktreeCopy } from "@/features/link-editor/shared-arabic-copy";
import { arabicEditorCopy, englishEditorCopy } from "@/features/link-editor/editor-copy";
import { englishBusinessMessages } from "@/features/shared/i18n/english-messages";

const LinktreeEditorModal = dynamic(
  () =>
    import("@/features/link-editor/components/ReusableLinktreeEditorModal").then(
      (module) => ({ default: module.ReusableLinktreeEditorModal }),
    ),
  {
    ssr: false,
    loading: () => <PlatformLinktreeEditorSkeleton />,
  },
);
const DuplicateLinktreeModal = dynamic(
  () =>
    import("@/features/link-editor/components/ReusableDuplicateLinktreeModal").then(
      (module) => ({ default: module.ReusableDuplicateLinktreeModal }),
    ),
  { ssr: false },
);
const AnalyticsModal = dynamic(
  () =>
    import("@/features/analytics/components/PageAnalyticsModal").then(
      (module) => ({ default: module.PageAnalyticsModal }),
    ),
  {
    ssr: false,
    loading: () => <PlatformLinktreeAnalyticsSkeleton />,
  },
);

interface AnalyticsTotals {
  total_views: number;
  unique_views: number;
  total_clicks: number;
  unique_clicks: number;
  conversions: number;
  conversion_value: number;
}

type PlatformLinktreeContext = {
  branding: {
    name: string;
    logo: string | null;
    avatar: string | null;
    favicon: string | null;
    accentColor: string;
  };
  defaults?: {
    default_footer_text?: string | null;
    default_footer_phone?: string | null;
    default_template?: string | null;
    default_background_color?: string | null;
    default_footer_hidden?: boolean;
    default_whatsapp_enabled?: boolean;
    default_avatar?: string | null;
  };
  publicPathPrefix: string;
};

const EMPTY_TOTALS: AnalyticsTotals = {
  total_views: 0,
  unique_views: 0,
  total_clicks: 0,
  unique_clicks: 0,
  conversions: 0,
  conversion_value: 0,
};

export function PlatformLinktreesPage() {
  const { locale } = usePlatformLocale();
  const copy = platformLinktreesCopy[locale];
  const copyRef = useRef(copy);
  useEffect(() => { copyRef.current = copy; }, [copy]);
  const arabic = locale === "ar";
  const english = locale === "en";
  const apiBase = "/api/platform/linktrees";
  const [context, setContext] = useState<PlatformLinktreeContext | null>(null);
  const [items, setItems] = useState<LinktreeListItem[]>([]);
  const [totals, setTotals] = useState<AnalyticsTotals>(EMPTY_TOTALS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [view, setView] = useState<"grid" | "table">("grid");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editData, setEditData] = useState<EditLinkData | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [duplicateTarget, setDuplicateTarget] =
    useState<LinktreeListItem | null>(null);
  const [analyticsPageId, setAnalyticsPageId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<LinktreeListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [clearAllAnalyticsOpen, setClearAllAnalyticsOpen] = useState(false);
  const [clearingAllAnalytics, setClearingAllAnalytics] = useState(false);

  const apiEndpoints = useMemo(
    () => ({
      upload: `${apiBase}/upload`,
      checkSlug: `${apiBase}/check-slug`,
      checkName: `${apiBase}/check-name`,
    }),
    [apiBase],
  );

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      try {
        const contextUrl = `${apiBase}/context`;
        const [nextContext, nextItems, nextTotals] = await Promise.all([
          apiRequest<PlatformLinktreeContext>(contextUrl),
          apiRequest<LinktreeListItem[]>(apiBase),
          apiRequest<AnalyticsTotals>(`${apiBase}/analytics/summary`),
        ]);
        setContext(nextContext);
        setItems(nextItems);
        setTotals(
          nextTotals ??
            nextItems.reduce<AnalyticsTotals>(
              (sum, item) => ({
                ...sum,
                total_views:
                  sum.total_views + (item.analytics?.unique_views ?? 0),
                unique_views:
                  sum.unique_views + (item.analytics?.unique_views ?? 0),
                total_clicks:
                  sum.total_clicks + (item.analytics?.total_clicks ?? 0),
                unique_clicks:
                  sum.unique_clicks + (item.analytics?.unique_clicks ?? 0),
              }),
              { ...EMPTY_TOTALS },
            ),
        );
      } catch (error) {
        console.error("Platform Linktrees load failed:", error);
        toast.error(copyRef.current.loadFailed);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [apiBase],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  useEffect(() => {
    // Match the business dashboard: warm the shared editor bundle before the
    // first click. Its loading fallback still uses the same body portal when a
    // slower device opens it before preloading finishes.
    import(
      "@/features/link-editor/components/ReusableLinktreeEditorModal"
    ).catch(() => {
      // Preloading is an optional optimization; the dynamic import retries.
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        (event.key.toLowerCase() === "k" || event.code === "KeyK")
      ) {
        event.preventDefault();
        event.stopPropagation();
        setIsSearchModalOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, []);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(value) ||
        item.uid.toLowerCase().includes(value) ||
        item.seo_name?.toLowerCase().includes(value),
    );
  }, [items, query]);
  const analyticsPage =
    items.find((item) => item.id === analyticsPageId) ?? null;
  const hasAnalyticsData =
    totals.total_views > 0 || totals.total_clicks > 0 || totals.conversions > 0;

  const openEdit = useCallback(
    async (id: string) => {
      setEditorOpen(true);
      setLoadingEdit(true);
      setEditData(null);
      try {
        setEditData(await apiRequest<EditLinkData>(`${apiBase}/${id}/edit`));
      } catch (error) {
        setEditorOpen(false);
        console.error("Platform Linktree edit load failed:", error);
        toast.error(copyRef.current.editLoadFailed);
      } finally {
        setLoadingEdit(false);
      }
    },
    [apiBase],
  );

  const save = useCallback(
    async (data: LinktreeEditorSubmitData, editId?: string) => {
      try {
        await apiRequest(editId ? `${apiBase}/${editId}` : apiBase, {
          method: editId ? "PATCH" : "POST",
          json: buildPlatformLinktreePayload(data),
        });
        setEditorOpen(false);
        setEditData(null);
        toast.success(editId ? copyRef.current.updated : copyRef.current.created);
        await load(true);
      } catch (error) {
        console.error("Platform Linktree save failed:", error);
        toast.error(copyRef.current.saveFailed);
        throw error;
      }
    },
    [apiBase, load],
  );

  const updateBoolean = useCallback(
    async (
      id: string,
      field: "is_campaign_active" | "is_archived",
      value: boolean,
      endpoint: "campaign-status" | "archive",
    ) => {
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, [field]: value } : item,
        ),
      );
      try {
        await apiRequest(`${apiBase}/${id}/${endpoint}`, {
          method: "PATCH",
          json: { [field]: value },
        });
        toast.success(
          field === "is_archived"
            ? value
              ? copyRef.current.archived
              : copyRef.current.restored
            : value
              ? copyRef.current.campaignEnabled
              : copyRef.current.campaignDisabled,
        );
      } catch (error) {
        await load(true);
        console.error("Platform Linktree state update failed:", error);
        toast.error(copyRef.current.statusFailed);
      }
    },
    [apiBase, load],
  );

  const handleToggleStatus = useCallback(
    async (id: string, status: "active" | "inactive") => {
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, status } : item)),
      );
      try {
        await apiRequest(`${apiBase}/${id}/status`, {
          method: "PATCH",
          json: { status },
        });
        toast.success(status === "active" ? copyRef.current.statusEnabled : copyRef.current.statusDisabled);
      } catch (error) {
        await load(true);
        console.error("Platform Linktree status update failed:", error);
        toast.error(copyRef.current.statusFailed);
      }
    },
    [apiBase, load],
  );

  const clearAllAnalytics = useCallback(async () => {
    if (clearingAllAnalytics || !hasAnalyticsData) return;
    setClearingAllAnalytics(true);
    try {
      await apiRequest(`${apiBase}/analytics`, { method: "DELETE" });
      await load(true);
      setClearAllAnalyticsOpen(false);
      toast.success(copyRef.current.clearSuccess);
    } catch (error) {
      console.error("Platform Linktree analytics clear failed:", error);
      toast.error(copyRef.current.clearFailed);
      throw error;
    } finally {
      setClearingAllAnalytics(false);
    }
  }, [apiBase, clearingAllAnalytics, hasAnalyticsData, load]);

  return (
    <ThemeProvider websiteColor={context?.branding.accentColor || null}>
      <LinktreesManagementPage
        linktrees={filtered}
        linktreeCount={items.length}
        isLoading={loading}
        totalViews={totals.total_views}
        uniqueViews={totals.unique_views}
        totalClicks={totals.total_clicks}
        conversions={totals.conversions}
        isRefreshing={refreshing}
        isClearingAnalytics={clearingAllAnalytics}
        hasAnalyticsData={hasAnalyticsData}
        searchQuery={query}
        isSearchModalOpen={isSearchModalOpen}
        viewMode={view}
        onClearAnalytics={() => setClearAllAnalyticsOpen(true)}
        onRefresh={load}
        onSearchAction={() =>
          query.trim() ? setQuery("") : setIsSearchModalOpen(true)
        }
        onViewModeChange={setView}
        onCreate={() => {
          setEditData(null);
          setEditorOpen(true);
        }}
        onEdit={(id) => void openEdit(id)}
        onDuplicate={setDuplicateTarget}
        onDelete={(id) =>
          setDeleting(items.find((item) => item.id === id) ?? null)
        }
        onViewAnalytics={(id) => setAnalyticsPageId(id)}
        onToggleCampaign={(id, value) =>
          updateBoolean(id, "is_campaign_active", value, "campaign-status")
        }
        onToggleArchive={(id, value) =>
          updateBoolean(id, "is_archived", value, "archive")
        }
        onToggleStatus={handleToggleStatus}
        accentMode="platform"
        copy={arabic ? sharedArabicLinktreeCopy.management : english ? englishBusinessMessages.Linktrees : undefined}
        listCopy={arabic ? { ...sharedArabicLinktreeCopy.list, defaultPageHint: "الصفحة الافتراضية للمنصة" } : english ? { ...englishBusinessMessages.LinktreeList, defaultPageHint: "Default platform page" } : undefined}
        trafficLabels={arabic ? { column: sharedArabicLinktreeCopy.list.traffic, views: sharedArabicLinktreeCopy.list.views, interactions: sharedArabicLinktreeCopy.list.interactions } : english ? { column: englishBusinessMessages.LinktreeList.traffic, views: englishBusinessMessages.LinktreeList.views, interactions: englishBusinessMessages.LinktreeList.interactions } : undefined}
        profitCopy={arabic ? sharedArabicLinktreeCopy.campaignProfit : english ? englishBusinessMessages.CampaignProfit : undefined}
        calendarLocale={locale}
        description={copy.description}
        publicPathPrefix={context?.publicPathPrefix || "/linktree"}
        emptyTitle={
          query.trim()
            ? copy.searchEmpty
            : copy.empty
        }
        emptyDescription={
          query.trim()
            ? copy.searchEmptyDescription
            : copy.emptyDescription
        }
      />

      {editorOpen ? (
        <LinktreeEditorModal
          isOpen
          onClose={() => {
            setEditorOpen(false);
            setEditData(null);
          }}
          onSubmit={save}
          editData={editData}
          isLoadingEditData={loadingEdit}
          businessDefaults={{
            ...context?.defaults,
            default_avatar:
              context?.defaults?.default_avatar ||
              context?.branding.avatar ||
              null,
          }}
          businessIdentity={{ name: context?.branding.name || "Sponsor.krd" }}
          apiEndpoints={apiEndpoints}
          platformTheme
          copy={arabic ? arabicEditorCopy : english ? englishEditorCopy : undefined}
          colorCopy={english ? englishBusinessMessages.SettingsColorPicker : undefined}
        />
      ) : null}

      {analyticsPage ? (
        <AnalyticsModal
          isOpen
          onClose={() => setAnalyticsPageId(null)}
          pageId={analyticsPage.id}
          pageName={analyticsPage.name}
          pageKind="linktree"
          canClearAnalytics
          summaryOnly={false}
          dataSource="platform-linktree"
          onAnalyticsCleared={load}
          platformTheme
          copy={arabic ? sharedArabicLinktreeCopy.analytics : english ? englishBusinessMessages.PageAnalytics : undefined}
        />
      ) : null}

      <ConfirmDeleteModal
        isOpen={clearAllAnalyticsOpen}
        onClose={() => {
          if (!clearingAllAnalytics) setClearAllAnalyticsOpen(false);
        }}
        onConfirm={clearAllAnalytics}
        title={copy.clearTitle}
        confirmLabel={copy.clearConfirm}
        loadingLabel={copy.clearing}
        cancelLabel={copy.cancel}
        closeLabel={copy.close}
        isDeleting={clearingAllAnalytics}
        message={
          <p>{copy.clearQuestion}</p>
        }
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        isDeleting={isDeleting}
        title={copy.deleteTitle}
        confirmLabel={copy.confirmDelete}
        loadingLabel={copy.deleting}
        cancelLabel={copy.cancel}
        closeLabel={copy.close}
        message={`${copy.deleteQuestion} «${deleting?.name || copy.thisPage}»؟ ${copy.deleteConsequence}`}
        onConfirm={async () => {
          if (!deleting) return;
          setIsDeleting(true);
          try {
            await apiRequest(`${apiBase}/${deleting.id}`, { method: "DELETE" });
            setDeleting(null);
            toast.success(copyRef.current.deleteSuccess);
            await load(true);
          } catch (error) {
            console.error("Platform Linktree deletion failed:", error);
            toast.error(copyRef.current.deleteFailed);
            throw error;
          } finally {
            setIsDeleting(false);
          }
        }}
      />

      <LinktreeSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        searchQuery={query}
        onSearchQueryChange={setQuery}
        items={items}
        onSelect={(item) => {
          setIsSearchModalOpen(false);
          void openEdit(item.id);
        }}
        publicPathPrefix={context?.publicPathPrefix || "/linktree"}
        platformTheme
        copy={arabic ? { ...sharedArabicLinktreeCopy.search, prompt: "ابحث عن صفحات المنصة" } : english ? { ...englishBusinessMessages.LinktreeSearch, prompt: "Search platform pages" } : undefined}
      />

      {duplicateTarget ? (
        <DuplicateLinktreeModal
          isOpen
          onClose={() => setDuplicateTarget(null)}
          targetLinktree={duplicateTarget}
          apiBase={apiBase}
          onSuccess={() => void load(true)}
          platformTheme
          copy={arabic ? sharedArabicLinktreeCopy.duplicate : english ? englishBusinessMessages.DuplicateLinktree : undefined}
        />
      ) : null}
    </ThemeProvider>
  );
}
