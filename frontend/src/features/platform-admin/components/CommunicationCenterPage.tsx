"use client";

import { MotionPulseIcon, MotionSpinner } from "@/components/motion/MotionPrimitives";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Archive,
  CalendarClock,
  ChevronRight,
  Clock3,
  Eye,
  Globe2,
  History,
  Inbox,
  Loader2,
  Megaphone,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal";
import { CheckboxField } from "@/components/shared/CheckboxField";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { DateTimeInput } from "@/components/shared/DateTimeInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { ManagementModal } from "@/components/shared/ManagementModal";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchModal } from "@/components/shared/SearchModal";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import { StatCard } from "@/components/shared/StatCard";
import { SkeletonStatCards } from "@/components/shared/Skeleton";
import { communicationRequest } from "@/features/communications/api";
import { formatNotificationDate } from "@/features/communications/format";
import { conversationCategoryLabel } from "@/features/communications/conversation-categories";
import { usePolling } from "@/lib/utils/usePolling";
import { ChatComposer } from "@/features/communications/ChatComposer";
import type {
  Announcement,
  Conversation,
} from "@/features/communications/types";
import { StatCardGrid } from "@/components/shared/StatCardGrid";
import { Tooltip } from "@/components/shared/Tooltip";
import { useCommunicationText } from "./use-communication-text";
import { usePlatformLocale } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { platformLoadingCopy } from "@/features/platform-admin/i18n/loading-copy";
import { platformIntlLocale } from "@/features/platform-admin/i18n/locale";
import { platformRequestError } from "@/features/platform-admin/i18n/request-error";

type CenterTab =
  | "overview"
  | "announcements"
  | "messages"
  | "homepage"
  | "history";
type BusinessOption = { id: string; name: string; username: string };
type PlanOption = { code: string; name: string };
type Overview = {
  announcements: {
    total: number;
    active: number;
    scheduled: number;
    drafts: number;
    homepage: number;
    failed: number;
  };
  conversations: {
    open: number;
    waitingPlatform: number;
    unreadMessages: number;
  };
  notifications: { unread: number };
};

