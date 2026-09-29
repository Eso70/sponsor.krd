"use client";

import { MotionSpinner } from "@/components/motion/MotionPrimitives";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Building2,
  CreditCard,
  Eye,
  Layers3,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal";
import {
  CustomSelect,
  type CustomSelectOption,
} from "@/components/shared/CustomSelect";
import { DetailViewModal } from "@/components/shared/DetailViewModal";
import { EmptyState } from "@/components/shared/EmptyState";
import { ModalWizardActions } from "@/components/shared/ModalWizardActions";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchModal } from "@/components/shared/SearchModal";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import { TablePagination } from "@/components/shared/TablePagination";
import { useModalKeyboard } from "@/hooks/useModalKeyboard";
import { StatCard } from "@/components/shared/StatCard";
import { Tooltip } from "@/components/shared/Tooltip";
import { SkeletonStatCards } from "@/components/shared/Skeleton";
import { RequiredMark } from "@/components/shared/RequiredMark";
import { modalInputClass } from "@/features/link-editor/modal-input-styles";
import { StatCardGrid } from "@/components/shared/StatCardGrid";
import { usePlatformLocale } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { platformLoadingCopy } from "@/features/platform-admin/i18n/loading-copy";
import { billingText, useBillingText } from "./use-billing-text";
import type { PlatformLocale } from "@/features/platform-admin/i18n/locale";
import { platformRequestError } from "@/features/platform-admin/i18n/request-error";

type Tab = "plans" | "businesses";
type PlanStatus = "active" | "inactive" | "archived";
type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "grace_period"
  | "paused"
  | "canceled"
  | "expired"
  | "incomplete";
type PlanSort = "displayOrder" | "nameAsc" | "newest" | "subscribers";
type BusinessSort = "nameAsc" | "recentlyUpdated" | "planName";

interface PermissionProfile {
  id: string;
  code: string;
  name: string;
  permissionCount: number;
}
interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description: string;
  permissionProfileId: string;
  permissionProfileName: string;
  status: PlanStatus;
  currency: string;
  yearlyPriceMinor: number;
  trialDays: number;
  displayOrder: number;
  isDefault: boolean;
  subscriberCount: number;
  createdAt: string;
  updatedAt: string;
}

interface BusinessOption {
  id: string;
  name: string;
  username: string;
  status: string;
}

interface BusinessSubscription {
  id: string;
  businessId: string;
  businessName: string;
  username: string;
  businessStatus: string;
  planId: string;
  planName: string;
  permissionProfileId: string;
  permissionProfileName: string;
  status: SubscriptionStatus;
  startsAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string | null;
  updatedAt: string;
}

interface BillingOverview {
  plans: SubscriptionPlan[];
  permissionProfiles: PermissionProfile[];
  subscriptions: BusinessSubscription[];
  businesses: BusinessOption[];
  summary: {
    activePlans: number;
    activeSubscriptions: number;
    attentionRequired: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface BusinessRow extends BusinessOption {
  subscription: BusinessSubscription | null;
}

const tabs = [
  { id: "plans" as const, label: "پلانەکان", icon: Layers3 },
  { id: "businesses" as const, label: "بزنسەکان", icon: Building2 },
];

const planStatusOptions: Array<{ value: PlanStatus; label: string }> = [
  { value: "active", label: "چالاک" },
  { value: "inactive", label: "ناچالاک" },
  { value: "archived", label: "ئەرشیفکراو" },
];

const subscriptionStatusOptions: Array<{
  value: SubscriptionStatus;
  label: string;
}> = [
  { value: "active", label: "چالاک" },
  { value: "trialing", label: "تاقیکردنەوە" },
  { value: "grace_period", label: "ماوەی ڕێگەپێدان" },
  { value: "past_due", label: "پارەدان دواکەوتووە" },
  { value: "paused", label: "ڕاگیراو" },
  { value: "incomplete", label: "ناتەواو" },
  { value: "canceled", label: "هەڵوەشێنراوەتەوە" },
  { value: "expired", label: "بەسەرچووە" },
];

const planSortOptions: CustomSelectOption<PlanSort>[] = [
  { value: "displayOrder", label: "ڕیزبەندی پلان" },
  { value: "nameAsc", label: "ناو: أ ب پ" },
  { value: "newest", label: "نوێترین یەکەم" },
  { value: "subscribers", label: "زۆرترین بەشداربوو" },
];

const businessSortOptions: CustomSelectOption<BusinessSort>[] = [
  { value: "nameAsc", label: "ناو: أ ب پ" },
  { value: "recentlyUpdated", label: "دوایین نوێکردنەوە" },
  { value: "planName", label: "ناوی پلان" },
];

function planStatusLabel(status: PlanStatus, locale: PlatformLocale) {
  return billingText(
    planStatusOptions.find((option) => option.value === status)?.label || status
  , locale);
}

function subscriptionStatusLabel(status: SubscriptionStatus | undefined, locale: PlatformLocale) {
  if (!status) return billingText("دیاری نەکراوە", locale);
  return billingText(
    subscriptionStatusOptions.find((option) => option.value === status)
      ?.label || status
  , locale);
}

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value / 100);
  } catch {
    return `${(value / 100).toFixed(2)} ${currency}`;
  }
}

