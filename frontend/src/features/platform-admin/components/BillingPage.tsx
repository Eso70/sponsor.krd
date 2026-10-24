"use client";
import { PAGE_MANAGEMENT_PAGE_SIZE } from "@/components/shared/page-management";

import { planStatusOptions, subscriptionStatusOptions } from "./BillingDisplay";
import { BusinessesSubscriptionsTable } from "./BusinessesSubscriptionsTable";
import { PlanDetailModal } from "./PlanDetailModal";
import { BusinessSubscriptionDetailModal } from "./BusinessSubscriptionDetailModal";
import { SubscriptionAssignmentModal } from "./SubscriptionAssignmentModal";


import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PlanFormModal } from "./SubscriptionPlanFormModal";
import { SubscriptionPlansGrid } from "./SubscriptionPlansGrid";
import { PlanPolicyEditorModal } from "./PlanPolicyEditorModal";
import type {
  SubscriptionPlan,
  BusinessRow,
  BillingOverview,
} from "./billing-types";
import {
  AlertTriangle,
  Building2,
  Layers3,
  Plus,
  Search,
  SlidersHorizontal,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDeleteModal } from "@/components/shared/ConfirmDeleteModal";
import {
  CustomSelect,
  type CustomSelectOption,
} from "@/components/shared/CustomSelect";
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
import { SkeletonStatCards } from "@/components/shared/Skeleton";
import { StatCardGrid } from "@/components/shared/StatCardGrid";
import { usePlatformLocale } from "@/features/platform-admin/i18n/PlatformLocaleProvider";
import { platformLoadingCopy } from "@/features/platform-admin/i18n/loading-copy";
import { useBillingText } from "./use-billing-text";
import { platformRequestError } from "@/features/platform-admin/i18n/request-error";

type Tab = "plans" | "businesses";

type PlanSort = "displayOrder" | "nameAsc" | "newest" | "subscribers";
type BusinessSort = "nameAsc" | "recentlyUpdated" | "planName";