const tabs = [
  { id: "overview" as const, label: "پوختە", icon: Inbox },
  { id: "announcements" as const, label: "ڕاگەیاندنەکان", icon: Megaphone },
  { id: "messages" as const, label: "پەیامەکانی بزنس", icon: MessageSquare },
  { id: "homepage" as const, label: "ماڵپەڕ", icon: Globe2 },
  { id: "history" as const, label: "مێژوو", icon: History },
];

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-[var(--sponsor-krd-accent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--sponsor-krd-accent)_20%,transparent)] dark:border-white/10 dark:bg-[#161B22] dark:text-slate-200";

const initialForm = {
  title: "",
  message: "",
  announcementType: "general",
  priority: "normal",
  audienceType: "all",
  audienceValues: [] as string[],
  channels: ["business_bell"] as string[],
  ctaLabel: "",
  ctaUrl: "",
  publishAt: "",
  expiresAt: "",
  homepagePlacement: "top_banner",
  homepagePriority: 0,
  homepageDismissible: true,
};

export function CommunicationCenterPage() {
  const t = useCommunicationText();
  const { locale } = usePlatformLocale();
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);
  const localeRef = useRef(locale);
  useEffect(() => { localeRef.current = locale; }, [locale]);
  const [tab, setTab] = useState<CenterTab>(() => {
    if (typeof window === "undefined") return "overview";
    const queryTab = new URLSearchParams(window.location.search).get("tab");
    return tabs.some((item) => item.id === queryTab)
      ? (queryTab as CenterTab)
      : "overview";
  });
  const [overview, setOverview] = useState<Overview | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [confirmation, setConfirmation] = useState<{
    type: "publish" | "archive";
    item: Announcement;
  } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [announcementSearch, setAnnouncementSearch] = useState("");
  const [announcementStatus, setAnnouncementStatus] = useState("all");
  const [announcementSearchOpen, setAnnouncementSearchOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [
        overviewData,
        announcementData,
        conversationData,
        businessData,
        billingData,
      ] = await Promise.all([
        communicationRequest<Overview>("/api/platform/communications/overview"),
        communicationRequest<Announcement[]>(
          "/api/platform/communications/announcements",
        ),
        communicationRequest<Conversation[]>(
          "/api/platform/communications/conversations",
        ),
        communicationRequest<BusinessOption[]>(
          "/api/platform/businesses/options?limit=100",
        ),
        communicationRequest<{ plans?: PlanOption[] }>("/api/platform/billing"),
      ]);
      setOverview(overviewData);
      setAnnouncements(announcementData);
      setConversations(conversationData);
      setBusinesses(businessData);
      setPlans(billingData.plans || []);
      const requestedConversation = new URLSearchParams(
        window.location.search,
      ).get("conversation");
      if (
        requestedConversation &&
        conversationData.some((item) => item.id === requestedConversation)
      ) {
        const detail = await communicationRequest<Conversation>(
          `/api/platform/communications/conversations/${requestedConversation}`,
        );
        setSelectedConversation(detail);
        setTab("messages");
      }
    } catch (error) {
      toast.error(tRef.current("بارکردنی ناوەندی پەیوەندی سەرکەوتوو نەبوو"), {
        description: platformRequestError(error instanceof Error ? error.message : null, tRef.current("بارکردنی ناوەندی پەیوەندی سەرکەوتوو نەبوو"), localeRef.current),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void load());
    return () => window.cancelAnimationFrame(frame);
  }, [load]);

  // Unchanged payloads are dropped before they reach state, so an idle inbox
  // stops re-rendering this page every tick.
  const lastOverviewRef = useRef<string>("");
  const lastListRef = useRef<string>("");
  const lastThreadRef = useRef<string>("");

  // Not memoized: `usePolling` reads the latest task from a ref each tick.
  const refreshMessages = async () => {
    try {
      const [overviewData, conversationData] = await Promise.all([
        communicationRequest<Overview>("/api/platform/communications/overview"),
        communicationRequest<Conversation[]>(
          "/api/platform/communications/conversations",
        ),
      ]);
      const serializedOverview = JSON.stringify(overviewData);
      if (serializedOverview !== lastOverviewRef.current) {
        lastOverviewRef.current = serializedOverview;
        setOverview(overviewData);
      }
      const serializedList = JSON.stringify(conversationData);
      if (serializedList !== lastListRef.current) {
        lastListRef.current = serializedList;
        setConversations(conversationData);
      }
      if (selectedConversation?.id) {
        const detail = await communicationRequest<Conversation>(
          `/api/platform/communications/conversations/${selectedConversation.id}`,
        );
        const serializedThread = JSON.stringify(detail);
        if (serializedThread !== lastThreadRef.current) {
          lastThreadRef.current = serializedThread;
          setSelectedConversation(detail);
        }
      }
    } catch {
      // Keep the last valid communication state during transient failures.
    }
  };

  usePolling(refreshMessages, 5_000, { immediate: false });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        tab === "announcements" &&
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setAnnouncementSearchOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tab]);

  const openComposer = (channel?: "homepage") => {
    setEditing(null);
    setShowComposer(true);
    if (channel === "homepage") setTab("homepage");
  };

  const openConversation = async (conversation: Conversation) => {
    try {
      const detail = await communicationRequest<Conversation>(
        `/api/platform/communications/conversations/${conversation.id}`,
      );
      setSelectedConversation(detail);
      setConversations((current) =>
        current.map((item) =>
          item.id === conversation.id ? { ...item, unreadCount: 0 } : item,
        ),
      );
    } catch (error) {
      toast.error(
        platformRequestError(error instanceof Error ? error.message : null, t("پەیامەکە نەکرایەوە"), locale),
      );
    }
  };

  if (loading && !overview) {
    return (
      <div className="min-h-[55vh] py-4">
        <SkeletonStatCards count={4} className="grid-cols-2 lg:grid-cols-4" loadingLabel={platformLoadingCopy[locale].loading} />
      </div>
    );
  }

  const contentMeta = {
    overview: {
      title: t("پوختەی پەیوەندییەکان"),
      description: t("دوایین ڕاگەیاندن و ئەو پەیامانەی پێویستیان بە وەڵامی پلاتفۆرم هەیە."),
      icon: Inbox,
    },
    announcements: {
      title: t("ڕاگەیاندنەکان"),
      description: t("ڕەشنووس، ڕێکخراو و ڕاگەیاندنە بڵاوکراوەکان بەڕێوەببە."),
      icon: Megaphone,
    },
    messages: {
      title: t("پەیامەکانی بزنس"),
      description: t("گفتوگۆ و داواکارییەکانی نێوان بزنسەکان و پلاتفۆرم بەڕێوەببە."),
      icon: MessageSquare,
    },
    homepage: {
      title: t("پەیوەندییەکانی ماڵپەڕ"),
      description: t("بانەر و ناساندنی تایبەتمەندییەکانی ماڵپەڕ بەڕێوەببە."),
      icon: Globe2,
    },
    history: {
      title: t("مێژووی گەیاندن"),
      description: t("دۆخی گەیاندن، خوێندنەوە و ئەرشیفی ڕاگەیاندنەکان ببینە."),
      icon: History,
    },
  }[tab];
  const currentAnnouncements = announcements.filter(
    (item) => !["expired", "archived"].includes(item.status),
  );
  const filteredAnnouncements = currentAnnouncements.filter(
    (item) =>
      (announcementStatus === "all" || item.status === announcementStatus) &&
      `${item.title} ${item.message}`
        .toLowerCase()
        .includes(announcementSearch.trim().toLowerCase()),
  );
  const announcementFilterCount =
    (announcementSearch.trim() ? 1 : 0) +
    (announcementStatus !== "all" ? 1 : 0);
  const clearAnnouncementFilters = () => {
    setAnnouncementSearch("");
    setAnnouncementStatus("all");
  };

  return (
    <div className="space-y-5" dir="ltr">
      <StatCardGrid>
        <StatCard
          icon={Megaphone}
          label={t("ڕاگەیاندنی چالاک")}
          value={overview?.announcements.active || 0}
          color="blue"
        />
        <StatCard
          icon={CalendarClock}
          label={t("ڕێکخراو")}
          value={overview?.announcements.scheduled || 0}
          color="purple"
        />
        <StatCard
          icon={MessageSquare}
          label={t("پەیامی نەخوێندراو")}
          value={overview?.conversations.unreadMessages || 0}
          color="orange"
        />
        <StatCard
          icon={Globe2}
          label={t("لە ماڵپەڕ")}
          value={overview?.announcements.homepage || 0}
          color="green"
        />
      </StatCardGrid>

      <SegmentedTabs
        tabs={tabs.map((item) => ({ ...item, label: t(item.label) }))}
        value={tab}
        onChange={setTab}
        accent="var(--sponsor-krd-accent)"
      />

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1c222b] sm:p-6">
        <PageHeader
          title={contentMeta.title}
          description={contentMeta.description}
          icon={contentMeta.icon}
          action={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Tooltip content={t("نوێکردنەوە")} side="bottom">
                <button
                  type="button"
                  onClick={() => void load()}
                  disabled={loading}
                  className="group flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10 cursor-pointer"
                  aria-label={t("نوێکردنەوە")}
                >
                  <MotionSpinner active={loading}><RefreshCw
                    className="h-4 w-4 -transform"
                   /></MotionSpinner>
                </button>
              </Tooltip>
              {tab === "announcements" && (
                <>
                  <Tooltip content={t("گەڕان و پاڵاوتن (Ctrl+K)")} side="top">
                    <button
                      type="button"
                      onClick={() => setAnnouncementSearchOpen(true)}
                      className={`group relative flex h-10 min-w-10 flex-1 items-center justify-between rounded-xl border px-3.5 shadow-sm transition-all hover:shadow sm:w-48 sm:flex-none cursor-pointer ${
                        announcementSearchOpen || announcementFilterCount > 0
                          ? "sa-soft sa-soft-border"
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50/50 hover:text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                      }`}
                      title={t("گەڕان و پاڵاوتن (Ctrl+K)")}
                      aria-label={t("گەڕان و پاڵاوتن")}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:scale-110 dark:text-gray-500" />
                        <span className="truncate text-xs font-semibold">
                          {t("گەڕان و پاڵاوتن")}
                        </span>
                      </div>
                    {announcementFilterCount > 0 ? (
                      <span className="sa-gradient flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[9px] font-bold">
                        {announcementFilterCount}
                      </span>
                    ) : (
                      <kbd className="hidden items-center gap-0.5 rounded bg-slate-100 px-1 py-0.5 font-sans text-[8px] font-bold text-slate-400 select-none dark:bg-white/10 dark:text-gray-500 sm:inline-flex">
                        Ctrl K
                      </kbd>
                    )}
                  </button>
                </Tooltip>
                  {announcementFilterCount > 0 && (
                    <Tooltip content={t("پاککردنەوەی پاڵاوتنەکان")} side="bottom">
                      <button
                        type="button"
                        onClick={clearAnnouncementFilters}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-500 shadow-sm transition hover:border-red-300 hover:bg-red-100 hover:text-red-600 hover:shadow dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/35 dark:hover:text-red-300 cursor-pointer"
                        aria-label={t("پاککردنەوەی پاڵاوتنەکان")}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  )}
                </>
              )}
              <button
                type="button"
                onClick={() =>
                  openComposer(tab === "homepage" ? "homepage" : undefined)
                }
                className="sa-gradient sa-gradient-hover flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-black shadow-sm"
              >
                <Plus className="h-4 w-4" />
                {tab === "homepage" ? t("زیادکردنی ماڵپەڕ") : t("ڕاگەیاندنی نوێ")}
              </button>
            </div>
          }
        />

        <div className="min-h-[34rem]">
        {tab === "overview" && (
          <OverviewTab
            overview={overview}
            announcements={announcements}
            conversations={conversations}
            onAnnouncement={() => openComposer()}
            onConversation={(item) => {
              setTab("messages");
              void openConversation(item);
            }}
          />
        )}
        {tab === "announcements" && (
          <AnnouncementsTab
            announcements={filteredAnnouncements}
            onEdit={(item) => {
              setEditing(item);
              setShowComposer(true);
            }}
            onPublish={(item) => setConfirmation({ type: "publish", item })}
          />
        )}
        {tab === "messages" && (
          <MessagesTab
            conversations={conversations}
            selected={selectedConversation}
            onSelect={(item) => void openConversation(item)}
            onRefresh={load}
            onSelectedChange={setSelectedConversation}
          />
        )}
        {tab === "homepage" && (
          <HomepageTab
            announcements={announcements.filter((item) =>
              item.channels.includes("homepage"),
            )}
          />
        )}
        {tab === "history" && (
          <HistoryTab
            announcements={announcements}
            onArchive={(item) => setConfirmation({ type: "archive", item })}
          />
        )}
        </div>
      </section>

      <SearchModal
        isOpen={tab === "announcements" && announcementSearchOpen}
        onClose={() => setAnnouncementSearchOpen(false)}
        wide
        placeholder={t("بە ناونیشان یان ناوەڕۆکی ڕاگەیاندن بگەڕێ...")}
        clearLabel={t("پاککردنەوەی هەموو")}
        applyLabel={t("داخستن")}
        clearAriaLabel={t("پاککردنەوەی هەموو")}
        applyAriaLabel={t("داخستن")}
        searchQuery={announcementSearch}
        onSearchQueryChange={setAnnouncementSearch}
      >
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {t("پاڵاوتنی ورد")}
            </p>
            <Tooltip content={t("پاککردنەوەی هەموو")} side="bottom">
              <button
                type="button"
                onClick={clearAnnouncementFilters}
                disabled={announcementFilterCount === 0}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 transition hover:border-red-300 hover:bg-red-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/35 dark:hover:text-red-300 cursor-pointer"
                aria-label={t("پاککردنەوەی هەموو")}
              >
                <X className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <CustomSelect
              label={t("دۆخی ڕاگەیاندن")}
              value={announcementStatus}
              onChange={setAnnouncementStatus}
              options={[
                { value: "all", label: t("هەموو دۆخەکان") },
                { value: "draft", label: t("ڕەشنووس") },
                { value: "scheduled", label: t("ڕێکخراو") },
                { value: "published", label: t("بڵاوکراوە") },
              ]}
            />
          </div>
        </div>
        <div className="mt-2 border-t border-slate-100 pt-2 dark:border-white/5">
          {announcementFilterCount === 0 ? (
            <div className="flex select-none flex-col items-center justify-center gap-2 py-8 text-center text-xs text-slate-400 dark:text-gray-500 sm:text-sm">
              <MotionPulseIcon>
                <Search className="sa-accent-text h-5 w-5 opacity-40" />
              </MotionPulseIcon>
              <span>{t("بگەڕێ یان دۆخێک هەڵبژێرە.")}</span>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400 dark:text-gray-500">
              {t("هیچ ئەنجامێک نەدۆزرایەوە")}
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {filteredAnnouncements.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAnnouncementSearchOpen(false)}
                  className="group flex w-full items-center justify-between rounded-xl p-2.5 text-left transition-all hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="sa-soft sa-soft-border flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border">
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="truncate text-sm font-semibold text-slate-700 dark:text-gray-200">
                        {item.title}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-400">
                        {item.message}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </button>
              ))}
            </div>
          )}
        </div>
      </SearchModal>

      {showComposer && (
        <AnnouncementComposer
          initial={editing}
          businesses={businesses}
          plans={plans}
          homepageFirst={tab === "homepage"}
          onClose={() => {
            setShowComposer(false);
            setEditing(null);
          }}
          onSaved={async () => {
            setShowComposer(false);
            setEditing(null);
            await load();
          }}
        />
      )}
      <ConfirmDeleteModal
        isOpen={!!confirmation}
        onClose={() => setConfirmation(null)}
        title={
          confirmation?.type === "publish"
            ? t("بڵاوکردنەوەی ڕاگەیاندن")
            : t("ئەرشیفکردنی ڕاگەیاندن")
        }
        message={
          confirmation
            ? `${t("دڵنیایت لە")} ${confirmation.type === "publish" ? t("بڵاوکردنەوەی") : t("ئەرشیفکردنی")} «${confirmation.item.title}»؟`
            : ""
        }
        confirmLabel={
          confirmation?.type === "publish" ? t("بڵاوکردنەوە") : t("ئەرشیفکردن")
        }
        loadingLabel={t("جێبەجێکردن...")}
        cancelLabel={t("هەڵوەشاندنەوە")}
        closeLabel={t("داخستن")}
        isDeleting={confirming}
        zIndexClassName="z-[150]"
        tone={confirmation?.type === "publish" ? "accent" : "danger"}
        onConfirm={async () => {
          if (!confirmation) return;
          setConfirming(true);
          try {
            await communicationRequest(
              `/api/platform/communications/announcements/${confirmation.item.id}${confirmation.type === "publish" ? "/publish" : ""}`,
              { method: confirmation.type === "publish" ? "POST" : "DELETE" },
            );
            toast.success(
              confirmation.type === "publish"
                ? t("ڕاگەیاندنەکە بڵاوکرایەوە")
                : t("خرایە ئەرشیف"),
            );
            await load();
          } catch (error) {
            toast.error(
              platformRequestError(error instanceof Error ? error.message : null, t("کردارەکە سەرکەوتوو نەبوو"), locale),
            );
            throw error;
          } finally {
            setConfirming(false);
          }
        }}
      />
    </div>
  );
}