function formatDate(value: string | null | undefined, locale: PlatformLocale = "ckb") {
  if (!value) return billingText("دیاری نەکراوە", locale);
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? billingText("دیاری نەکراوە", locale)
    : date.toLocaleString(locale === "ar" ? "ar-IQ" : locale === "en" ? "en-IQ" : "ckb-IQ");
}

function StatusBadge({
  status,
  type,
}: {
  status: PlanStatus | SubscriptionStatus | "unassigned";
  type: "plan" | "subscription";
}) {
  const { locale } = usePlatformLocale();
  const critical = ["past_due", "expired", "incomplete", "archived"].includes(
    status,
  );
  const warning = ["trialing", "grace_period", "paused", "inactive"].includes(
    status,
  );
  const label =
    status === "unassigned"
      ? billingText("پلان دیاری نەکراوە", locale)
      : type === "plan"
        ? planStatusLabel(status as PlanStatus, locale)
        : subscriptionStatusLabel(status as SubscriptionStatus, locale);
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold ${
        status === "unassigned"
          ? "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5"
          : critical
            ? "border-red-200 bg-red-50 text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300"
            : warning
              ? "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300"
              : "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
      }`}
    >
      {label}
    </span>
  );
}

export function BillingPage() {
  const t = useBillingText();
  const { locale } = usePlatformLocale();
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);
  const [tab, setTab] = useState<Tab>("plans");
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [planModal, setPlanModal] = useState<
    SubscriptionPlan | "create" | null
  >(null);
  const [viewPlan, setViewPlan] = useState<SubscriptionPlan | null>(null);
  const [deletePlan, setDeletePlan] = useState<SubscriptionPlan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewBusiness, setViewBusiness] = useState<BusinessRow | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [planSearch, setPlanSearch] = useState("");
  const [planStatusFilter, setPlanStatusFilter] = useState("all");
  const [planSort, setPlanSort] = useState<PlanSort>("displayOrder");
  const [businessSearch, setBusinessSearch] = useState("");
  const [businessPlanFilter, setBusinessPlanFilter] = useState("all");
  const [businessStatusFilter, setBusinessStatusFilter] = useState("all");
  const [businessSort, setBusinessSort] = useState<BusinessSort>("nameAsc");
  const [businessPage, setBusinessPage] = useState(1);
  const deferredPlanSearch = useDeferredValue(
    planSearch.trim().toLocaleLowerCase(),
  );
  const load = useCallback(
    async (quiet = false) => {
      if (quiet) setRefreshing(true);
      else setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(businessPage),
          limit: "10",
        });
        if (businessSearch.trim()) params.set("search", businessSearch.trim());
        const unassigned =
          businessPlanFilter === "unassigned" ||
          businessStatusFilter === "unassigned";
        if (unassigned) params.set("status", "unassigned");
        else if (businessStatusFilter !== "all") {
          params.set("status", businessStatusFilter);
        }
        if (
          businessPlanFilter !== "all" &&
          businessPlanFilter !== "unassigned"
        ) {
          params.set("planId", businessPlanFilter);
        }
        const response = await fetch(`/api/platform/billing?${params}`, {
          credentials: "include",
          cache: "no-store",
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            platformRequestError(result.message, tRef.current("بارکردنی بەشداربوونەکان سەرکەوتوو نەبوو"), locale),
          );
        }
        setOverview(result.data);
      } catch (error) {
        toast.error(
          platformRequestError(error instanceof Error ? error.message : null, tRef.current("بارکردنی بەشداربوونەکان سەرکەوتوو نەبوو"), locale),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [businessPage, businessPlanFilter, businessSearch, businessStatusFilter, locale],
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void load());
    return () => window.cancelAnimationFrame(frame);
  }, [load]);

  const businessRows = useMemo<BusinessRow[]>(() => {
    const byBusiness = new Map(
      (overview?.subscriptions || []).map((subscription) => [
        subscription.businessId,
        subscription,
      ]),
    );
    return (overview?.businesses || []).map((business) => ({
      ...business,
      subscription: byBusiness.get(business.id) || null,
    }));
  }, [overview]);

  const filteredPlans = useMemo(() => {
    const plans = (overview?.plans || []).filter((plan) => {
      const text =
        `${plan.name} ${plan.code} ${plan.description} ${plan.permissionProfileName}`.toLocaleLowerCase();
      return (
        (!deferredPlanSearch || text.includes(deferredPlanSearch)) &&
        (planStatusFilter === "all" || plan.status === planStatusFilter)
      );
    });

    return [...plans].sort((left, right) => {
      if (planSort === "nameAsc") return left.name.localeCompare(right.name);
      if (planSort === "newest") {
        return Date.parse(right.createdAt) - Date.parse(left.createdAt);
      }
      if (planSort === "subscribers") {
        return right.subscriberCount - left.subscriberCount;
      }
      return left.displayOrder - right.displayOrder;
    });
  }, [deferredPlanSearch, overview?.plans, planSort, planStatusFilter]);

  const filteredBusinesses = useMemo(() => {
    const businesses = businessRows;
    return [...businesses].sort((left, right) => {
      if (businessSort === "recentlyUpdated") {
        return (
          (Date.parse(right.subscription?.updatedAt || "") || 0) -
          (Date.parse(left.subscription?.updatedAt || "") || 0)
        );
      }
      if (businessSort === "planName") {
        return (left.subscription?.planName || "").localeCompare(
          right.subscription?.planName || "",
        );
      }
      return left.name.localeCompare(right.name);
    });
  }, [businessRows, businessSort]);

  const pageSize = overview?.pagination.limit || 10;
  const totalBusinessPages = overview?.pagination.totalPages || 1;
  const currentBusinessPage = overview?.pagination.page || businessPage;
  const pagedBusinesses = filteredBusinesses;

  const confirmDeletePlan = async () => {
    if (!deletePlan || isDeleting) return;
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/platform/billing/subscription-plans/${deletePlan.id}`,
        { method: "DELETE", credentials: "include" },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(
          response.status === 409
            ? t("پلانی بنەڕەتی یان پلانێک کە بزنسی پێوە بەستراوە ناتوانرێت بسڕدرێتەوە.")
            : platformRequestError(result.message, t("سڕینەوەی پلان سەرکەوتوو نەبوو"), locale),
        );
        throw new Error(result.message || "Delete failed");
      }
      toast.success(t("پلانی بەشداربوون سڕایەوە"));
      await load(true);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && !overview) {
    return (
      <div className="min-h-[55vh] py-4">
        <SkeletonStatCards count={3} className="sm:grid-cols-3" loadingLabel={platformLoadingCopy[locale].loading} />
      </div>
    );
  }

  return (
    <div className="space-y-5" dir="ltr">
      <StatCardGrid columns={3}>
        <StatCard
          icon={Layers3}
          label={t("پلانە چالاکەکان")}
          value={overview?.summary.activePlans || 0}
          color="green"
        />
        <StatCard
          icon={UsersRound}
          label={t("بەشداربوونی چالاک")}
          value={overview?.summary.activeSubscriptions || 0}
          color="blue"
        />
        <StatCard
          icon={AlertTriangle}
          label={t("پێویستی بە سەرنجدان")}
          value={overview?.summary.attentionRequired || 0}
          color="orange"
        />
      </StatCardGrid>

      <SegmentedTabs
        tabs={tabs.map((item) => ({ ...item, label: t(item.label) }))}
        value={tab}
        onChange={(value) => {
          setTab(value);
          setSearchOpen(false);
        }}
        accent="var(--sponsor-krd-accent)"
      />

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1c222b] sm:p-6">
        <PageHeader
          title={
            tab === "plans" ? t("پلانەکانی بەشداربوون") : t("بزنس و بەشداربوونەکان")
          }
          description={
            tab === "plans"
              ? t("پلان، نرخ، ماوە و پڕۆفایلی مۆڵەتی هەر پلانێک بەڕێوە ببە.")
              : t("پلانی دیاریکراو، دۆخی بەشداربوون و ماوەی هەر بزنسێک بەڕێوە ببە.")
          }
          icon={tab === "plans" ? Layers3 : Building2}
          action={
            <>
              <button
                type="button"
                onClick={() => void load(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10"
                aria-label={t("نوێکردنەوە")}
              >
                <MotionSpinner active={refreshing}>
                  <RefreshCw className="h-4 w-4" />
                </MotionSpinner>
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {t("گەڕان")}
              </button>
              {tab === "plans" && (
                <button
                  type="button"
                  onClick={() => setPlanModal("create")}
                  className="sa-gradient sa-gradient-hover flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-bold shadow-md"
                >
                  <Plus className="h-4 w-4" />
                  {t("پلانی نوێ")}
                </button>
              )}
            </>
          }
        />

        <div className="border-t border-slate-100 pt-5 dark:border-white/5">
          {tab === "plans" ? (
            <PlansTable
              plans={filteredPlans}
              onView={setViewPlan}
              onEdit={setPlanModal}
              onDelete={(plan) => {
                if (plan.isDefault) {
                  toast.error(t("پلانی بنەڕەتی ناتوانرێت بسڕدرێتەوە."));
                  return;
                }
                if (plan.subscriberCount > 0) {
                  toast.error(
                    t("ئەم پلانە لەلایەن بزنسێکەوە بەکاردێت و ناتوانرێت بسڕدرێتەوە."),
                  );
                  return;
                }
                setDeletePlan(plan);
              }}
            />
          ) : (
            <>
              <BusinessesSubscriptionsTable
                businesses={pagedBusinesses}
                onView={setViewBusiness}
              />
              <TablePagination
                page={currentBusinessPage}
                pageSize={pageSize}
                totalItems={overview?.pagination.total || 0}
                totalPages={totalBusinessPages}
                onPageChange={setBusinessPage}
                copy={{ of: t("لە"), previous: t("پەڕەی پێشوو"), next: t("پەڕەی دواتر") }}
              />
            </>
          )}
        </div>
      </section>

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        wide
        placeholder={
          tab === "plans"
            ? t("گەڕان بە ناو، کۆد یان پڕۆفایلی مۆڵەت...")
            : t("گەڕان بە ناو، ناوی بەکارهێنەر یان پلان...")
        }
        clearLabel={t("پاککردنەوە")}
        applyLabel={t("داخستن")}
        clearAriaLabel={t("پاککردنەوە")}
        applyAriaLabel={t("داخستن")}
        searchQuery={tab === "plans" ? planSearch : businessSearch}
        onSearchQueryChange={(value) => {
          if (tab === "plans") {
            setPlanSearch(value);
          } else {
            setBusinessSearch(value);
            setBusinessPage(1);
          }
        }}
      >
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {t("فلتەر و ڕیزبەندی")}
            </p>
            {(tab === "plans"
              ? !!planSearch ||
                planStatusFilter !== "all" ||
                planSort !== "displayOrder"
              : !!businessSearch ||
                businessPlanFilter !== "all" ||
                businessStatusFilter !== "all" ||
                businessSort !== "nameAsc") && (
              <button
                type="button"
                onClick={() => {
                  if (tab === "plans") {
                    setPlanSearch("");
                    setPlanStatusFilter("all");
                    setPlanSort("displayOrder");
                  } else {
                    setBusinessSearch("");
                    setBusinessPlanFilter("all");
                    setBusinessStatusFilter("all");
                    setBusinessSort("nameAsc");
                    setBusinessPage(1);
                  }
                }}
                className="flex items-center gap-1 text-[10px] font-bold text-red-500 transition hover:text-red-600"
              >
                <X className="h-3.5 w-3.5" />
                {t("پاککردنەوە")}
              </button>
            )}
          </div>

          {tab === "plans" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <CustomSelect
                label={t("دۆخی پلان")}
                value={planStatusFilter}
                options={[
                  { value: "all", label: t("هەموو دۆخەکان") },
                  ...planStatusOptions.map((option) => ({ ...option, label: t(option.label) })),
                ]}
                onChange={setPlanStatusFilter}
              />
              <CustomSelect
                label={t("ڕیزبەندی")}
                value={planSort}
                options={planSortOptions.map((option) => ({ ...option, label: t(option.label) }))}
                onChange={setPlanSort}
              />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <CustomSelect
                label={t("پلانی بەشداربوون")}
                value={businessPlanFilter}
                options={[
                  { value: "all", label: t("هەموو پلانەکان") },
                  { value: "unassigned", label: t("بێ پلان") },
                  ...(overview?.plans || []).map((plan) => ({
                    value: plan.id,
                    label: plan.name,
                  })),
                ]}
                onChange={(value) => {
                  setBusinessPlanFilter(value);
                  setBusinessPage(1);
                }}
              />
              <CustomSelect
                label={t("دۆخی بەشداربوون")}
                value={businessStatusFilter}
                options={[
                  { value: "all", label: t("هەموو دۆخەکان") },
                  { value: "unassigned", label: t("بێ بەشداربوون") },
                  ...subscriptionStatusOptions.map((option) => ({ ...option, label: t(option.label) })),
                ]}
                onChange={(value) => {
                  setBusinessStatusFilter(value);
                  setBusinessPage(1);
                }}
              />
              <CustomSelect
                label={t("ڕیزبەندی")}
                value={businessSort}
                options={businessSortOptions.map((option) => ({ ...option, label: t(option.label) }))}
                onChange={(value) => {
                  setBusinessSort(value);
                  setBusinessPage(1);
                }}
              />
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-200/80 px-3 py-3 text-xs text-slate-500 dark:border-white/10 dark:text-slate-300">
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            {tab === "plans"
              ? filteredPlans.length
              : filteredBusinesses.length}{" "}
            {t("ئەنجام")}
          </span>
          <span className="text-[10px] text-slate-400">
            {t("گەڕان و فلتەرەکان خۆکارانە جێبەجێ دەبن")}
          </span>
        </div>
      </SearchModal>

      {planModal && (
        <PlanFormModal
          plan={planModal === "create" ? undefined : planModal}
          plans={overview?.plans || []}
          permissionProfiles={overview?.permissionProfiles || []}
          onClose={() => setPlanModal(null)}
          onSaved={() => {
            setPlanModal(null);
            void load(true);
          }}
        />
      )}

      <PlanDetailModal plan={viewPlan} onClose={() => setViewPlan(null)} />
      <BusinessSubscriptionDetailModal
        business={viewBusiness}
        onClose={() => setViewBusiness(null)}
      />

      <ConfirmDeleteModal
        isOpen={!!deletePlan}
        onClose={() => {
          if (!isDeleting) setDeletePlan(null);
        }}
        onConfirm={confirmDeletePlan}
        isDeleting={isDeleting}
        title={t("سڕینەوەی پلانی بەشداربوون")}
        confirmLabel={t("سڕینەوە")}
        cancelLabel={t("هەڵوەشاندنەوە")}
        closeLabel={t("داخستن")}
        message={
          <span>
            {t("دڵنیایت لە سڕینەوەی پلانی")} <strong>{deletePlan?.name}</strong>؟ {t("ئەم کردارە ناگەڕێندرێتەوە.")}
          </span>
        }
        zIndexClassName="z-[160]"
      />
    </div>
  );
}

function PlansTable({
  plans,
  onView,
  onEdit,
  onDelete,
}: {
  plans: SubscriptionPlan[];
  onView: (plan: SubscriptionPlan) => void;
  onEdit: (plan: SubscriptionPlan) => void;
  onDelete: (plan: SubscriptionPlan) => void;
}) {
  const t = useBillingText();
  if (!plans.length) {
    return (
      <EmptyState
        icon={Layers3}
        title={t("هیچ پلانێک نییە")}
        description={t("یەکەم پلانی بەشداربوون دروست بکە.")}
      />
    );
  }
  return (
    <div className="overflow-x-auto custom-scrollbar brand-custom-scrollbar">
      <table className="w-full min-w-[980px] text-left text-xs">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
            {[
              "پلان",
              "پڕۆفایلی مۆڵەت",
              "نرخی ساڵانە",
              "تاقیکردنەوە",
              "بەشداربووان",
              "دۆخ",
              "کارەکان",
            ].map((header) => (
              <th key={header} className="px-3 py-3 font-semibold">
                {t(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => (
            <tr
              key={plan.id}
              className="border-b border-slate-100 text-slate-600 transition hover:bg-slate-50/60 dark:border-white/5 dark:text-slate-300 dark:hover:bg-white/[0.03]"
            >
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="font-bold">{plan.name}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                      {plan.code}
                    </p>
                  </div>
                  {plan.isDefault && (
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      {t("بنەڕەتی")}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-3 py-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2 py-1 text-[10px] font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                  <ShieldCheck className="h-3 w-3" />
                  {plan.permissionProfileName}
                </span>
              </td>
              <td className="px-3 py-3 font-semibold">
                {formatMoney(plan.yearlyPriceMinor, plan.currency)}
              </td>
              <td className="px-3 py-3">
                {plan.trialDays ? `${plan.trialDays} ${t("ڕۆژ")}` : t("نییە")}
              </td>
              <td className="px-3 py-3">{plan.subscriberCount}</td>
              <td className="px-3 py-3">
                <StatusBadge status={plan.status} type="plan" />
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-1">
                  <Tooltip content={t("بینین")} side="top">
                    <button
                      type="button"
                      onClick={() => onView(plan)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-sky-600 transition hover:bg-sky-50 dark:hover:bg-sky-500/10 cursor-pointer"
                      title={t("بینین")}
                      aria-label={t("بینینی پلان")}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </Tooltip>
                  <Tooltip content={t("دەستکاریکردن")} side="top">
                    <button
                      type="button"
                      onClick={() => onEdit(plan)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-violet-600 transition hover:bg-violet-50 dark:hover:bg-violet-500/10 cursor-pointer"
                      title={t("دەستکاریکردن")}
                      aria-label={t("دەستکاریکردنی پلان")}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </Tooltip>
                  <Tooltip content={t("سڕینەوە")} side="top">
                    <button
                      type="button"
                      onClick={() => onDelete(plan)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
                      title={t("سڕینەوە")}
                      aria-label={t("سڕینەوەی پلان")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BusinessesSubscriptionsTable({
  businesses,
  onView,
}: {
  businesses: BusinessRow[];
  onView: (business: BusinessRow) => void;
}) {
  const { locale } = usePlatformLocale();
  const t = useBillingText();
  if (!businesses.length) {
    return (
      <EmptyState
        icon={Building2}
        title={t("هیچ بزنسێک نەدۆزرایەوە")}
        description={t("فلتەرەکان بگۆڕە یان ناوێکی تر بگەڕێ.")}
      />
    );
  }
  return (
    <div className="overflow-x-auto custom-scrollbar brand-custom-scrollbar">
      <table className="w-full min-w-[980px] text-left text-xs">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 dark:border-white/5">
            {[
              "بزنس",
              "پلانی دیاریکراو",
              "پڕۆفایلی مۆڵەت",
              "کۆتایی ماوە",
              "دۆخ",
              "کارەکان",
            ].map((header) => (
              <th key={header} className="px-3 py-3 font-semibold">
                {t(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {businesses.map((business) => (
            <tr
              key={business.id}
              className="border-b border-slate-100 text-slate-600 transition hover:bg-slate-50/60 dark:border-white/5 dark:text-slate-300 dark:hover:bg-white/[0.03]"
            >
              <td className="px-3 py-3">
                <p className="font-bold">{business.name}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  @{business.username}
                </p>
              </td>
              <td className="px-3 py-3 font-bold">
                {business.subscription?.planName || t("دیاری نەکراوە")}
              </td>
              <td className="px-3 py-3">
                {business.subscription?.permissionProfileName || "—"}
              </td>
              <td className="px-3 py-3">
                {formatDate(business.subscription?.currentPeriodEnd, locale)}
              </td>
              <td className="px-3 py-3">
                <StatusBadge
                  status={business.subscription?.status || "unassigned"}
                  type="subscription"
                />
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-1">
                  <Tooltip content={t("بینین")} side="top">
                    <button
                      type="button"
                      onClick={() => onView(business)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-sky-600 transition hover:bg-sky-50 dark:hover:bg-sky-500/10 cursor-pointer"
                      title={t("بینین")}
                      aria-label={t("بینینی بەشداری")}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlanDetailModal({
  plan,
  onClose,
}: {
  plan: SubscriptionPlan | null;
  onClose: () => void;
}) {
  const t = useBillingText();
  return (
    <DetailViewModal
      isOpen={!!plan}
      onClose={onClose}
      title={plan?.name || ""}
      subtitle={t("وردەکاری پلانی بەشداربوون")}
      icon={CreditCard}
      iconClassName="sa-soft sa-soft-border"
      fields={
        plan
          ? [
              {
                label: t("دۆخ"),
                value: <StatusBadge status={plan.status} type="plan" />,
              },
              {
                label: t("پڕۆفایلی مۆڵەت"),
                value: plan.permissionProfileName,
              },
              {
                label: t("نرخی ساڵانە"),
                value: formatMoney(plan.yearlyPriceMinor, plan.currency),
              },
              {
                label: t("ماوەی تاقیکردنەوە"),
                value: plan.trialDays ? `${plan.trialDays} ${t("ڕۆژ")}` : t("نییە"),
              },
              {
                label: t("بەشداربووان"),
                value: String(plan.subscriberCount),
              },
              {
                label: t("پلانی بنەڕەتی"),
                value: plan.isDefault ? t("بەڵێ") : t("نەخێر"),
              },
              {
                label: t("ڕیزبەندی"),
                value: String(plan.displayOrder),
              },
              {
                label: t("ڕوونکردنەوە"),
                value: plan.description || t("ڕوونکردنەوە نییە"),
                fullWidth: true,
              },
            ]
          : []
      }
    />
  );
}

function BusinessSubscriptionDetailModal({
  business,
  onClose,
}: {
  business: BusinessRow | null;
  onClose: () => void;
}) {
  const { locale } = usePlatformLocale();
  const t = useBillingText();
  const subscription = business?.subscription;
  return (
    <DetailViewModal
      isOpen={!!business}
      onClose={onClose}
      title={business?.name || ""}
      subtitle={business ? `@${business.username}` : ""}
      icon={Building2}
      iconClassName="sa-soft sa-soft-border"
      fields={
        business
          ? [
              {
                label: t("پلانی دیاریکراو"),
                value: subscription?.planName || t("دیاری نەکراوە"),
              },
              {
                label: t("پڕۆفایلی مۆڵەت"),
                value: subscription?.permissionProfileName || t("دیاری نەکراوە"),
              },
              {
                label: t("دۆخی بەشداربوون"),
                value: subscription ? (
                  <StatusBadge
                    status={subscription.status}
                    type="subscription"
                  />
                ) : (
                  t("دیاری نەکراوە")
                ),
              },
              {
                label: t("دەستپێکی ماوە"),
                value: formatDate(subscription?.currentPeriodStart, locale),
              },
              {
                label: t("کۆتایی ماوە"),
                value: formatDate(subscription?.currentPeriodEnd, locale),
              },
              {
                label: t("دواین نوێکردنەوە"),
                value: formatDate(subscription?.updatedAt, locale),
              },
            ]
          : []
      }
    />
  );
}

function ManagementModal({
  title,
  subtitle,
  saving,
  canSave,
  submitLabel,
  onClose,
  onSave,
  children,
}: {
  title: string;
  subtitle: string;
  saving: boolean;
  canSave: boolean;
  submitLabel: string;
  onClose: () => void;
  onSave: () => void;
  children: ReactNode;
}) {
  const t = useBillingText();
  useModalKeyboard({
    isOpen: true,
    onEscape: onClose,
    enterEnabled: false,
  });

  useEffect(() => {
    document.body.classList.add("sponsor-krd-theme-portals");
    return () => document.body.classList.remove("sponsor-krd-theme-portals");
  }, []);

  return createPortal(
    <div
      className="modal-ltr fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4"
      dir="ltr"
      data-sponsor-krd-theme
      style={
        {
          "--theme-primary": "var(--sponsor-krd-accent)",
          "--theme-css": "var(--sponsor-krd-accent-gradient)",
        } as CSSProperties
      }
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-md   duration-300"
        onClick={onClose}
        aria-label={t("داخستن")}
      />
      <div className="relative z-10 w-full max-w-2xl max-h-[95vh] overflow-hidden rounded-2xl border border-gray-100 bg-primary-95 shadow-2xl backdrop-blur-sm    duration-300 sm:max-h-[90vh]">
        <form
          className="flex h-full max-h-[95vh] flex-col sm:max-h-[90vh]"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <div className="flex items-center justify-between border-b border-gray-100/50 bg-linear-to-r from-white to-slate-50/30 p-4 sm:p-5 md:p-6">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-slate-700 sm:text-xl md:text-2xl">
                {title}
              </h2>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                {subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-3 flex shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-linear-to-br from-slate-50 to-gray-50 p-2 text-slate-500 shadow-sm transition-all hover:from-slate-100 hover:to-gray-100 hover:text-slate-700 hover:shadow"
              aria-label={t("داخستن")}
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-linear-to-br from-white to-slate-50/20 p-4 sm:p-5 md:p-6 custom-scrollbar brand-custom-scrollbar">
            {children}
          </div>
          <ModalWizardActions
            variant="sponsor-krd"
            isFirstStep
            isFinalStep
            isSubmitting={saving}
            canContinue={canSave}
            submitLabel={submitLabel}
            cancelLabel={t("هەڵوەشاندنەوە")}
            cancelTooltip={t("داخستن و هەڵوەشاندنەوەی گۆڕانکارییەکان")}
            requiredTooltip={t("تکایە خانە پێویستەکان پڕبکەرەوە")}
            savingLabel={t("پاشەکەوتکردن...")}
            onBack={() => undefined}
            onCancel={onClose}
            onNext={() => undefined}
            onSubmit={onSave}
          />
        </form>
      </div>
    </div>,
    document.body,
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="space-y-1.5">
      <span className="block text-xs font-medium text-gray-700 sm:text-sm">
        {label} {required && <RequiredMark />}
      </span>
      {children}
    </label>
  );
}

const PLAN_DESCRIPTION_PRESETS: Record<string, string> = {
  basic:
    "Essential business access\n\nUp to 5 link pages\n2 Linktree templates\nCore analytics\nPage defaults configuration\nSponsor.krd subdomain",
  pro: "Advanced analytics management access\n\nUp to 20 link pages\n5 Linktree templates\nAdvanced analytics & reporting\nBusiness profile editing\nCustom branding (logo, favicon, colors)\nTikTok Pixel & Events API\n7-day free trial\nPage defaults configuration\nSponsor.krd subdomain",
  ultra:
    "Complete business access\n\nUnlimited link pages\n6 Linktree templates\nAdvanced analytics & reporting\nBusiness profile editing\nCustom branding (logo, favicon, colors)\nTikTok Pixel & Events API\nRemove Sponsor.krd branding\nPremium templates\nPage defaults configuration\nSponsor.krd subdomain",
};

const ARABIC_PLAN_DESCRIPTION_PRESETS: Record<string, string> = {
  basic: "وصول أساسي للنشاط التجاري\n\nحتى ٥ صفحات روابط\nقالبان للصفحات\nإحصاءات أساسية\nإعدادات الصفحة الافتراضية\nنطاق فرعي على Sponsor.krd",
  pro: "وصول متقدم لإدارة الإحصاءات\n\nحتى ٢٠ صفحة روابط\n٥ قوالب للصفحات\nإحصاءات وتقارير متقدمة\nتعديل ملف النشاط التجاري\nعلامة تجارية مخصصة (شعار، أيقونة، ألوان)\nبكسل تيك توك وواجهة الأحداث\nتجربة مجانية لمدة ٧ أيام\nإعدادات الصفحة الافتراضية\nنطاق فرعي على Sponsor.krd",
  ultra: "وصول كامل للنشاط التجاري\n\nصفحات روابط غير محدودة\n٦ قوالب للصفحات\nإحصاءات وتقارير متقدمة\nتعديل ملف النشاط التجاري\nعلامة تجارية مخصصة (شعار، أيقونة، ألوان)\nبكسل تيك توك وواجهة الأحداث\nإزالة علامة Sponsor.krd\nقوالب مميزة\nإعدادات الصفحة الافتراضية\nنطاق فرعي على Sponsor.krd",
};

function getPlanDescriptionPreset(
  profileId: string,
  permissionProfiles: PermissionProfile[],
  locale: PlatformLocale,
) {
  const code = permissionProfiles.find(
    (profile) => profile.id === profileId,
  )?.code;
  const presets = locale === "ar" ? ARABIC_PLAN_DESCRIPTION_PRESETS : PLAN_DESCRIPTION_PRESETS;
  return code ? presets[code] || "" : "";
}

function PlanFormModal({
  plan,
  plans,
  permissionProfiles,
  onClose,
  onSaved,
}: {
  plan?: SubscriptionPlan;
  plans: SubscriptionPlan[];
  permissionProfiles: PermissionProfile[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { locale } = usePlatformLocale();
  const t = useBillingText();
  const initialPermissionProfileId =
    plan?.permissionProfileId || permissionProfiles[0]?.id || "";
  const [name, setName] = useState(plan?.name || "");
  const [permissionProfileId, setPermissionProfileId] = useState(
    initialPermissionProfileId,
  );
  const [description, setDescription] = useState(
    () =>
      getPlanDescriptionPreset(
        initialPermissionProfileId,
        permissionProfiles,
        locale,
      ) ||
      plan?.description ||
      "",
  );
  const [currency, setCurrency] = useState(plan?.currency || "USD");
  const [yearlyPrice, setYearlyPrice] = useState(
    plan ? String(plan.yearlyPriceMinor / 100) : "0",
  );
  const [saving, setSaving] = useState(false);

  const duplicateName = plans.some(
    (item) =>
      item.id !== plan?.id &&
      item.name.trim().toLocaleLowerCase() === name.trim().toLocaleLowerCase(),
  );
  const yearlyNumber = Number(yearlyPrice);
  const canSave =
    name.trim().length >= 2 &&
    !duplicateName &&
    !!permissionProfileId &&
    /^[A-Z]{3}$/.test(currency) &&
    Number.isFinite(yearlyNumber) &&
    yearlyNumber >= 0;

  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const response = await fetch(
        plan
          ? `/api/platform/billing/subscription-plans/${plan.id}`
          : "/api/platform/billing/subscription-plans",
        {
          method: plan ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            permissionProfileId,
            currency,
            yearlyPriceMinor: Math.round(yearlyNumber * 100),
          }),
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(
          response.status === 409
            ? t("ئەم ناوە پێشتر بەکارهاتووە یان پلانی بنەڕەتی تر هەیە.")
            : platformRequestError(result.message, t("پاشەکەوتکردنی پلان سەرکەوتوو نەبوو"), locale),
        );
        return;
      }
      toast.success(plan ? t("پلان نوێکرایەوە") : t("پلانی نوێ دروستکرا"));
      onSaved();
    } catch {
      toast.error(t("پاشەکەوتکردنی پلان سەرکەوتوو نەبوو"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ManagementModal
      title={plan ? t("دەستکاریکردنی پلان") : t("پلانی بەشداربوونی نوێ")}
      subtitle={t("زانیاری نرخ و پڕۆفایلی مۆڵەتی پلان دیاری بکە.")}
      saving={saving}
      canSave={canSave}
      submitLabel={plan ? t("نوێکردنەوە") : t("دروستکردن")}
      onClose={onClose}
      onSave={() => void save()}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label={t("ناوی پلان")} required>
            <input
              autoFocus
              className={modalInputClass(duplicateName)}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("بۆ نموونە: Business Pro")}
            />
            {duplicateName && (
              <span className="block text-xs font-medium text-red-500">
                {t("ئەم ناوە پێشتر بەکارهاتووە.")}
              </span>
            )}
          </FormField>
          <CustomSelect
            label={`${t("پڕۆفایلی مۆڵەت")} *`}
            value={permissionProfileId}
            options={
              permissionProfiles.length
                ? permissionProfiles.map((profile) => ({
                    value: profile.id,
                    label: `${profile.name} · ${profile.permissionCount} ${t("مۆڵەت")}`,
                  }))
                : [{ value: "", label: t("هیچ پڕۆفایلێک بەردەست نییە") }]
            }
            onChange={(profileId) => {
              setPermissionProfileId(profileId);
              const preset = getPlanDescriptionPreset(
                profileId,
                permissionProfiles,
                locale,
              );
              if (preset) setDescription(preset);
            }}
            disabled={!permissionProfiles.length}
            labelClassName="text-xs font-medium text-gray-700 sm:text-sm normal-case tracking-normal"
            triggerClassName={`${modalInputClass()} flex items-center justify-between gap-2 font-medium h-auto`}
          />
        </div>

        <FormField label={t("ڕوونکردنەوە")}>
          <textarea
            className={`${modalInputClass()} min-h-24 resize-y`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t("وردەکاری و ئامانجی ئەم پلانە بنووسە...")}
            maxLength={500}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label={t("نرخی ساڵانە")} required>
            <input
              type="number"
              min="0"
              step="0.01"
              className={modalInputClass()}
              value={yearlyPrice}
              onChange={(event) => setYearlyPrice(event.target.value)}
            />
          </FormField>
          <FormField label={t("دراو")} required>
            <CustomSelect
              label=""
              hideLabel
              value={currency}
              options={[
                { value: "USD", label: t("USD · دۆلار") },
                { value: "IQD", label: t("IQD · دینار") },
              ]}
              onChange={setCurrency}
              triggerClassName={`${modalInputClass()} flex items-center justify-between gap-2 font-medium h-auto`}
            />
          </FormField>
        </div>
      </div>
    </ManagementModal>
  );
}