const tabs = [
  { id: "plans" as const, label: "پلانەکان", icon: Layers3 },
  { id: "businesses" as const, label: "بزنسەکان", icon: Building2 },
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

export function BillingPage() {
  const t = useBillingText();
  const { locale } = usePlatformLocale();
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);
  const [tab, setTab] = useState<Tab>("plans");
  const startRequest = useLatestRequest();
  const [loadFailed, setLoadFailed] = useState(false);
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [planModal, setPlanModal] = useState<
    SubscriptionPlan | "create" | null
  >(null);
  const [viewPlan, setViewPlan] = useState<SubscriptionPlan | null>(null);
  const [policyPlan, setPolicyPlan] = useState<SubscriptionPlan | null>(null);
  const [deletePlan, setDeletePlan] = useState<SubscriptionPlan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewBusiness, setViewBusiness] = useState<BusinessRow | null>(null);
  const [assignmentBusiness, setAssignmentBusiness] =
    useState<BusinessRow | null>(null);
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
    async (quiet = false, rethrow = false) => {
      if (quiet) setRefreshing(true);
      else setLoading(true);
      const current = startRequest();
      try {
        const params = new URLSearchParams({
          page: String(businessPage),
          limit: String(PAGE_MANAGEMENT_PAGE_SIZE),
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
            platformRequestError(
              result.message,
              tRef.current("بارکردنی بەشداربوونەکان سەرکەوتوو نەبوو"),
              locale,
            ),
          );
        }
        if (!result.data?.summary) throw new Error("Invalid dashboard summary");
        if (!current()) return;
        setLoadFailed(false);
        setOverview(result.data);
      } catch (error) {
        if (!current()) return;
        setLoadFailed(true);
        toast.error(
          platformRequestError(
            error instanceof Error ? error.message : null,
            tRef.current("بارکردنی بەشداربوونەکان سەرکەوتوو نەبوو"),
            locale,
          ),
        );
        if (rethrow) throw error;
      } finally {
        if (current()) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [
      startRequest,
      businessPage,
      businessPlanFilter,
      businessSearch,
      businessStatusFilter,
      locale,
    ],
  );

  useRegisterDashboardRefresh("billing", () => load(true, true));

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

  const pageSize = overview?.pagination.limit || PAGE_MANAGEMENT_PAGE_SIZE;
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
            ? t(
                "پلانی بنەڕەتی یان پلانێک کە بزنسی پێوە بەستراوە ناتوانرێت بسڕدرێتەوە.",
              )
            : platformRequestError(
                result.message,
                t("سڕینەوەی پلان سەرکەوتوو نەبوو"),
                locale,
              ),
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
        <SkeletonStatCards
          count={3}
          columns={3}
          loadingLabel={platformLoadingCopy[locale].loading}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5" dir="ltr">
      {loadFailed && <RequestErrorNotice message={t("بارکردنی بەشداربوونەکان سەرکەوتوو نەبوو")} />}
      <StatCardGrid columns={3}>
        <StatCard
          loading={loading || refreshing}
          icon={Layers3}
          label={t("پلانە چالاکەکان")}
          value={loadFailed ? "—" : overview?.summary.activePlans ?? "—"}
          color="green"
        />
        <StatCard
          loading={loading || refreshing}
          icon={UsersRound}
          label={t("بەشداربوونی چالاک")}
          value={loadFailed ? "—" : overview?.summary.activeSubscriptions ?? "—"}
          color="blue"
        />
        <StatCard
          loading={loading || refreshing}
          icon={AlertTriangle}
          label={t("پێویستی بە سەرنجدان")}
          value={loadFailed ? "—" : overview?.summary.attentionRequired ?? "—"}
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

      <PageManagementSection
          title={
            tab === "plans"
              ? t("پلانەکانی بەشداربوون")
              : t("بزنس و بەشداربوونەکان")
          }
          description={
            tab === "plans"
              ? t("پلان، نرخ، ماوە و پڕۆفایلی مۆڵەتی هەر پلانێک بەڕێوە ببە.")
              : t(
                  "پلانی دیاریکراو، دۆخی بەشداربوون و ماوەی هەر بزنسێک بەڕێوە ببە.",
                )
          }
          icon={tab === "plans" ? <Layers3 className="size-5" /> : <Building2 className="size-5" />}
          toolbar={
            <PageManagementActions>
              <SettingsActionButton label={t("گەڕان")} icon={SlidersHorizontal} variant="soft" onClick={() => setSearchOpen(true)} />
              {tab === "plans" && <SettingsActionButton label={t("پلانی نوێ")} icon={Plus} onClick={() => setPlanModal("create")} />}
            </PageManagementActions>
          }
      >

          <DashboardRefreshRegion loading={loading || refreshing} label={platformLoadingCopy[locale].loading}>
          {tab === "plans" ? (
            <SubscriptionPlansGrid
              plans={filteredPlans}
              onPolicy={setPolicyPlan}
              onView={setViewPlan}
              onEdit={setPlanModal}
              onDelete={(plan) => {
                if (plan.isDefault) {
                  toast.error(t("پلانی بنەڕەتی ناتوانرێت بسڕدرێتەوە."));
                  return;
                }
                if (plan.subscriberCount > 0) {
                  toast.error(
                    t(
                      "ئەم پلانە لەلایەن بزنسێکەوە بەکاردێت و ناتوانرێت بسڕدرێتەوە.",
                    ),
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
                copy={{
                  of: t("لە"),
                  previous: t("پەڕەی پێشوو"),
                  next: t("پەڕەی دواتر"),
                }}
              />
            </>
          )}
          </DashboardRefreshRegion>
      </PageManagementSection>

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
                  ...planStatusOptions.map((option) => ({
                    ...option,
                    label: t(option.label),
                  })),
                ]}
                onChange={setPlanStatusFilter}
              />
              <CustomSelect
                label={t("ڕیزبەندی")}
                value={planSort}
                options={planSortOptions.map((option) => ({
                  ...option,
                  label: t(option.label),
                }))}
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
                  ...subscriptionStatusOptions.map((option) => ({
                    ...option,
                    label: t(option.label),
                  })),
                ]}
                onChange={(value) => {
                  setBusinessStatusFilter(value);
                  setBusinessPage(1);
                }}
              />
              <CustomSelect
                label={t("ڕیزبەندی")}
                value={businessSort}
                options={businessSortOptions.map((option) => ({
                  ...option,
                  label: t(option.label),
                }))}
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

      {policyPlan && (
        <PlanPolicyEditorModal
          plan={policyPlan}
          profileCode={
            overview?.permissionProfiles.find(
              (profile) => profile.id === policyPlan.permissionProfileId,
            )?.code ?? policyPlan.code
          }
          entitlements={overview?.entitlements ?? []}
          onClose={() => setPolicyPlan(null)}
          onSaved={() => {
            setPolicyPlan(null);
            void load(true);
          }}
        />
      )}
      <PlanDetailModal plan={viewPlan} onClose={() => setViewPlan(null)} />
      <BusinessSubscriptionDetailModal
        business={viewBusiness}
        onClose={() => setViewBusiness(null)}
        onManage={() => {
          setAssignmentBusiness(viewBusiness);
          setViewBusiness(null);
        }}
      />
      {assignmentBusiness && (
        <SubscriptionAssignmentModal
          business={assignmentBusiness}
          plans={overview?.plans ?? []}
          onClose={() => setAssignmentBusiness(null)}
          onSaved={() => {
            setAssignmentBusiness(null);
            void load(true);
          }}
        />
      )}

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
            {t("دڵنیایت لە سڕینەوەی پلانی")} <strong>{deletePlan?.name}</strong>
            ؟ {t("ئەم کردارە ناگەڕێندرێتەوە.")}
          </span>
        }
        zIndexClassName="z-[160]"
      />
    </div>
  );
}