function OverviewTab({
  overview,
  announcements,
  conversations,
  onAnnouncement,
  onConversation,
}: {
  overview: Overview | null;
  announcements: Announcement[];
  conversations: Conversation[];
  onAnnouncement: () => void;
  onConversation: (item: Conversation) => void;
}) {
  const t = useCommunicationText();
  const recentAnnouncements = announcements.slice(0, 4);
  const attention = conversations
    .filter(
      (item) =>
        item.status === "waiting_platform" || (item.unreadCount || 0) > 0,
    )
    .slice(0, 5);
  return (
    <div className="space-y-5">
      {(overview?.announcements.failed || 0) > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          <ShieldAlert className="h-5 w-5" />
          <div>
            <p className="text-sm font-black">{t("گەیاندنی سەرنەکەوتوو هەیە")}</p>
            <p className="text-xs">
              {overview?.announcements.failed} {t("گەیاندن پێویستی بە پێداچوونەوە هەیە.")}
            </p>
          </div>
        </div>
      )}
      <div className="grid divide-y divide-slate-100 border-t border-slate-100 dark:divide-white/5 dark:border-white/5 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <Panel
          title={t("دوایین ڕاگەیاندنەکان")}
          action={
            <button
              onClick={onAnnouncement}
              className="sa-gradient sa-gradient-hover rounded-lg px-3 py-2 text-xs font-bold"
            >
              {t("نوێ دروست بکە")}
            </button>
          }
        >
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {recentAnnouncements.length ? (
              recentAnnouncements.map((item) => (
                <AnnouncementRow key={item.id} item={item} />
              ))
            ) : (
              <Empty label={t("هیچ ڕاگەیاندنێک نییە")} />
            )}
          </div>
        </Panel>
        <Panel
          title={t("پێویستی بە وەڵام")}
          action={
            <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              {attention.length}
            </span>
          }
        >
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {attention.length ? (
              attention.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onConversation(item)}
                  className="flex w-full items-center justify-between gap-3 py-3 text-left"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-slate-700 dark:text-slate-200">
                      {item.businessName}
                    </p>
                    <p className="mt-1 truncate text-[11px] text-slate-500">
                      {item.subject}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              ))
            ) : (
              <Empty label={t("هیچ پەیامێکی چاوەڕوان نییە")} />
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function AnnouncementsTab({
  announcements,
  onEdit,
  onPublish,
}: {
  announcements: Announcement[];
  onEdit: (item: Announcement) => void;
  onPublish: (item: Announcement) => void;
}) {
  const t = useCommunicationText();
  const columns: DataTableColumn<Announcement>[] = [
    {
      id: "announcement",
      header: t("ڕاگەیاندن"),
      cell: (item) => (
        <div className="max-w-sm">
          <p className="font-bold text-slate-700 dark:text-slate-200">
            {item.title}
          </p>
          <p className="mt-1 truncate text-[10px] text-slate-400">
            {item.message}
          </p>
        </div>
      ),
    },
    {
      id: "status",
      header: t("دۆخ"),
      cell: (item) => <StatusBadge status={item.status} />,
    },
    {
      id: "audience",
      header: t("بینەر"),
      cell: (item) =>
        item.audienceType === "all"
          ? t("هەموو بزنسەکان")
          : item.audienceType === "plans"
            ? t("پلانەکان")
            : t("بزنسەکان"),
    },
    {
      id: "delivered",
      header: t("گەیەندراو"),
      cell: (item) => item.deliveredCount,
    },
    { id: "read", header: t("خوێندراوەتەوە"), cell: (item) => item.readCount },
    {
      id: "actions",
      header: t("کردارەکان"),
      cell: (item) =>
        ["draft", "scheduled"].includes(item.status) ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
            >
              {t("دەستکاری")}
            </button>
            <button
              type="button"
              onClick={() => onPublish(item)}
              className="sa-gradient sa-gradient-hover rounded-lg px-3 py-2 text-[11px] font-black"
            >
              {t("بڵاوکردنەوە")}
            </button>
          </div>
        ) : (
          <span className="text-slate-300 dark:text-slate-600">—</span>
        ),
    },
  ];
  return (
    <div>
      <DataTable
        items={announcements}
        columns={columns}
        rowKey={(item) => item.id}
        emptyTitle={t("هیچ ئەنجامێک نەدۆزرایەوە")}
        emptyDescription={t("هیچ داتایەک بۆ پیشاندان نییە.")}
        minWidthClassName="min-w-[880px]"
      />
    </div>
  );
}

