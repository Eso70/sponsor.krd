import { useRegisterBusinessDashboardRefresh } from "@/features/business/dashboard-refresh";
import {
  LinktreesManagementPage,
  type LinktreesManagementCopy,
  type LinktreesManagementPageProps,
} from "@/features/link-editor/components/LinktreesManagementPage";
import { useTranslations } from "next-intl";
import { businessMessages } from "@/features/business/i18n/messages";
import { useBusinessLocale } from "@/features/business/i18n/BusinessLocaleProvider";

export type BusinessLinktreesPageProps = LinktreesManagementPageProps;

export function BusinessLinktreesPage(props: BusinessLinktreesPageProps) {
  const t = useTranslations("Linktrees");
  const { locale } = useBusinessLocale();
  useRegisterBusinessDashboardRefresh("linktrees", () => props.onRefresh(true));
  const copy: LinktreesManagementCopy = {
    title: t("title"),
    description: t("description"),
    limitReached: t("limitReached"),
    totalPages: t("totalPages"),
    totalViews: t("totalViews"),
    uniqueViews: t("uniqueViews"),
    totalClicks: t("totalClicks"),
    clickRate: t("clickRate"),
    conversions: t("conversions"),
    analytics: t("analytics"),
    noArchived: t("noArchived"),
    archivedDescription: t("archivedDescription"),
    clearSearch: t("clearSearch"),
    searchTooltip: t("searchTooltip"),
    search: t("search"),
    searchPlaceholder: t("searchPlaceholder"),
    activePages: t("activePages"),
    archivedPages: t("archivedPages"),
    active: t("active"),
    archived: t("archived"),
    gridView: t("gridView"),
    tableView: t("tableView"),
    refreshPages: t("refreshPages"),
    refresh: t("refresh"),
    createTooltip: t("createTooltip"),
    create: t("create"),
    clearAnalytics: t("clearAnalytics"),
    noAnalytics: t("noAnalytics"),
  };
  return (
    <LinktreesManagementPage
      {...props}
      emptyTitle={props.emptyTitle ?? t("noPages")}
      emptyDescription={props.emptyDescription ?? t("noPagesDescription")}
      copy={{ ...copy, ...props.copy }}
      listCopy={businessMessages[locale].LinktreeList}
      profitCopy={businessMessages[locale].CampaignProfit}
      trafficLabels={{
        column: businessMessages[locale].LinktreeList.traffic,
        views: businessMessages[locale].LinktreeList.views,
        interactions: businessMessages[locale].LinktreeList.interactions,
      }}
    />
  );
}
