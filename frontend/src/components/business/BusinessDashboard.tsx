"use client";
import { clearSelectedAnalytics } from "@/features/shared/clear-selected-analytics";

import {
  memo,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal";
import {
  LayoutTemplate,
  FileText,
  ClipboardList,
  LogOut,
  User,
  Settings,
} from "lucide-react";
import { TbBrandTiktok } from "react-icons/tb";
import dynamic from "next/dynamic";
import { DrawerPresence } from "@/components/shared/DrawerPresence";
import { LinktreeEditorDrawer } from "@/features/link-editor/components/LinktreeEditorDrawer";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  normalizeTemplateConfig,
  type TemplateKey,
} from "@/lib/templates/config";
import { toast } from "sonner";
import { ThemeProvider } from "@/lib/contexts/ThemeProvider";
import { SPONSOR_KRD_LOGO } from "@/lib/brand/brand-assets";
import { useLinktrees } from "@/features/business/hooks/useLinktrees";
import type {
  BusinessLinktreeSummary as Linktree,
} from "@linktree/types";
import { BusinessLinktreesPage } from "@/features/business/components/BusinessLinktreesPage";
import { BusinessFormsPage } from "@/features/business/components/BusinessFormsPage";
import { LinktreeSearchModal } from "@/components/shared/LinktreeSearchModal";
import type { EffectiveAccessManifest } from "@linktree/types";
import { BusinessCommunicationBell } from "@/features/communications/BusinessCommunicationBell";
import { BusinessAnnouncementBanners } from "@/features/communications/BusinessAnnouncementBanners";
import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { DashboardAppearanceControls } from "@/components/shared/DashboardAppearanceControls";
import { useTranslations } from "next-intl";
import { BusinessLanguageSelector } from "@/features/business/components/BusinessLanguageSelector";
import { useBusinessLocale } from "@/features/business/i18n/BusinessLocaleProvider";
import { BusinessSubscriptionModal } from "@/features/billing/components/BusinessSubscriptionModal";
import { businessMessages } from "@/features/business/i18n/messages";
import {
  arabicEditorCopy,
  englishEditorCopy,
} from "@/features/link-editor/editor-copy";
import {
  DashboardSidebar,
  type DashboardSidebarItem,
} from "@/components/shared/DashboardSidebar";
import {
  isBusinessPageLocked,
  isBusinessPageVisible,
  type BusinessDashboardPage,
} from "@/lib/business-page-access";
import { LockedContent } from "@/components/shared/LockedContent";
import { usePolling } from "@/lib/utils/usePolling";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useBusinessAnalyticsTotals } from "@/features/business/hooks/useBusinessAnalyticsTotals";
import {
  getBusinessDashboardState,
  logoutBusiness,
} from "@/features/business/api";
import { apiRequest, isApiRequestError } from "@/lib/api/request";
import { ErrorPage } from "@/components/error-pages/ErrorPage";
import { businessErrorTheme } from "@/components/error-pages/error-theme";
import { businessErrorPageCopy } from "@/features/business/i18n/error-copy";
import { DEFAULT_BUSINESS_ACCENT } from "@/lib/utils/business-error-theme";
import { parseWebsiteColor } from "@/lib/utils/parse-website-color";
import { applyTabIcon } from "@/lib/brand/tab-branding";
import { businessTabTitle } from "@/lib/utils/tab-title";
import { SkeletonDashboardPage } from "@/components/shared/Skeleton";
import { BusinessLoadingSkeleton } from "@/features/business/components/BusinessLoadingSkeleton";
import {
  DashboardRefreshProvider,
  useDashboardRefreshController,
} from "@/components/shared/dashboard-refresh";
import { BusinessSidebarFooter } from "@/features/business/components/BusinessSidebarFooter";

// Dynamically import heavy components with preloading only when needed
// The shared drawer shell stays available; individual previews load lazily.

const BusinessSettingsPage = dynamic(
  () =>
    import("@/components/business/BusinessSettingsPage").then((mod) => ({
      default: mod.BusinessSettingsPage,
    })),
  {
    ssr: false,
    loading: () => <BusinessLoadingSkeleton kind="settings" />,
  },
);

const TemplatesPage = dynamic(
  () =>
    import("@/features/templates/components/TemplatesPage").then((mod) => ({
      default: mod.TemplatesPage,
    })),
  { ssr: false, loading: () => <BusinessLoadingSkeleton kind="templates" /> },
);

const PageAnalyticsDrawer = dynamic(
  () =>
    import("@/features/analytics/components/PageAnalyticsDrawer").then(
      (mod) => ({ default: mod.PageAnalyticsDrawer }),
    ),
  {
    ssr: false,
    loading: () => <BusinessLoadingSkeleton kind="pageAnalytics" />,
  },
);

const BusinessTikTokConfigPage = dynamic(
  () =>
    import("@/features/analytics/components/BusinessTikTokConfigPage").then(
      (mod) => ({
        default: mod.BusinessTikTokConfigPage,
      }),
    ),
  {
    ssr: false,
    loading: () => <BusinessLoadingSkeleton kind="tiktok" />,
  },
);



const BusinessGettingStarted = dynamic(
  () =>
    import("@/features/onboarding/components/BusinessGettingStarted").then(
      (mod) => ({ default: mod.BusinessGettingStarted }),
    ),
  { ssr: false },
);

interface BusinessDashboardProps {
  initialLinktrees?: Linktree[];
  currentUsername?: string;
  businessName?: string;
  businessPhone?: string | null;
  businessLogo?: string | null;
  businessFavicon?: string | null;
  businessDefaults?: {
    default_footer_text?: string | null;
    default_footer_phone?: string | null;
    default_template?: string | null;
    default_background_color?: string | null;
    default_background_pattern?: string | null;
    default_footer_hidden?: boolean;
    default_whatsapp_enabled?: boolean;
    default_avatar?: string | null;
  } | null;
  websiteColor?: string | null;
  effectiveAccess?: EffectiveAccessManifest | null;
  onboardingRequired?: boolean;
  onboardingStep?: number;
}

function getBusinessPage(pathname: string): BusinessDashboardPage {
  const segment = pathname.split("/").filter(Boolean)[1];
  if (!segment) return "linktrees";
  if (segment === "pages") return "linktrees";
  return segment === "tiktok-config" ||
    segment === "forms" ||
    segment === "templates" ||
    segment === "profile" ||
    segment === "settings"
    ? segment
    : "linktrees";
}

function LockedBusinessContent({
  locked,
  title,
  reason,
  children,
}: {
  locked: boolean;
  title: string;
  reason: string;
  children: ReactNode;
}) {
  return (
    <LockedContent
      locked={locked}
      title={title}
      description={reason}
      className="min-h-0 flex-1"
    >
      {children}
    </LockedContent>
  );
}

