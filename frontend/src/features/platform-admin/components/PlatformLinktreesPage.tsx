"use client";
import { clearSelectedAnalytics } from "@/features/shared/clear-selected-analytics";

import { useRegisterDashboardRefresh } from "@/components/shared/dashboard-refresh";
import dynamic from "next/dynamic";
import { DrawerPresence } from "@/components/shared/DrawerPresence";
import { LinktreeEditorDrawer } from "@/features/link-editor/components/LinktreeEditorDrawer";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { LinktreeListItem } from "@linktree/types";

import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal";
import { LinktreeSearchModal } from "@/components/shared/LinktreeSearchModal";
import { PlatformLinktreeAnalyticsSkeleton } from "@/features/platform-admin/components/PlatformLinktreesModalSkeletons";
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

const AnalyticsDrawer = dynamic(
  () =>
    import("@/features/analytics/components/PageAnalyticsDrawer").then(
      (module) => ({ default: module.PageAnalyticsDrawer }),
    ),
  {
    ssr: false,
    loading: () => <PlatformLinktreeAnalyticsSkeleton />,
  },
);

import { readAnalyticsTotals, EMPTY_ANALYTICS_TOTALS, type AnalyticsTotals } from "@/features/analytics/analytics-totals";

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
    default_background_pattern?: string | null;
    default_footer_hidden?: boolean;
    default_whatsapp_enabled?: boolean;
    default_avatar?: string | null;
  };
  publicPathPrefix: string;
};