function HomepageTab({ announcements }: { announcements: Announcement[] }) {
  const t = useCommunicationText();
  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-2">
        {announcements.length ? (
          announcements.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#1c222b]"
            >
              <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-2 text-[10px] font-bold text-slate-500 dark:border-white/5 dark:bg-white/[0.03]">
                {t("پێشبینین")} •{" "}
                {item.homepagePlacement === "feature_card"
                  ? t("کارتی تایبەتمەندی")
                  : t("بانەری سەرەوە")}
              </div>
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <span className="sa-soft sa-soft-border flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border">
                    <Megaphone className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                      {item.title}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {item.message}
                    </p>
                    {item.ctaLabel && (
                      <span className="mt-3 inline-flex rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-bold text-white dark:bg-white dark:text-slate-900">
                        {item.ctaLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-[10px] text-slate-500 dark:border-white/5">
                <StatusBadge status={item.status} />
                <span>{t("ڕیزبەندی")} {item.homepagePriority || 0}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="lg:col-span-2">
            <Empty label={t("هیچ پەیامێکی ماڵپەڕ نییە")} />
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryTab({
  announcements,
  onArchive,
}: {
  announcements: Announcement[];
  onArchive: (item: Announcement) => void;
}) {
  const t = useCommunicationText();
  const { locale } = usePlatformLocale();
  const dateLocale = platformIntlLocale(locale);
  const columns: DataTableColumn<Announcement>[] = [
    {
      id: "announcement",
      header: t("ڕاگەیاندن"),
      cell: (item) => (
        <div>
          <p className="font-bold text-slate-700 dark:text-slate-200">
            {item.title}
          </p>
          <p className="mt-1 max-w-xs truncate text-[10px] text-slate-400">
            {item.createdByName}
          </p>
        </div>
      ),
    },
    {
      id: "status",
      header: t("دۆخ"),
      cell: (item) => <StatusBadge status={item.status} />,
    },
    {
      id: "delivered",
      header: t("گەیەندراو"),
      cell: (item) => item.deliveredCount,
    },
    { id: "read", header: t("خوێندراوەتەوە"), cell: (item) => item.readCount },
    { id: "channels", header: t("کەناڵ"), cell: (item) => item.channels.length },
    {
      id: "time",
      header: t("کات"),
      className: "text-slate-500 whitespace-nowrap",
      cell: (item) =>
        formatNotificationDate(item.publishedAt || item.publishAt || item.createdAt, dateLocale),
    },
    {
      id: "actions",
      header: t("کردارەکان"),
      cell: (item) =>
        item.status !== "archived" ? (
          <button
            type="button"
            onClick={() => onArchive(item)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5"
            aria-label={t("ئەرشیف")}
          >
            <Archive className="h-4 w-4" />
          </button>
        ) : (
          <span className="text-slate-300 dark:text-slate-600">—</span>
        ),
    },
  ];
  return (
    <DataTable
      items={announcements}
      columns={columns}
      rowKey={(item) => item.id}
      emptyTitle={t("هیچ مێژوویەک نییە")}
      emptyDescription={t("هیچ داتایەک بۆ پیشاندان نییە.")}
      minWidthClassName="min-w-[880px]"
    />
  );
}

function MessagesTab({
  conversations,
  selected,
  onSelect,
  onRefresh,
  onSelectedChange,
}: {
  conversations: Conversation[];
  selected: Conversation | null;
  onSelect: (item: Conversation) => void;
  onRefresh: () => Promise<void>;
  onSelectedChange: (item: Conversation | null) => void;
}) {
  const t = useCommunicationText();
  const { locale } = usePlatformLocale();
  const dateLocale = platformIntlLocale(locale);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ block: "end" });
  }, [selected?.id, selected?.messages?.length]);
  const send = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      const detail = await communicationRequest<Conversation>(
        `/api/platform/communications/conversations/${selected.id}/messages`,
        { method: "POST", body: JSON.stringify({ message: reply }) },
      );
      setReply("");
      onSelectedChange(detail);
      await onRefresh();
      requestAnimationFrame(() => replyRef.current?.focus());
    } catch (error) {
      toast.error(
        platformRequestError(error instanceof Error ? error.message : null, t("ناردن سەرکەوتوو نەبوو"), locale),
      );
    } finally {
      setSending(false);
    }
  };
  const updateStatus = async (status: string) => {
    if (!selected) return;
    try {
      await communicationRequest(
        `/api/platform/communications/conversations/${selected.id}`,
        { method: "PATCH", body: JSON.stringify({ status }) },
      );
      const detail = await communicationRequest<Conversation>(
        `/api/platform/communications/conversations/${selected.id}`,
      );
      onSelectedChange(detail);
      await onRefresh();
      toast.success(t("دۆخی گفتوگۆ نوێکرایەوە"));
    } catch (error) {
      toast.error(
        platformRequestError(error instanceof Error ? error.message : null, t("نوێکردنەوە سەرکەوتوو نەبوو"), locale),
      );
    }
  };
  return (
    <div className="grid h-[clamp(32rem,68vh,44rem)] min-h-0 min-w-0 overflow-hidden border-t border-slate-100 dark:border-white/5 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <div
        className={`${selected ? "hidden lg:flex" : "flex"} min-h-0 min-w-0 flex-col border-r border-slate-200 dark:border-white/10`}
      >
        <div className="shrink-0 border-b border-slate-100 px-4 py-3.5 dark:border-white/5">
          <h3 className="text-sm font-black text-slate-700 dark:text-slate-200">
            {t("پەیامەکان")}
          </h3>
          <p className="mt-1 text-[10px] text-slate-400">
            {conversations.length} {t("گفتوگۆ")}
          </p>
        </div>
        <div className="custom-scrollbar brand-custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {conversations.length ? (
            conversations.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className={`w-full min-w-0 border-b p-4 text-left transition ${selected?.id === item.id ? "sa-soft sa-soft-border" : "border-slate-100 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/[0.03]"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-xs font-black text-slate-700 dark:text-slate-200">
                    {item.businessName}
                  </p>
                  {!!item.unreadCount && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
                      {item.unreadCount}
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">
                  {item.subject}
                </p>
                <p className="mt-1 truncate text-[10px] text-slate-400">
                  {item.lastMessage}
                </p>
              </button>
            ))
          ) : (
            <Empty label={t("هیچ گفتوگۆیەک نییە")} />
          )}
        </div>
      </div>
      <div
        className={`${selected ? "flex" : "hidden lg:flex"} min-h-0 min-w-0 overflow-hidden flex-col`}
      >
        {selected ? (
          <>
            <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-white/5">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  onClick={() => onSelectedChange(null)}
                  className="lg:hidden"
                >
                  <ChevronRight className="h-5 w-5 rotate-180" />
                </button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-700 dark:text-slate-200">
                    {selected.subject}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {selected.businessName} • {conversationCategoryLabel(selected.category, locale)}
                  </p>
                </div>
              </div>
              <CustomSelect
                label={t("دۆخی گفتوگۆ")}
                hideLabel
                value={selected.status}
                onChange={(value) => void updateStatus(value)}
                options={[
                  { value: "open", label: t("کراوە") },
                  { value: "waiting_business", label: t("چاوەڕێی بزنس") },
                  { value: "waiting_platform", label: t("چاوەڕێی پلاتفۆرم") },
                  { value: "resolved", label: t("چارەسەرکراو") },
                  { value: "archived", label: t("ئەرشیف") },
                ]}
                fullWidth={false}
                triggerClassName="h-9 min-w-36 text-[10px]"
              />
            </div>
            <div className="custom-scrollbar brand-custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-slate-50/50 p-4 dark:bg-black/10 sm:p-5">
              {selected.messages?.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderType === "platform-admin" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[88%] overflow-hidden rounded-2xl px-4 py-3 shadow-sm sm:max-w-[76%] ${message.senderType === "platform-admin" ? "sa-gradient rounded-br-md" : "rounded-bl-md border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-[#1c222b] dark:text-slate-200"}`}
                  >
                    <p className="text-[10px] font-black opacity-70">
                      {message.senderName}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 [overflow-wrap:anywhere]">
                      {message.body}
                    </p>
                    <p className="mt-1 text-[9px] opacity-60">
                      {formatNotificationDate(message.createdAt, dateLocale)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messageEndRef} />
            </div>
            <div className="shrink-0 border-t border-slate-100 bg-white p-3 dark:border-white/5 dark:bg-[#161B22] sm:p-4">
              {["resolved", "archived"].includes(selected.status) ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-center text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                  {t("ئەم گفتوگۆیە داخراوە")}
                </p>
              ) : (
                <ChatComposer
                  ref={replyRef}
                  value={reply}
                  onChange={setReply}
                  onSubmit={() => void send()}
                  placeholder={t("وەڵام بنووسە... (Enter بۆ ناردن، Shift+Enter بۆ دێڕی نوێ)")}
                  sendLabel={t("ناردن")}
                  sending={sending}
                />
              )}
            </div>
          </>
        ) : (
          <Empty label={t("گفتوگۆیەک هەڵبژێرە")} />
        )}
      </div>
    </div>
  );
}