export const BusinessDashboard = memo(function BusinessDashboard({
  initialLinktrees = [],
  currentUsername = "",
  businessName,
  businessPhone,
  businessLogo,
  businessFavicon,
  businessDefaults,
  websiteColor,
  effectiveAccess,
  onboardingRequired = false,
  onboardingStep = 1,
}: BusinessDashboardProps) {
  const router = useRouter();
  const t = useTranslations("Dashboard");
  const headerT = useTranslations("Header");
  const sidebarT = useTranslations("Sidebar");
  const actionT = useTranslations("DashboardActions");
  const searchT = useTranslations("LinktreeSearch");
  const { locale } = useBusinessLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // All hooks must be called before any conditional returns
  const {
    linktrees: linktreesData,
    unavailable: pagesUnavailable,
    isLoading,
    reload: fetchLinktrees,
    removeLinktree,
    mergeLinktree,
    prependLinktree,
  } = useLinktrees(initialLinktrees);
  const createDefaultFromUrl = searchParams.get("create") === "default";
  const [isDrawerOpen, setIsDrawerOpen] = useState(createDefaultFromUrl);
  const [isLoadingEditData, setIsLoadingEditData] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [linktreeToDelete, setLinktreeToDelete] = useState<{
    id: string;
    uid: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid"); // Default to grid view
  const { theme, toggleTheme } = useAppTheme();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const activeTab = getBusinessPage(pathname);
  const sidebarItems = useMemo<DashboardSidebarItem[]>(
    () => [
      {
        id: "linktrees",
        label: t("linktrees"),
        icon: <FileText className="h-4 w-4" />,
        active: activeTab === "linktrees",
        onClick: () => router.push("/business/pages"),
      },
      {
        id: "forms",
        label: t("forms"),
        icon: <ClipboardList className="h-4 w-4" />,
        active: activeTab === "forms",
        onClick: () => router.push("/business/forms"),
      },
      {
        id: "tiktok-config",
        label: t("tiktokSettings"),
        icon: <TbBrandTiktok className="h-4 w-4" />,
        active: activeTab === "tiktok-config",
        onClick: () => router.push("/business/tiktok-config"),
      },
      {
        id: "templates",
        label: t("templates"),
        icon: <LayoutTemplate className="h-4 w-4" />,
        active: activeTab === "templates",
        onClick: () => router.push("/business/templates"),
      },
      
      {
        id: "settings",
        label: t("settings"),
        icon: <Settings className="h-4 w-4" />,
        active: activeTab === "settings",
        onClick: () => router.push("/business/settings"),
      },
    ],
    [activeTab, router, t],
  );
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [accessForbidden, setAccessForbidden] = useState(false);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [badGateway, setBadGateway] = useState(false);
  const [gatewayTimeout, setGatewayTimeout] = useState(false);
  const [isClearingAnalytics, setIsClearingAnalytics] = useState(false);
  const [analyticsModalLinktree, setAnalyticsModalLinktree] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isCreatingDefault, setIsCreatingDefault] =
    useState(createDefaultFromUrl);

  const [name, setName] = useState(businessName);
  const [phone, setPhone] = useState(businessPhone || "");
  const [email, setEmail] = useState("");
  const [logo, setLogo] = useState(businessLogo);
  const [favicon, setFavicon] = useState(businessFavicon);
  const [defaults, setDefaults] = useState(businessDefaults);
  const [wColor, setWColor] = useState(websiteColor);
  const [refreshedEffectiveAccess, setRefreshedEffectiveAccess] =
    useState<EffectiveAccessManifest | null>(null);
  const liveEffectiveAccess =
    refreshedEffectiveAccess ?? effectiveAccess ?? null;
  const linktreePinPermission = liveEffectiveAccess?.permissions["business:linktrees:update"];
  const canPinLinktrees = linktreePinPermission?.outcome === "allow" &&
    (linktreePinPermission.fieldModes.isPinned ?? linktreePinPermission.accessMode) === "direct";
  const pageLocked = isBusinessPageLocked(activeTab, liveEffectiveAccess);
  const pageLockReason = actionT("upgradeRequired");
  useEffect(() => {
    if (
      liveEffectiveAccess &&
      activeTab !== "linktrees" &&
      !isBusinessPageVisible(activeTab, liveEffectiveAccess)
    ) {
      router.replace("/business/pages");
    }
  }, [activeTab, liveEffectiveAccess, router]);

  // Set browser tab title and favicon dynamically for this business
  useEffect(() => {
    const sectionTitles: Record<BusinessDashboardPage, string> = {
      linktrees: t("linktrees"),
      forms: t("forms"),
      "tiktok-config": t("tiktokSettings"),
      
      templates: t("templates"),
      profile: t("profile"),
      settings: t("settings"),
    };
    document.title = businessTabTitle(
      name || currentUsername || t("businessFallback"),
      sectionTitles[activeTab],
    );
    applyTabIcon(favicon, businessLogo);
  }, [name, favicon, businessLogo, currentUsername, activeTab, t]);

  // Last payloads seen, so an unchanged response costs nothing. Previously every
  // tick re-set state and dispatched events, re-rendering the whole dashboard
  // several times a second even when nothing had actually changed.
  const lastAccessRef = useRef<string>("");
  const lastProfileRef = useRef<string>("");

  const refreshDashboardState = useCallback(
    async (rethrow = false) => {
      try {
        const result = await getBusinessDashboardState();
        const serializedAccess = JSON.stringify(result.effectiveAccess);
        if (serializedAccess !== lastAccessRef.current) {
          lastAccessRef.current = serializedAccess;
          setRefreshedEffectiveAccess(result.effectiveAccess);
          window.dispatchEvent(
            new CustomEvent("sponsor-krd:access-updated", {
              detail: result.effectiveAccess,
            }),
          );
        }

        if (result.profile) {
          const serializedProfile = JSON.stringify(result.profile);
          if (serializedProfile !== lastProfileRef.current) {
            lastProfileRef.current = serializedProfile;
            window.dispatchEvent(
              new CustomEvent("sponsor-krd:business-settings-updated", {
                detail: result.profile,
              }),
            );
          }
        }
        setAccessForbidden(false);
        setBadGateway(false);
        setServiceUnavailable(false);
        setGatewayTimeout(false);
      } catch (error) {
        // Folded in from the separate session poll: a revoked or deleted session
        // shows up here, so it does not need a request of its own.
        if (isApiRequestError(error, 403)) {
          setAccessForbidden(true);
          setBadGateway(false);
          setServiceUnavailable(false);
          setGatewayTimeout(false);
          if (rethrow) throw error;
          return;
        }
        if (isApiRequestError(error, 502)) {
          setBadGateway(true);
          setServiceUnavailable(false);
          setGatewayTimeout(false);
          if (rethrow) throw error;
          return;
        }
        if (isApiRequestError(error, 504)) {
          setBadGateway(false);
          setServiceUnavailable(false);
          setGatewayTimeout(true);
          if (rethrow) throw error;
          return;
        }
        if (
          isApiRequestError(error) &&
          (error.status === 0 || error.status === 503)
        ) {
          setBadGateway(false);
          setGatewayTimeout(false);
          setServiceUnavailable(true);
          if (rethrow) throw error;
          return;
        }
        if (isApiRequestError(error) && [401, 404].includes(error.status)) {
          window.location.href = "/business/workspace-entry";
        }
        // Keep the last valid manifest during transient network failures.
        if (rethrow) throw error;
      }
    },
    [
      setAccessForbidden,
      setBadGateway,
      setGatewayTimeout,
      setRefreshedEffectiveAccess,
      setServiceUnavailable,
    ],
  );

  usePolling(refreshDashboardState, 15_000);

  useEffect(() => {
    const syncSettings = (event: Event) => {
      const detail = (event as CustomEvent<Record<string, unknown>>).detail;
      if (!detail) return;
      if (typeof detail.name === "string") setName(detail.name);
      if (typeof detail.phone === "string") setPhone(detail.phone);
      if (typeof detail.email === "string") setEmail(detail.email);
      if (typeof detail.logo === "string") setLogo(detail.logo);
      if (typeof detail.favicon === "string") setFavicon(detail.favicon);
      if (typeof detail.website_color === "string")
        setWColor(detail.website_color);
      setDefaults((current) => ({
        ...current,
        default_footer_text:
          typeof detail.default_footer_text === "string"
            ? detail.default_footer_text
            : current?.default_footer_text,
        default_footer_phone:
          typeof detail.default_footer_phone === "string"
            ? detail.default_footer_phone
            : current?.default_footer_phone,
        default_template:
          typeof detail.default_template === "string"
            ? detail.default_template
            : current?.default_template,
        default_background_pattern: typeof detail.default_background_pattern === "string" ? detail.default_background_pattern : current?.default_background_pattern,
        default_background_color:
          typeof detail.default_background_color === "string"
            ? detail.default_background_color
            : current?.default_background_color,
        default_footer_hidden:
          typeof detail.default_footer_hidden === "boolean"
            ? detail.default_footer_hidden
            : current?.default_footer_hidden,
        default_whatsapp_enabled:
          typeof detail.default_whatsapp_enabled === "boolean"
            ? detail.default_whatsapp_enabled
            : current?.default_whatsapp_enabled,
        default_avatar:
          typeof detail.default_avatar === "string"
            ? detail.default_avatar
            : current?.default_avatar,
      }));
    };
    window.addEventListener(
      "sponsor-krd:business-settings-updated",
      syncSettings,
    );
    return () =>
      window.removeEventListener(
        "sponsor-krd:business-settings-updated",
        syncSettings,
      );
  }, []);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);


  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    if (typeof window === "undefined") return;
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const handleLogout = useCallback(async () => {
    await logoutBusiness();
    window.location.href = "/business/workspace-entry";
  }, []);


  // Search keyboard shortcuts (Ctrl+K / Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isKKey = e.key === "k" || e.key === "K" || e.code === "KeyK";
      if ((e.ctrlKey || e.metaKey) && isKKey) {
        if (activeTab !== "linktrees") return;
        e.preventDefault();
        e.stopPropagation();
        setIsSearchModalOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsSearchModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [activeTab]);

  // Detect URL params: ?create=default or ?edit=<id>
  useEffect(() => {
    if (createDefaultFromUrl) {
      // Strip the param immediately so a later refresh doesn't reopen this modal.
      router.replace("/business/pages", { scroll: false });
    }
  }, [createDefaultFromUrl, router]);

  // Filtered linktrees for grid/table
  const filteredLinktrees = useMemo(() => {
    if (!searchQuery.trim()) return linktreesData;
    const q = searchQuery.toLowerCase().trim();
    return linktreesData.filter((item) => item.name.toLowerCase().includes(q));
  }, [linktreesData, searchQuery]);

  const {
    totals: analyticsTotals,
    isLoading: isAnalyticsLoading,
    isRefreshing: isAnalyticsRefreshing,
    unavailable: analyticsUnavailable,
    refresh: fetchAnalyticsTotals,
  } = useBusinessAnalyticsTotals("linktree", activeTab === "linktrees");
  const isSubmittingRef = useRef(false); // Prevent duplicate submissions
  const [editData, setEditData] = useState<{
    linktree: Linktree;
    links: Array<{
      id: string;
      platform: string;
      url: string;
      display_name?: string | null;
      description?: string | null;
      default_message?: string | null;
      display_order: number;
      metadata?: Record<string, unknown> | null;
    }>;
  } | null>(null);

  const handleRefresh = useCallback(
    async (rethrow = false) => {
      setIsRefreshing(true);
      try {
        const { flushNow } = await import("@/lib/utils/client-queue");
        await flushNow().catch(() => {});
        const results = await Promise.allSettled([
          fetchLinktrees(false, true, true),
          fetchAnalyticsTotals({ rethrow: true }),
        ]);
        const failure = results.find((result) => result.status === "rejected");
        if (failure?.status === "rejected") throw failure.reason;
      } catch (error) {
        if (rethrow) throw error;
        toast.error(actionT("pagesRefreshFailed"));
      } finally {
        setIsRefreshing(false);
      }
    },
    [fetchLinktrees, fetchAnalyticsTotals, setIsRefreshing, actionT],
  );

  const refreshSharedDashboardData = useCallback(
    () => refreshDashboardState(true),
    [refreshDashboardState],
  );
  const dashboardRefresh = useDashboardRefreshController(
    refreshSharedDashboardData,
  );
  const handleGlobalDashboardRefresh = useCallback(async () => {
    const result = await dashboardRefresh.refresh();
    if (result.failed > 0) {
      toast.error(actionT("refreshPartial"));
      return;
    }
    toast.success(actionT("refreshSuccess"));
  }, [dashboardRefresh, actionT]);

  const handleClearSelectedAnalytics = async (ids: readonly string[]) => {
    if (isClearingAnalytics || !ids.length) return;
    setIsClearingAnalytics(true);
    try {
      await clearSelectedAnalytics("/api/linktrees", ids);
    } finally {
      const { clearCachedData } = await import("@/lib/utils/cache");
      clearCachedData("/api/linktrees");
      try { await handleRefresh(true); }
      finally { setIsClearingAnalytics(false); }
    }
  };

  // Client-side authentication check - redirect if no username provided.
  // Ongoing session validity rides along with the dashboard-state poll above,
  // which already sees a revoked session on /api/auth/effective-access.
  useEffect(() => {
    if (!currentUsername || currentUsername.trim() === "") {
      window.location.href = "/business/workspace-entry";
    }
  }, [currentUsername]);


  const editRequest = useRef<AbortController | null>(null);
  useEffect(() => () => editRequest.current?.abort(), []);
  const handleEdit = useCallback(
    async (id: string) => {
      editRequest.current?.abort();
      const controller = new AbortController();
      editRequest.current = controller;
      // Keep the same drawer mounted while its data loads.
      setIsDrawerOpen(true);
      setIsLoadingEditData(true);
      setEditData(null); // Clear previous data

      try {
        // apiRequest owns envelope parsing, so a failure arrives as an
        // ApiRequestError carrying the server's message rather than a raw body.
        const data = await apiRequest<{
          linktree: Linktree;
          links: NonNullable<typeof editData>["links"];
        }>(`/api/linktrees/${id}/edit`, { signal: controller.signal });
        if (controller.signal.aborted) return;

        // Validate required fields
        if (!data?.linktree?.id) {
          throw new Error("Invalid response format: missing linktree data");
        }

        if (!Array.isArray(data.links)) {
          throw new Error("Invalid response format: links must be an array");
        }

        setEditData({ linktree: data.linktree, links: data.links });
      } catch (error) {
        if (controller.signal.aborted) return;
        // If unauthorized, suggest re-login and keep the modal open otherwise.
        if (isApiRequestError(error, 401)) {
          const shouldReload = window.confirm(actionT("sessionExpired"));
          if (shouldReload) {
            window.location.href = "/business/workspace-entry";
          }
          return;
        }

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to load linktree data";
        console.error(`Failed to load linktree data: ${errorMessage}`);

        setIsDrawerOpen(false); // Close modal on error
      } finally {
        if (!controller.signal.aborted) setIsLoadingEditData(false);
      }
    },
    [actionT],
  );

  const handleViewAnalytics = (id: string, name: string) => {
    setAnalyticsModalLinktree({ id, name });
  };

  const handleDelete = useCallback((id: string, uid: string, name: string) => {
    // Prevent deletion of default "id" linktree
    if (uid === "id") {
      console.error("ناتوانیت پەیج پێشگریمان بسڕیتەوە");
      return;
    }

    setLinktreeToDelete({ id, uid, name });
    setIsDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!linktreeToDelete || isDeleting) return;

    setIsDeleting(true);

    // Optimistic update - remove from UI immediately
    const deletedId = linktreeToDelete.id;
    removeLinktree(deletedId);

    // Close modal immediately for better UX
    setIsDeleteModalOpen(false);
    setLinktreeToDelete(null);

    try {
      const response = await fetch(`/api/linktrees/${deletedId}`, {
        method: "DELETE",
        credentials: "include", // Include cookies for authentication
        cache: "no-store",
      });

      if (!response.ok) {
        // Revert optimistic update on error
        await fetchLinktrees(false, true);
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to delete linktree";
        console.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Clear cache after successful deletion (batch clear)
      const { clearCachedData } = await import("@/lib/utils/cache");
      if (linktreeToDelete) {
        // Clear all related caches in one batch
        clearCachedData("/api/linktrees");
        clearCachedData(`/api/linktrees/${linktreeToDelete.id}`);
        clearCachedData(`/api/linktrees/${linktreeToDelete.id}/links`);
        clearCachedData(`/api/linktrees/${linktreeToDelete.id}/analytics`);
      }

      // Success - no need to fetch again, optimistic update already applied
      toast.success(actionT("deleteSuccess"));
    } catch (error) {
      console.error("Error deleting linktree:", error);
      toast.error(actionT("deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  }, [linktreeToDelete, isDeleting, fetchLinktrees, removeLinktree, actionT]);

  const handleDeleteModalClose = useCallback(() => {
    if (!isDeleting) {
      setIsDeleteModalOpen(false);
      setLinktreeToDelete(null);
    }
  }, [isDeleting]);

  const handleToggleArchive = useCallback(
    async (id: string, nextStatus: boolean) => {
      mergeLinktree(id, {
        is_archived: nextStatus,
        archived_at: nextStatus ? new Date().toISOString() : null,
      });

      try {
        const response = await fetch(`/api/linktrees/${id}/archive`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_archived: nextStatus }),
          credentials: "include",
        });

        if (!response.ok) {
          await fetchLinktrees(false, true);
          toast.error(actionT("archiveFailed"));
          return;
        }

        const { clearCachedData } = await import("@/lib/utils/cache");
        clearCachedData("/api/linktrees");
        clearCachedData(`/api/linktrees/${id}`);

        if (nextStatus) {
          toast.success(actionT("archived"));
        } else {
          toast.success(actionT("restored"));
        }
      } catch {
        await fetchLinktrees(false, true);
        toast.error(actionT("archiveFailed"));
      }
    },
    [mergeLinktree, fetchLinktrees, actionT],
  );

  const handleToggleStatus = useCallback(
    async (id: string, nextStatus: "active" | "inactive") => {
      mergeLinktree(id, {
        status: nextStatus,
      });

      try {
        const response = await fetch(`/api/linktrees/${id}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: nextStatus }),
          credentials: "include",
        });

        if (!response.ok) {
          await fetchLinktrees(false, true);
          toast.error(actionT("statusFailed"));
          return;
        }

        const { clearCachedData } = await import("@/lib/utils/cache");
        clearCachedData("/api/linktrees");
        clearCachedData(`/api/linktrees/${id}`);

        if (nextStatus === "active") {
          toast.success(actionT("pageActivated"));
        } else {
          toast.success(actionT("pageDeactivated"));
        }
      } catch {
        await fetchLinktrees(false, true);
        toast.error(actionT("statusFailed"));
      }
    },
    [mergeLinktree, fetchLinktrees, actionT],
  );

  // Left unmemoised on purpose: React Compiler handles the memoisation here, and
  // wrapping it in useCallback trips react-hooks/preserve-manual-memoization.
  // It only calls state setters, so a fresh identity per render is harmless.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleDrawerClose = () => {
    editRequest.current?.abort();
    setIsLoadingEditData(false);
    setIsDrawerOpen(false);
    setEditData(null);
    setIsCreatingDefault(false);
  };

  // Handle ?edit=<id> URL param on initial mount (full page navigation)
  const editParam = searchParams.get("edit");
  useEffect(() => {
    if (!editParam) return;
    const frame = window.requestAnimationFrame(() => {
      void handleEdit(editParam);
      // Strip the param immediately so a later refresh doesn't reopen this modal.
      router.replace("/business/pages", { scroll: false });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [editParam, handleEdit, router]);

  const handleCreateNew = useCallback(() => {
    editRequest.current?.abort();
    setIsLoadingEditData(false);
    setEditData(null);
    setIsDrawerOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (
      data: {
        headline: string;
        slug?: string;
        slogan?: string;
        slogan_color?: string;
        description?: string;
        logo: string | null;
        background_color: string;
        templateKey: TemplateKey;
        templateConfig: Record<string, unknown>;
        platforms: string[];
        links: Record<string, string[]>;
        linkMetadata?: Record<
          string,
          Array<{
            display_order?: number;
            display_name?: string;
            description?: string;
            default_message?: string;
            metadata?: Record<string, unknown>;
          }>
        >;
        is_default?: boolean;
      },
      editId?: string,
    ) => {
      // Prevent duplicate submissions
      if (isSubmittingRef.current) {
        // Submission already in progress, ignoring duplicate call
        return;
      }

      // Mark as submitting immediately to prevent duplicates
      isSubmittingRef.current = true;
      let errorShown = false; // Track if error was shown

      try {
        const normalizedTemplateConfig = normalizeTemplateConfig(
          data.templateKey,
          data.templateConfig,
        );

        if (editId) {
          // ============================================
          // UPDATE EXISTING LINKTREE
          // ============================================

          // Validate required fields
          if (
            !data.headline?.trim() ||
            !data.background_color
          ) {
            console.error("Headline and background color are required");
            throw new Error("Missing required fields");
          }

          if (!data.templateKey) {
            console.error("Template key is required");
            throw new Error("Missing template key");
          }

          // Validate links exist
          if (!data.links || Object.keys(data.links).length === 0) {
            console.error("At least one link is required");
            throw new Error("No links provided");
          }

          // Validate editId is a valid UUID
          const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(editId)) {
            console.error("Invalid linktree ID");
            throw new Error("Invalid linktree ID format");
          }

          // Step 1: Update linktree metadata
          const updateResponse = await fetch(`/api/linktrees/${editId}`, {
            method: "PATCH",
            credentials: "include", // Include cookies for authentication
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              headline: data.headline.trim(),
              ...(data.slug ? { seo_name: data.slug } : {}),
              slogan: data.slogan?.trim() || null,
              slogan_color: data.slogan_color?.trim() || null,
              description: data.description?.trim() || null,
              logo: data.logo || null,
              background_color: data.background_color,
              template_config: normalizedTemplateConfig,
            }),
          });

          if (!updateResponse.ok) {
            type ErrorDetail = { field?: string; message?: string };
            let errorData: {
              error?: string;
              details?: ErrorDetail[] | string;
            } | null = null;

            try {
              const text = await updateResponse.text();
              if (text) {
                const parsed = JSON.parse(text) as unknown;
                if (parsed && typeof parsed === "object") {
                  // The API envelope nests the failure: `{ error: { code,
                  // message, details } }`, with `details` a list of plain
                  // strings from class-validator. Reading only a flat
                  // `{ error: string }` meant every validation failure arrived
                  // as a bare "Validation failed" with the one useful part —
                  // which field, and why — thrown away.
                  const body = parsed as {
                    error?: unknown;
                    details?: unknown;
                    message?: unknown;
                  };
                  const envelope =
                    body.error && typeof body.error === "object"
                      ? (body.error as {
                          message?: unknown;
                          details?: unknown;
                        })
                      : undefined;

                  const rawDetails = envelope?.details ?? body.details;
                  const parsedDetails = Array.isArray(rawDetails)
                    ? rawDetails
                        .map((detail): ErrorDetail | null => {
                          // `["createLinks.0.url must be a URL address"]`
                          if (typeof detail === "string") {
                            return { message: detail };
                          }
                          if (typeof detail === "object" && detail !== null) {
                            const entry = detail as ErrorDetail;
                            return {
                              field:
                                typeof entry.field === "string"
                                  ? entry.field
                                  : undefined,
                              message:
                                typeof entry.message === "string"
                                  ? entry.message
                                  : undefined,
                            };
                          }
                          return null;
                        })
                        .filter((detail): detail is ErrorDetail => !!detail)
                    : undefined;

                  const messageOf = (value: unknown) =>
                    typeof value === "string" ? value : undefined;

                  errorData = {
                    error:
                      messageOf(body.error) ??
                      messageOf(envelope?.message) ??
                      messageOf(body.message),
                    details:
                      parsedDetails ?? messageOf(rawDetails) ?? undefined,
                  };
                }
              }
            } catch (parseError) {
              console.error("Failed to parse error response:", parseError);
              errorData = {
                error: `HTTP ${updateResponse.status}: ${updateResponse.statusText}`,
              };
            }

            const detailMessage = Array.isArray(errorData?.details)
              ? errorData.details
                  .filter(
                    (detail) => detail && (detail.field || detail.message),
                  )
                  .map((detail) => {
                    const fieldPrefix = detail.field ? `${detail.field}: ` : "";
                    return `${fieldPrefix}${detail.message ?? ""}`.trim();
                  })
                  .filter((entry) => entry.length > 0)
                  .join(", ")
              : typeof errorData?.details === "string"
                ? errorData.details
                : "";

            const baseMessage =
              errorData?.error ||
              `Failed to update linktree (HTTP ${updateResponse.status})`;
            const errorMessage = detailMessage
              ? `${baseMessage}: ${detailMessage}`
              : baseMessage;
            console.error(
              "Update error:",
              errorMessage,
              errorData ?? undefined,
            );
            toast.error(
              locale === "ckb" ? errorMessage : actionT("updateFailed"),
            );
            throw new Error(errorMessage);
          }

          // Step 2: Fetch existing identities for the legacy batch request shape.
          const linksResponse = await fetch(`/api/linktrees/${editId}/links`, {
            credentials: "include",
            cache: "no-store",
          });
          const existingLinkIds: string[] = [];
          if (linksResponse.ok) {
            const linksResult = await linksResponse.json();
            const existingLinks = linksResult.data || [];
            existingLinkIds.push(
              ...existingLinks.map((link: { id: string }) => link.id),
            );
          } else {
            console.error(
              "Failed to fetch existing links:",
              linksResponse.status,
              linksResponse.statusText,
            );
            // If we can't fetch existing links, we should still try to delete all links for this linktree
            // This is a safety measure to prevent duplicates
          }

          // Step 3: Prepare links to create
          const linksToCreate: Array<{
            platform: string;
            url: string;
            display_order: number;
            display_name?: string | null;
            description?: string | null;
            default_message?: string | null;
            metadata?: Record<string, unknown>;
          }> = [];

          // Track linkId to index mapping for error display
          const linkIdToIndexMap: Record<number, string> = {};
          let linkCreateIndex = 0;

          if (data.links && Object.keys(data.links).length > 0) {
            let displayOrder = 0;
            for (const [platform, urls] of Object.entries(data.links)) {
              // Validate platform
              if (
                !platform ||
                typeof platform !== "string" ||
                platform.trim().length === 0
              ) {
                continue; // Skip invalid platforms
              }

              // Validate urls array
              if (!Array.isArray(urls) || urls.length === 0) {
                continue; // Skip empty arrays
              }

              const metadataArray = data.linkMetadata?.[platform] || [];
              urls.forEach((url, index) => {
                // Validate URL
                if (
                  !url ||
                  typeof url !== "string" ||
                  url.trim().length === 0
                ) {
                  return; // Skip invalid URLs
                }

                const trimmedPlatform = platform.trim();
                const trimmedUrl = url.trim();

                // Additional validation: ensure platform and URL are not just whitespace
                if (trimmedPlatform.length === 0 || trimmedUrl.length === 0) {
                  return; // Skip empty strings
                }

                const metadata = metadataArray[index] || {};
                linksToCreate.push({
                  platform: trimmedPlatform,
                  url: trimmedUrl,
                  display_order: typeof metadata.display_order === "number" && Number.isSafeInteger(metadata.display_order) && metadata.display_order >= 0
                    ? metadata.display_order : displayOrder,
                  display_name: metadata.display_name?.trim() || null,
                  description: metadata.description?.trim() || null,
                  default_message: metadata.default_message?.trim() || null,
                  metadata:
                    metadata.metadata &&
                    typeof metadata.metadata === "object" &&
                    !Array.isArray(metadata.metadata)
                      ? metadata.metadata
                      : {},
                });

                // Store mapping: index in linksToCreate -> platform_index (for error mapping)
                linkIdToIndexMap[linkCreateIndex] =
                  `${trimmedPlatform}_${index}`;
                linkCreateIndex++;
                displayOrder++;
              });
            }
          }

          // Keep global order across grouped platforms and their validation identities.
          const orderedLinks = linksToCreate.map((link, index) => ({ link, errorKey: linkIdToIndexMap[index] }))
            .sort((a, b) => a.link.display_order - b.link.display_order);
          linksToCreate.splice(0, linksToCreate.length, ...orderedLinks.map(({ link }) => link));
          orderedLinks.forEach(({ errorKey }, index) => { linkIdToIndexMap[index] = errorKey; });

          // The shared batch sync preserves matching link identities and analytics.
          if (existingLinkIds.length > 0 || linksToCreate.length > 0) {
            const batchResponse = await fetch(
              `/api/linktrees/${editId}/links/batch`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  deleteIds: existingLinkIds,
                  createLinks: linksToCreate,
                }),
              },
            );

            if (!batchResponse.ok) {
              const errorData = await batchResponse.json().catch(() => ({}));
              let errorMessage = "Failed to update links";

              // Check if there are per-link validation errors
              if (
                Array.isArray(errorData.details) &&
                errorData.details.length > 0
              ) {
                // Map errors to link positions for display in modal
                // The API returns errors with index corresponding to linksToCreate array
                const linkErrors: Record<string, string> = {};

                errorData.details.forEach(
                  (d: {
                    index?: number;
                    platform?: string;
                    url?: string;
                    reason?: string;
                  }) => {
                    if (d.index !== undefined && d.platform && d.reason) {
                      // Map API index to platform_index format using our mapping
                      const mappedKey = linkIdToIndexMap[d.index];
                      if (mappedKey) {
                        linkErrors[mappedKey] = d.reason;
                      } else {
                        // Fallback: use platform_index directly
                        linkErrors[`${d.platform}_${d.index}`] = d.reason;
                      }
                    }
                  },
                );

                // Store link errors to pass to modal
                errorMessage =
                  errorData.message ||
                  errorData.error ||
                  "Some links have validation errors";
                console.error(errorMessage);

                // Throw error with link errors attached
                const error = new Error(errorMessage) as Error & {
                  linkErrors?: Record<string, string>;
                };
                error.linkErrors = linkErrors;
                throw error;
              } else {
                if (errorData.message) {
                  errorMessage = errorData.message;
                } else if (errorData.error) {
                  errorMessage = errorData.error;
                }
                console.error(errorMessage);
                throw new Error(errorMessage);
              }
            } else {
              // Clear cache after successful batch update
              const { clearCachedData } = await import("@/lib/utils/cache");
              clearCachedData(`/api/linktrees/${editId}/links`);
              clearCachedData(`/api/linktrees/${editId}`);
              clearCachedData("/api/linktrees");
            }
          }

          // Optimistic update - update in UI immediately
          const updateResponseData = await updateResponse.json();
          if (updateResponseData.data) {
            // Clear cache after successful update
            const { clearCachedData } = await import("@/lib/utils/cache");
            clearCachedData("/api/linktrees");
            clearCachedData(`/api/linktrees/${editId}`);
            clearCachedData(`/api/linktrees/${editId}/links`);
            if (updateResponseData.data.uid) {
              clearCachedData(
                `/api/linktrees/uid/${updateResponseData.data.uid}`,
              );
              clearCachedData(
                `/api/public/linktrees/${updateResponseData.data.uid}`,
              );
            }

            mergeLinktree(editId, updateResponseData.data);
          }

          // Step 5: Show success notification
          if (!errorShown) {
            toast.info(actionT("updated"));
            errorShown = true;
          }

          // Close modal immediately for better UX
          setIsDrawerOpen(false);
          setEditData(null);

          // Background refresh disabled to reduce server load on free hosting
        } else {
          // ============================================
          // CREATE NEW LINKTREE
          // ============================================

          // Validate required fields
          if (
            !data.headline?.trim() ||
            !data.background_color
          ) {
            console.error("Headline and background color are required");
            throw new Error("Missing required fields");
          }

          if (!data.templateKey) {
            console.error("Template key is required");
            throw new Error("Missing template key");
          }

          if (!data.links || Object.keys(data.links).length === 0) {
            console.error("Please add at least one link");
            throw new Error("No links provided");
          }

          if (!data.platforms || data.platforms.length === 0) {
            console.error("At least one platform is required");
            throw new Error("No platforms provided");
          }

          const createResponse = await fetch("/api/linktrees", {
            method: "POST",
            credentials: "include", // Include cookies for authentication
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              headline: data.headline.trim(),
              ...(data.slug ? { seo_name: data.slug } : {}),
              slogan: data.slogan?.trim() || null,
              slogan_color: data.slogan_color?.trim() || null,
              description: data.description?.trim() || null,
              logo: data.logo || null,
              background_color: data.background_color,
              template_config: normalizedTemplateConfig,
              platforms: data.platforms,
              links: data.links,
              linkMetadata: data.linkMetadata,
              ...((data as { is_default?: boolean }).is_default
                ? { is_default: true }
                : {}),
            }),
          });

          if (!createResponse.ok) {
            const errorData = await createResponse.json().catch(() => ({}));
            const errorMessage =
              errorData.error || errorData.details
                ? `${errorData.error || "Validation failed"}: ${Array.isArray(errorData.details) ? errorData.details.map((d: { field: string; message: string }) => `${d.field}: ${d.message}`).join(", ") : ""}`
                : "Failed to create linktree";
            console.error(errorMessage);
            throw new Error(errorMessage);
          }

          const result = await createResponse.json();
          if (result.data) {
            // Clear cache after successful creation
            const { clearCachedData } = await import("@/lib/utils/cache");
            clearCachedData("/api/linktrees");

            // Optimistic update - add to UI immediately
            prependLinktree(result.data);

            toast.success(actionT("created"));
            handleDrawerClose();

            // Background refresh disabled to reduce server load on free hosting
          } else {
            console.error("Failed to create linktree: No data returned");
            throw new Error("No data returned from server");
          }
        }
      } catch (error) {
        console.error("Error saving linktree:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        // Show error only if not already shown
        if (!errorShown) {
          console.error(
            editId
              ? `Failed to update linktree: ${errorMessage}`
              : `Failed to create linktree: ${errorMessage}`,
          );
        }
        // Re-throw error so modal can handle it and display per-link errors
        throw error;
      } finally {
        // ALWAYS reset submission flag, even on error
        isSubmittingRef.current = false;
      }
    },
    [handleDrawerClose, mergeLinktree, prependLinktree, actionT, locale],
  );

  // Don't render anything if not authenticated (after all hooks)
  // This check happens after all hooks are declared to follow React rules
  if (badGateway) {
    return (
      <ErrorPage
        {...businessErrorPageCopy(locale, "badGateway")}
        theme={businessErrorTheme({
          websiteColor: parseWebsiteColor(
            wColor || websiteColor || DEFAULT_BUSINESS_ACCENT,
          ),
          favicon: favicon || null,
          logo: logo || null,
          name: name || null,
          subdomain: null,
        })}
        homeHref="/"
        onReset={() => window.location.reload()}
      />
    );
  }

  if (serviceUnavailable) {
    return (
      <ErrorPage
        {...businessErrorPageCopy(locale, "serviceUnavailable")}
        theme={businessErrorTheme({
          websiteColor: parseWebsiteColor(
            wColor || websiteColor || DEFAULT_BUSINESS_ACCENT,
          ),
          favicon: favicon || null,
          logo: logo || null,
          name: name || null,
          subdomain: null,
        })}
        homeHref="/"
        onReset={() => window.location.reload()}
      />
    );
  }

  if (gatewayTimeout) {
    return (
      <ErrorPage
        {...businessErrorPageCopy(locale, "gatewayTimeout")}
        theme={businessErrorTheme({
          websiteColor: parseWebsiteColor(
            wColor || websiteColor || DEFAULT_BUSINESS_ACCENT,
          ),
          favicon: favicon || null,
          logo: logo || null,
          name: name || null,
          subdomain: null,
        })}
        homeHref="/"
        onReset={() => window.location.reload()}
      />
    );
  }

  if (accessForbidden) {
    return (
      <ErrorPage
        {...businessErrorPageCopy(locale, "forbidden")}
        theme={businessErrorTheme({
          websiteColor: parseWebsiteColor(
            wColor || websiteColor || DEFAULT_BUSINESS_ACCENT,
          ),
          favicon: favicon || null,
          logo: logo || null,
          name: name || null,
          subdomain: null,
        })}
        homeHref="/"
      />
    );
  }

  if (!currentUsername || currentUsername.trim() === "") {
    return null; // Return null while redirecting
  }

  const editingLinktree = editData ? linktreesData.find(item => item.id === editData.linktree.id) : undefined;
  const drawerHeaderControls = (<DashboardAppearanceControls
                  compact
                  languageControl={<BusinessLanguageSelector compact />}
                  theme={theme}
                  mounted={mounted}
                  onToggleTheme={toggleTheme}
                  labels={{
                    theme: headerT("theme"),
                    darkTheme: headerT("darkTheme"),
                    lightTheme: headerT("lightTheme"),
                    themeLabel: headerT("themeLabel"),
                  }}
                />);

  return (
    <ThemeProvider websiteColor={wColor || websiteColor || DEFAULT_BUSINESS_ACCENT} documentTheme="business">
      <DashboardRefreshProvider value={dashboardRefresh}>
        <BusinessSubscriptionModal
          isOpen={subscriptionOpen}
          onClose={() => setSubscriptionOpen(false)}
          locale={locale}
        />
        <div
          data-business-dashboard
          className="h-screen bg-slate-50 dark:bg-[#161B22] text-slate-800 dark:text-gray-100 flex flex-col md:flex-row relative overflow-hidden"
          dir="ltr"
          inert={onboardingRequired ? true : undefined}
          aria-hidden={onboardingRequired ? true : undefined}
        >
          <DashboardSidebar
            accentColor={wColor || websiteColor || DEFAULT_BUSINESS_ACCENT}
            brandName="Sponsor.krd"
            brandSubtitle={t("subtitle")}
            brandImage={SPONSOR_KRD_LOGO}
            brandImageAlt="Sponsor.krd"
            items={sidebarItems.filter((item) =>
              isBusinessPageVisible(item.id as BusinessDashboardPage, liveEffectiveAccess),
            )}
            collapsed={isSidebarCollapsed}
            mobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            closeLabel={sidebarT("closeLabel")}
            closeTooltip={sidebarT("close")}
            websiteLabel={sidebarT("website")}
            footer={
              <BusinessSidebarFooter
                collapsed={isSidebarCollapsed}
                planCode={liveEffectiveAccess?.subscription.planCode}
                planName={liveEffectiveAccess?.subscription.planName}
                onSupport={() => { setIsMobileSidebarOpen(false); router.push("/business/settings?tab=messages"); }}
                onUpgrade={() => { setIsMobileSidebarOpen(false); setSubscriptionOpen(true); }}
              />
            }
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
            <DashboardHeader
              title={t(
                activeTab === "tiktok-config" ? "tiktokSettings" : activeTab,
              )}
              languageControl={<BusinessLanguageSelector />}
              labels={{
                menu: headerT("menu"),
                menuLabel: headerT("menuLabel"),
                refresh: headerT("refresh"),
                refreshLabel: headerT("refreshLabel"),
                theme: headerT("theme"),
                darkTheme: headerT("darkTheme"),
                lightTheme: headerT("lightTheme"),
                themeLabel: headerT("themeLabel"),
                accountMenu: headerT("accountMenu"),
              }}
              theme={theme}
              mounted={mounted}
              refreshing={dashboardRefresh.isRefreshing}
              onToggleSidebar={() => {
                if (window.matchMedia("(max-width: 767px)").matches) {
                  setIsMobileSidebarOpen((open) => !open);
                } else {
                  setIsSidebarCollapsed((collapsed) => !collapsed);
                }
              }}
              onToggleTheme={toggleTheme}
              onRefresh={handleGlobalDashboardRefresh}
              notifications={<BusinessCommunicationBell />}
              profile={{
                name,
                email,
                badge: liveEffectiveAccess?.subscription.planName,
                avatarSrc: logo,
                items: [
                  {
                    id: "settings",
                    label: t("settings"),
                    icon: <Settings className="h-4 w-4" />,
                    onClick: () => router.push("/business/settings"),
                  },
                  {
                    id: "divider",
                    label: "",
                    icon: null,
                    divider: true,
                    onClick: () => undefined,
                  },
                  {
                    id: "logout",
                    label: t("logout"),
                    icon: <LogOut className="h-4 w-4" />,
                    danger: true,
                    onClick: () => void handleLogout(),
                  },
                ],
              }}
              onProfileItemClick={() => setIsMobileSidebarOpen(false)}
            />

            {/* Main Content */}
            <main
              className={`flex-1 w-full relative ${pageLocked ? "overflow-hidden" : "overflow-y-auto"}`}
              dir="ltr"
            >
              <div
                className={`max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-6 md:py-8 lg:py-10 relative z-10 ${pageLocked ? "flex h-full flex-col overflow-hidden" : ""}`}
              >
                <BusinessAnnouncementBanners />
                <LockedBusinessContent
                  locked={pageLocked}
                  title={actionT("lockedTitle")}
                  reason={pageLockReason}
                >
                  {/*
                  A locked page renders a placeholder, never the real feature.
                  The feature components load their own data on mount, and on a
                  plan that does not include them every one of those requests
                  comes back 403 — which at best logs noise behind the blur and
                  at worst throws past this overlay into the error boundary,
                  replacing the whole dashboard with an error page. The lock
                  panel is the content here; there is nothing to fetch.
                */}
                  {pageLocked ? (
                    <SkeletonDashboardPage
                      statCount={4}
                      body="analytics"
                      loadingLabel={
                        locale === "ar"
                          ? "جارٍ تحميل بيانات لوحة التحكم"
                          : locale === "en"
                            ? "Loading dashboard data"
                            : "داتای داشبۆرد بار دەکرێت"
                      }
                    />
                  ) : activeTab === "linktrees" ? (
                    <BusinessLinktreesPage
                      headerControls={drawerHeaderControls}
                      accentColor={wColor ?? null}
                      linktrees={filteredLinktrees}
                      linktreeCount={linktreesData.length}
                      isLoading={isLoading}
                      analyticsLoading={isAnalyticsLoading || isAnalyticsRefreshing}
                      analyticsUnavailable={analyticsUnavailable}
                      pagesUnavailable={pagesUnavailable}
                      totalViews={analyticsTotals.total_views}
                      uniqueViews={analyticsTotals.unique_views}
                      totalClicks={analyticsTotals.total_clicks}
                      uniqueClicks={analyticsTotals.unique_clicks}
                      contactActions={analyticsTotals.contact_actions}
                      isRefreshing={isRefreshing}
                      isClearingAnalytics={isClearingAnalytics}
                      searchQuery={searchQuery}
                      isSearchModalOpen={isSearchModalOpen}
                      viewMode={viewMode}
                      onClearAnalytics={handleClearSelectedAnalytics}
                      canDelete={liveEffectiveAccess?.permissions["business:linktrees:delete"]?.outcome === "allow"}
                      canClearAnalytics={liveEffectiveAccess?.permissions["business:analytics:clear-linktree"]?.outcome === "allow"}
                      onRefresh={handleRefresh}
                      onSearchAction={() =>
                        searchQuery.trim()
                          ? setSearchQuery("")
                          : setIsSearchModalOpen(true)
                      }
                      onViewModeChange={setViewMode}
                      onCreate={handleCreateNew}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onViewAnalytics={handleViewAnalytics}
                      onPinnedChange={(id, pinned) => mergeLinktree(id, { is_pinned: pinned })}
                      canPin={canPinLinktrees}
                      canShareAnalytics={linktreePinPermission?.outcome === "allow" && liveEffectiveAccess?.permissions["business:linktrees:read"]?.outcome === "allow"}
                      onToggleArchive={handleToggleArchive}
                    />
                  ) : activeTab === "forms" ? (
                    <BusinessFormsPage
                      capabilities={{
                        create:
                          liveEffectiveAccess?.permissions[
                            "business:forms:create"
                          ]?.outcome === "allow",
                        update:
                          liveEffectiveAccess?.permissions[
                            "business:forms:update"
                          ]?.outcome === "allow",
                        remove:
                          liveEffectiveAccess?.permissions[
                            "business:forms:delete"
                          ]?.outcome === "allow",
                      }}
                      accentColor={wColor ?? null}
                      theme={theme}
                      mounted={mounted}
                      onToggleTheme={toggleTheme}
                    />
                  ) : activeTab === "tiktok-config" ? (
                    <BusinessTikTokConfigPage
                      pixelCopy={
                        locale === "ckb"
                          ? undefined
                          : businessMessages[locale].TikTokPixel
                      }
                    />
                  ) : activeTab === "templates" ? (
                    <TemplatesPage
                      locale={locale}
                      accessMode="entitlement"
                      copy={businessMessages[locale].TemplatesPage}
                    />
                  ) : activeTab === "settings" ? (
                    <BusinessSettingsPage />
                  ) : (
                    <div className="flex items-center justify-center min-h-[60vh]">
                      <div className="text-center">
                        {activeTab === "profile" ? (
                          <User className="h-16 w-16 mx-auto mb-6 text-slate-300 dark:text-gray-600" />
                        ) : (
                          <Settings className="h-16 w-16 mx-auto mb-6 text-slate-300 dark:text-gray-600" />
                        )}
                        <h2 className="text-2xl font-bold text-slate-600 dark:text-gray-300 mb-2">
                          {t(activeTab === "profile" ? "profile" : "settings")}
                        </h2>
                        <p className="text-slate-400 dark:text-gray-500">
                          {t("comingSoon")}
                        </p>
                      </div>
                    </div>
                  )}
                </LockedBusinessContent>
              </div>
            </main>
          </div>

          {/* Delete Confirmation Modal */}
          {isDeleteModalOpen && linktreeToDelete && (
            <ConfirmDeleteModal
              isOpen={isDeleteModalOpen}
              onClose={handleDeleteModalClose}
              onConfirm={handleDeleteConfirm}
              title={t("deletePage")}
              confirmLabel={t("confirmDelete")}
              loadingLabel={t("deleting")}
              cancelLabel={t("cancel")}
              closeLabel={t("close")}
              isDeleting={isDeleting}
              message={
                <p>
                  {t("deletePageQuestion")}{" "}
                  <span className="font-bold text-slate-900 dark:text-white">
                    &quot;{linktreeToDelete.name}&quot;
                  </span>
                  {t("irreversible")}
                </p>
              }
            />
          )}

          {/* Shared create/edit drawer */}
          <DrawerPresence>{isDrawerOpen && (
            <LinktreeEditorDrawer
              copy={
                locale === "ar"
                  ? arabicEditorCopy
                  : locale === "en"
                    ? englishEditorCopy
                    : undefined
              }
              colorCopy={
                locale === "ckb"
                  ? undefined
                  : businessMessages[locale].SettingsColorPicker
              }
              advancedSeoAllowed={liveEffectiveAccess?.subscription.planCode?.trim().toLowerCase() === "max" && ["trialing", "active", "grace_period"].includes(liveEffectiveAccess.subscription.status)}
              locale={locale}
              headerControls={drawerHeaderControls}
              isOpen={isDrawerOpen}
              onClose={handleDrawerClose}
              onSubmit={handleSubmit}
              editData={editData}
              management={editingLinktree ? { item: editingLinktree, onToggleStatus: handleToggleStatus, onToggleArchive: handleToggleArchive, onDuplicated: () => { void handleRefresh(); } } : undefined}
              isLoadingEditData={isLoadingEditData}
              businessDefaults={isCreatingDefault ? undefined : defaults}
              businessIdentity={{ name, phone }}
              isDefault={isCreatingDefault}
            />
          )}</DrawerPresence>

          <DrawerPresence>{analyticsModalLinktree && (
            <PageAnalyticsDrawer
              isOpen={Boolean(analyticsModalLinktree)}
              onClose={() => setAnalyticsModalLinktree(null)}
              pageId={analyticsModalLinktree.id}
              pageName={analyticsModalLinktree.name}
              headerControls={drawerHeaderControls}
              locale={locale}
              copy={
                locale === "ckb"
                  ? undefined
                  : businessMessages[locale].PageAnalytics
              }
              canClearAnalytics={
                liveEffectiveAccess?.permissions[
                  "business:analytics:clear-linktree"
                ]?.outcome === "allow"
              }
            />
          )}</DrawerPresence>


          {/* Floating Command Palette Search Modal */}
          <LinktreeSearchModal
            isOpen={isSearchModalOpen}
            onClose={() => setIsSearchModalOpen(false)}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            items={linktreesData}
            onSelect={(item) => handleEdit(item.id)}
            publicPathPrefix="/linktree"
            copy={{
              action: searchT("action"),
              placeholder: searchT("placeholder"),
              close: searchT("close"),
              prompt: searchT("prompt"),
              noResults: searchT("noResults"),
            }}
          />
        </div>
        {onboardingRequired ? (
          <BusinessGettingStarted
            languageControl={<BusinessLanguageSelector compact />}
            initialStep={onboardingStep}
            copy={
              locale === "ckb" ? undefined : businessMessages[locale].Onboarding
            }
            brandCopy={
              locale === "ckb"
                ? undefined
                : businessMessages[locale].OnboardingBrand
            }
            tikTokCopy={
              locale === "ckb"
                ? undefined
                : businessMessages[locale].OnboardingTikTok
            }
            identityCopy={
              locale === "ckb"
                ? undefined
                : businessMessages[locale].SettingsPage
            }
            colorCopy={
              locale === "ckb"
                ? undefined
                : businessMessages[locale].SettingsColorPicker
            }
          />
        ) : null}
      </DashboardRefreshProvider>
    </ThemeProvider>
  );
});