export function PlatformLinktreesPage({ headerControls }: { headerControls?: ReactNode }) {
  const { locale } = usePlatformLocale();
  const copy = platformLinktreesCopy[locale];
  const copyRef = useRef(copy);
  useEffect(() => { copyRef.current = copy; }, [copy]);
  const arabic = locale === "ar";
  const english = locale === "en";
  const apiBase = "/api/platform/linktrees";
  const [context, setContext] = useState<PlatformLinktreeContext | null>(null);
  const [items, setItems] = useState<LinktreeListItem[]>([]);
  const [totals, setTotals] = useState<AnalyticsTotals>(EMPTY_ANALYTICS_TOTALS);
  const [pagesUnavailable, setPagesUnavailable] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsUnavailable, setAnalyticsUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [view, setView] = useState<"grid" | "table">("grid");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editData, setEditData] = useState<EditLinkData | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [analyticsPageId, setAnalyticsPageId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<LinktreeListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [clearingSelectedAnalytics, setClearingSelectedAnalytics] = useState(false);

  const apiEndpoints = useMemo(
    () => ({
      upload: `${apiBase}/upload`,
      checkSlug: `${apiBase}/check-slug`,
      checkName: `${apiBase}/check-name`,
    }),
    [apiBase],
  );

  const loadRequest = useRef(0);
  const invalidateLoad = useCallback(() => { loadRequest.current++; }, []);
  const load = useCallback(
    async (refresh = false, rethrow = false) => {
      let refreshFailed = false;
      const request = ++loadRequest.current;
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setAnalyticsLoading(true);
      const summaryRequest = apiRequest<unknown>(`${apiBase}/analytics/summary`)
        .then((data) => { if (request !== loadRequest.current) return; setTotals(readAnalyticsTotals(data)); setAnalyticsUnavailable(false); })
        .catch((error: unknown) => { if (request !== loadRequest.current) return; refreshFailed = true; console.error("Platform Linktree summary failed:", error); setAnalyticsUnavailable(true); })
        .finally(() => { if (request === loadRequest.current) setAnalyticsLoading(false); });
      try {
        const [nextContext, nextItems] = await Promise.all([
          apiRequest<PlatformLinktreeContext>(`${apiBase}/context`),
          apiRequest<LinktreeListItem[]>(apiBase),
        ]);
        if (request !== loadRequest.current) return;
        setContext(nextContext);
        setItems(nextItems);
        setPagesUnavailable(false);
      } catch (error) {
        if (request !== loadRequest.current) return;
        refreshFailed = true;
        console.error("Platform Linktrees load failed:", error);
        setPagesUnavailable(true);
        toast.error(copyRef.current.loadFailed);
      } finally {
        if (request === loadRequest.current) setLoading(false);
        await summaryRequest;
        if (request === loadRequest.current) setRefreshing(false);
      }
      if (rethrow && refreshFailed) throw new Error("Could not refresh Linktrees");
    },
    [apiBase],
  );

  useRegisterDashboardRefresh("linktrees", () => load(true, true));

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => { window.clearTimeout(timeout); invalidateLoad(); };
  }, [load, invalidateLoad]);


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


  const editRequest = useRef<AbortController | null>(null);
  useEffect(() => () => editRequest.current?.abort(), []);
  const closeEditor = () => {
    editRequest.current?.abort();
    setEditorOpen(false);
    setLoadingEdit(false);
    setEditData(null);
  };
  const openEdit = useCallback(
    async (id: string) => {
      editRequest.current?.abort();
      const controller = new AbortController();
      editRequest.current = controller;
      setEditorOpen(true);
      setLoadingEdit(true);
      setEditData(null);
      try {
        const data = await apiRequest<EditLinkData>(`${apiBase}/${id}/edit`, { signal: controller.signal });
        if (!controller.signal.aborted) setEditData(data);
      } catch (error) {
        if (controller.signal.aborted) return;
        setEditorOpen(false);
        console.error("Platform Linktree edit load failed:", error);
        toast.error(copyRef.current.editLoadFailed);
      } finally {
        if (!controller.signal.aborted) setLoadingEdit(false);
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

  const handleToggleArchive = useCallback(
    async (
      id: string,
      value: boolean,
    ) => {
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, is_archived: value } : item,
        ),
      );
      try {
        await apiRequest(`${apiBase}/${id}/archive`, {
          method: "PATCH",
          json: { is_archived: value },
        });
        toast.success(
          value ? copyRef.current.archived : copyRef.current.restored,
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

  const clearSelected = useCallback(async (ids: readonly string[]) => {
    if (clearingSelectedAnalytics || !ids.length) return;
    setClearingSelectedAnalytics(true);
    try { await clearSelectedAnalytics(apiBase, ids); }
    finally {
      try { await load(true, true); }
      finally { setClearingSelectedAnalytics(false); }
    }
  }, [apiBase, clearingSelectedAnalytics, load]);

  const editingLinktree = editData ? items.find(item => item.id === editData.linktree.id) : undefined;
  return (
    <ThemeProvider websiteColor={context?.branding.accentColor || null}>
      <LinktreesManagementPage
        headerControls={headerControls}
        linktrees={filtered}
        linktreeCount={items.length}
        isLoading={loading}
        totalViews={totals.total_views}
        uniqueViews={totals.unique_views}
        totalClicks={totals.total_clicks}
        uniqueClicks={totals.unique_clicks}
        contactActions={totals.contact_actions}
        analyticsLoading={analyticsLoading}
        analyticsUnavailable={analyticsUnavailable}
        pagesUnavailable={pagesUnavailable}
        locale={locale}
        isRefreshing={refreshing}
        isClearingAnalytics={clearingSelectedAnalytics}
        searchQuery={query}
        isSearchModalOpen={isSearchModalOpen}
        viewMode={view}
        onClearAnalytics={clearSelected}
        onRefresh={load}
        onSearchAction={() =>
          query.trim() ? setQuery("") : setIsSearchModalOpen(true)
        }
        onViewModeChange={setView}
        onCreate={() => {
          editRequest.current?.abort();
          setLoadingEdit(false);
          setEditData(null);
          setEditorOpen(true);
        }}
        onEdit={(id) => void openEdit(id)}
        
        onDelete={(id) =>
          setDeleting(items.find((item) => item.id === id) ?? null)
        }
        onViewAnalytics={(id) => setAnalyticsPageId(id)}
        pinApiBase={apiBase}
        onPinnedChange={(id, pinned) => setItems((current) => current.map((item) => item.id === id ? { ...item, is_pinned: pinned } : item))}
        onToggleArchive={handleToggleArchive}
        
        accentMode="platform"
        copy={arabic ? sharedArabicLinktreeCopy.management : english ? englishBusinessMessages.Linktrees : undefined}
        listCopy={arabic ? { ...sharedArabicLinktreeCopy.list, defaultPageHint: "الصفحة الافتراضية للمنصة" } : english ? { ...englishBusinessMessages.LinktreeList, defaultPageHint: "Default platform page" } : undefined}
        trafficLabels={arabic ? { column: sharedArabicLinktreeCopy.list.traffic, views: sharedArabicLinktreeCopy.list.views, interactions: sharedArabicLinktreeCopy.list.interactions } : english ? { column: englishBusinessMessages.LinktreeList.traffic, views: englishBusinessMessages.LinktreeList.views, interactions: englishBusinessMessages.LinktreeList.interactions } : undefined}
        
        
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

      <DrawerPresence>{editorOpen ? (
        <LinktreeEditorDrawer
          locale={locale}
          isOpen
          onClose={closeEditor}
          headerControls={headerControls}
          onSubmit={save}
          editData={editData}
          management={editingLinktree ? { item: editingLinktree, onToggleStatus: handleToggleStatus, onToggleArchive: handleToggleArchive, onDuplicated: () => { void load(true); } } : undefined}
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
      ) : null}</DrawerPresence>

      <DrawerPresence>{analyticsPage ? (
        <AnalyticsDrawer
            headerControls={headerControls}
          isOpen
          onClose={() => setAnalyticsPageId(null)}
          pageId={analyticsPage.id}
          pageName={analyticsPage.name}
            locale={locale}
          pageKind="linktree"
          canClearAnalytics
          summaryOnly={false}
          dataSource="platform-linktree"
          onAnalyticsCleared={load}
          platformTheme
          copy={arabic ? sharedArabicLinktreeCopy.analytics : english ? englishBusinessMessages.PageAnalytics : undefined}
        />
      ) : null}</DrawerPresence>

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

    </ThemeProvider>
  );
}