function AnnouncementComposer({
  initial,
  businesses,
  plans,
  homepageFirst,
  onClose,
  onSaved,
}: {
  initial: Announcement | null;
  businesses: BusinessOption[];
  plans: PlanOption[];
  homepageFirst: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const t = useCommunicationText();
  const { locale } = usePlatformLocale();
  const [form, setForm] = useState(() =>
    initial
      ? {
          ...initialForm,
          title: initial.title,
          message: initial.message,
          announcementType: initial.announcementType,
          priority: initial.priority,
          audienceType: initial.audienceType,
          audienceValues: initial.audienceFilter?.values || [],
          channels: initial.channels,
          ctaLabel: initial.ctaLabel || "",
          ctaUrl: initial.ctaUrl || "",
          publishAt: initial.publishAt ? toLocalInput(initial.publishAt) : "",
          expiresAt: initial.expiresAt ? toLocalInput(initial.expiresAt) : "",
          homepagePlacement: initial.homepagePlacement || "top_banner",
          homepagePriority: initial.homepagePriority || 0,
          homepageDismissible: initial.homepageDismissible !== false,
        }
      : {
          ...initialForm,
          channels: homepageFirst ? ["homepage"] : ["business_bell"],
        },
  );
  const [saving, setSaving] = useState(false);
  const toggleValue = (key: "audienceValues" | "channels", value: string) =>
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  const save = async (publishNow: boolean) => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error(t("ناونیشان و پەیام پێویستن"));
      return;
    }
    if (!form.channels.length) {
      toast.error(t("لانیکەم یەک کەناڵ هەڵبژێرە"));
      return;
    }
    if (form.audienceType !== "all" && !form.audienceValues.length) {
      toast.error(t("لانیکەم یەک بینەر هەڵبژێرە"));
      return;
    }
    if (
      form.publishAt &&
      form.expiresAt &&
      new Date(form.expiresAt) <= new Date(form.publishAt)
    ) {
      toast.error(t("کاتی کۆتایی دەبێت دوای کاتی بڵاوکردنەوە بێت"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        publishAt: form.publishAt
          ? new Date(form.publishAt).toISOString()
          : undefined,
        expiresAt: form.expiresAt
          ? new Date(form.expiresAt).toISOString()
          : undefined,
      };
      const saved = await communicationRequest<Announcement>(
        initial
          ? `/api/platform/communications/announcements/${initial.id}`
          : "/api/platform/communications/announcements",
        { method: initial ? "PUT" : "POST", body: JSON.stringify(payload) },
      );
      if (publishNow && saved.status !== "scheduled")
        await communicationRequest(
          `/api/platform/communications/announcements/${saved.id}/publish`,
          { method: "POST" },
        );
      toast.success(
        publishNow
          ? t("ڕاگەیاندنەکە بڵاوکرایەوە")
          : saved.status === "scheduled"
            ? t("ڕاگەیاندنەکە ڕێکخرا")
            : t("ڕەشنووسەکە پاشەکەوتکرا"),
      );
      await onSaved();
    } catch (error) {
      toast.error(
        platformRequestError(error instanceof Error ? error.message : null, t("پاشەکەوتکردن سەرکەوتوو نەبوو"), locale),
      );
    } finally {
      setSaving(false);
    }
  };
  const audienceOptions =
    form.audienceType === "plans"
      ? plans.map((item) => ({ value: item.code, label: item.name }))
      : businesses.map((item) => ({ value: item.id, label: item.name }));
  return (
    <ManagementModal
      isOpen
      onClose={onClose}
      title={t(initial ? "دەستکاری ڕاگەیاندن" : "ڕاگەیاندنی نوێ")}
      description={t("بینەر، کەناڵ و کاتی بڵاوکردنەوە بە وردی دیاری بکە.")}
      wide
      busy={saving}
      createBusinessStyle
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-11 w-full rounded-xl border border-slate-100 bg-linear-to-br from-slate-50 to-gray-50 px-5 text-sm font-medium text-slate-600 shadow-sm transition hover:from-slate-100 hover:to-gray-100 disabled:opacity-50 dark:border-white/10 dark:from-white/5 dark:to-white/5 dark:text-slate-300 sm:flex-1"
          >
            {t("هەڵوەشاندنەوە")}
          </button>
          <button
            type="button"
            onClick={() => void save(false)}
            disabled={saving}
            className="h-11 w-full rounded-xl border border-slate-100 bg-linear-to-br from-slate-50 to-gray-50 px-5 text-sm font-semibold text-slate-600 shadow-sm transition hover:from-slate-100 hover:to-gray-100 disabled:opacity-50 dark:border-white/10 dark:from-white/5 dark:to-white/5 dark:text-slate-300 sm:flex-1"
          >
            {form.publishAt && new Date(form.publishAt) > new Date()
              ? t("ڕێکخستن")
              : t("پاشەکەوتی ڕەشنووس")}
          </button>
          <button
            type="button"
            onClick={() => void save(true)}
            disabled={
              saving ||
              !!(form.publishAt && new Date(form.publishAt) > new Date())
            }
            className="sa-gradient sa-gradient-hover flex h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold shadow-lg disabled:opacity-50 sm:flex-1"
          >
            {saving ? (
              <MotionSpinner><Loader2 className="h-4 w-4 "  /></MotionSpinner>
            ) : (
              <Send className="h-4 w-4" />
            )}
            {t("بڵاوکردنەوەی ئێستا")}
          </button>
        </>
      }
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <FormSection
          title={t("ناوەڕۆکی ڕاگەیاندن")}
          description={t("ناونیشان و پەیامێکی کورت و ڕوون بنووسە.")}
        >
          <div className="contents">
            <Field label={t("ناونیشان")}>
              <input
                className={inputClass}
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                placeholder={t("ناونیشانی ڕاگەیاندن بنووسە")}
                maxLength={160}
              />
            </Field>
            <CustomSelect
              label={t("جۆری ڕاگەیاندن")}
              value={form.announcementType}
              onChange={(value) =>
                setForm({ ...form, announcementType: value })
              }
              options={[
                { value: "general", label: t("گشتی") },
                { value: "feature", label: t("تایبەتمەندی نوێ") },
                { value: "maintenance", label: t("چاکسازی") },
                { value: "billing", label: t("پارەدان") },
                { value: "security", label: t("ئاسایش") },
                { value: "urgent", label: t("پەلەدار") },
              ]}
              triggerClassName="h-11"
            />
            <div className="sm:col-span-2">
              <Field label={t("پەیام")}>
                <textarea
                  className={`${inputClass} h-32 resize-y py-3`}
                  rows={5}
                  value={form.message}
                  onChange={(event) =>
                    setForm({ ...form, message: event.target.value })
                  }
                  placeholder={t("دەقی پەیامەکە بە ڕوونی بنووسە")}
                  maxLength={5000}
                />
              </Field>
            </div>
            <CustomSelect
              label={t("گرنگی")}
              value={form.priority}
              onChange={(value) => setForm({ ...form, priority: value })}
              options={[
                { value: "normal", label: t("ئاسایی") },
                { value: "important", label: t("گرنگ") },
                { value: "critical", label: t("زۆر گرنگ") },
              ]}
              triggerClassName="h-11"
            />
          </div>
        </FormSection>
        <FormSection
          title={t("بینەر و کەناڵەکان")}
          description={t("دیاری بکە کێ پەیامەکە دەبینێت و لە کوێ پیشان دەدرێت.")}
        >
          <div className="contents">
            <CustomSelect
              label={t("بینەر")}
              value={form.audienceType}
              onChange={(value) =>
                setForm({ ...form, audienceType: value, audienceValues: [] })
              }
              options={[
                { value: "all", label: t("هەموو بزنسە چالاکەکان") },
                { value: "plans", label: t("پلانە دیاریکراوەکان") },
                { value: "businesses", label: t("بزنسە دیاریکراوەکان") },
              ]}
              triggerClassName="h-11"
            />
            {form.audienceType !== "all" && (
              <div className="sm:col-span-2">
                <Field label={t("هەڵبژاردنی بینەر")}>
                  <div className="grid max-h-44 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-3 dark:border-white/10 sm:grid-cols-2">
                    {audienceOptions.map((item) => (
                      <CheckboxField
                        key={item.value}
                        compact
                        checked={form.audienceValues.includes(item.value)}
                        onChange={() =>
                          toggleValue("audienceValues", item.value)
                        }
                        label={item.label}
                      />
                    ))}
                  </div>
                </Field>
              </div>
            )}
            <div className="sm:col-span-2">
              <Field label={t("کەناڵەکانی گەیاندن")}>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      value: "business_bell",
                      label: t("زەنگی بزنس"),
                      description: t("لە لیستی ئاگادارییەکانی بزنس دەردەکەوێت"),
                    },
                    {
                      value: "dashboard_banner",
                      label: t("بانەری داشبۆرد"),
                      description: t("لە سەرەوەی داشبۆردی بزنس پیشان دەدرێت"),
                    },
                    {
                      value: "homepage",
                      label: t("ماڵپەڕ"),
                      description: t("لە ماڵپەڕی گشتی پیشان دەدرێت"),
                    },
                  ].map((item) => (
                    <CheckboxField
                      key={item.value}
                      checked={form.channels.includes(item.value)}
                      onChange={() => toggleValue("channels", item.value)}
                      label={item.label}
                      description={item.description}
                    />
                  ))}
                </div>
              </Field>
            </div>
          </div>
        </FormSection>
        <FormSection
          title={t("دوگمە و کاتبەندی")}
          description={t("بەستەری کردار و ماوەی پیشاندانی ڕاگەیاندنەکە دیاری بکە.")}
        >
          <div className="contents">
            <Field label={t("دەقی دوگمە")}>
              <input
                className={inputClass}
                value={form.ctaLabel}
                onChange={(event) =>
                  setForm({ ...form, ctaLabel: event.target.value })
                }
                placeholder={t("بۆ نموونە: زیاتر بزانە")}
              />
            </Field>
            <Field label={t("بەستەری دوگمە")}>
              <input
                className={inputClass}
                value={form.ctaUrl}
                onChange={(event) =>
                  setForm({ ...form, ctaUrl: event.target.value })
                }
                placeholder={t("بەستەر بنووسە؛ بۆ نموونە /business")}
                dir="auto"
              />
            </Field>
            <DateTimeInput
              locale={locale}
              label={t("کاتی بڵاوکردنەوە")}
              value={form.publishAt}
              onChange={(value) => setForm({ ...form, publishAt: value })}
              min={toLocalInput(new Date().toISOString())}
              hint={t("بە بەتاڵی جێبهێڵە بۆ پاشەکەوتکردن و بڵاوکردنەوەی دواتر.")}
            />
            <DateTimeInput
              locale={locale}
              label={t("کاتی کۆتایی")}
              value={form.expiresAt}
              onChange={(value) => setForm({ ...form, expiresAt: value })}
              min={form.publishAt || toLocalInput(new Date().toISOString())}
              hint={t("بە بەتاڵی جێبهێڵە ئەگەر کاتی کۆتایی نییە.")}
            />
          </div>
        </FormSection>
        {form.channels.includes("homepage") && (
          <FormSection
            title={t("ڕێکخستنی ماڵپەڕ")}
            description={t("شوێن و ڕیزبەندی پیشاندانی ناوەڕۆکەکە لە ماڵپەڕ دیاری بکە.")}
          >
            <div className="contents">
              <CustomSelect
                label={t("شوێنی ماڵپەڕ")}
                value={form.homepagePlacement}
                onChange={(value) =>
                  setForm({ ...form, homepagePlacement: value })
                }
                options={[
                  { value: "top_banner", label: t("بانەری سەرەوە") },
                  { value: "feature_card", label: t("کارتی تایبەتمەندی") },
                ]}
                triggerClassName="h-11"
              />
              <Field label={t("ڕیزبەندی")}>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={form.homepagePriority}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      homepagePriority: Number(event.target.value),
                    })
                  }
                  placeholder={t("ڕیزبەندی پیشاندان بنووسە")}
                />
              </Field>
              <div className="sm:col-span-2">
                <CheckboxField
                  checked={form.homepageDismissible}
                  onChange={(checked) =>
                    setForm({ ...form, homepageDismissible: checked })
                  }
                  label={t("ڕێگەدان بە داخستن")}
                  description={t("بەکارهێنەر دەتوانێت بانەرەکە لە ماڵپەڕ دابخات.")}
                />
              </div>
            </div>
          </FormSection>
        )}
      </div>
    </ManagementModal>
  );
}

function AnnouncementRow({ item }: { item: Announcement }) {
  const t = useCommunicationText();
  const { locale } = usePlatformLocale();
  const dateLocale = platformIntlLocale(locale);
  return (
    <div className="flex min-w-0 flex-1 items-start gap-3 py-3">
      <div className="sa-soft sa-soft-border flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border">
        <Megaphone className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-xs font-black text-slate-700 dark:text-slate-200">
            {item.title}
          </p>
          <StatusBadge status={item.status} />
        </div>
        <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">
          {item.message}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[9px] text-slate-400">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {item.deliveredCount} {t("گەیەندراو")}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {item.readCount} {t("خوێندراوەتەوە")}
          </span>
          <span className="flex items-center gap-1">
            <Clock3 className="h-3 w-3" />
            {formatNotificationDate(item.publishedAt || item.publishAt || item.createdAt, dateLocale)}
          </span>
        </div>
      </div>
    </div>
  );
}
function StatusBadge({ status }: { status: Announcement["status"] }) {
  const t = useCommunicationText();
  const styles: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
    scheduled:
      "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300",
    published:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    expired:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    archived: "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400",
  };
  const labels: Record<string, string> = {
    draft: "ڕەشنووس",
    scheduled: "ڕێکخراو",
    published: "بڵاوکراوە",
    expired: "بەسەرچوو",
    archived: "ئەرشیف",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[9px] font-black ${styles[status]}`}
    >
      {t(labels[status])}
    </span>
  );
}
function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden py-4 lg:px-5">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 dark:border-white/5 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-black text-slate-700 dark:text-slate-200">
          {title}
        </h3>
        {action}
      </div>
      <div className="px-5">{children}</div>
    </section>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
        {label}
      </span>
      {children}
    </label>
  );
}
function FormSection({
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return children;
}
function Empty({ label }: { label: string }) {
  const t = useCommunicationText();
  return (
    <EmptyState compact icon={Inbox} title={label} description={t("هەر کات داتای نوێ زیاد بکرێت، لێرە پیشان دەدرێت.")} />
  );
}
function toLocalInput(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}
