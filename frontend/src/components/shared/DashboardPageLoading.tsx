import { FormsPageSkeleton } from "@/features/forms/components/FormSkeletons";
import { formsCopy } from "@/features/forms/forms-copy";
import { LinktreesPageSkeleton } from "@/features/link-editor/components/LinktreesPageSkeleton";
import { platformLoadingCopy } from "@/features/platform-admin/i18n/loading-copy";
import { SkeletonTemplatePage } from "./Skeleton";
import {
  SkeletonBusinessDirectoryPage,
  SkeletonSettingsPage,
  SkeletonTikTokPage,
} from "./SkeletonPageLayouts";
import { LoadingState } from "./LoadingState";
import {
  dashboardLoadingCopy,
  dashboardLoadingKind,
} from "./dashboard-loading";

/** Shared server-safe route fallback for both dashboard shells. */
export function DashboardPageLoading({
  pathname,
  scope,
  locale,
}: {
  pathname: string;
  scope: "business" | "platform";
  locale: "en" | "ar" | "ckb";
}) {
  const copy = dashboardLoadingCopy[locale];
  switch (dashboardLoadingKind(pathname, scope)) {
    case "forms":
      return <FormsPageSkeleton copy={formsCopy(locale)} />;
    case "linktrees":
      return <LinktreesPageSkeleton locale={locale} />;
    case "templates":
      return <SkeletonTemplatePage loadingLabel={copy.templates} />;
    case "settings":
      return <SkeletonSettingsPage loadingLabel={copy.settings} />;
    case "tiktok":
      return <SkeletonTikTokPage loadingLabel={copy.tiktok} />;
    case "businesses":
      return (
        <SkeletonBusinessDirectoryPage
          loadingLabel={platformLoadingCopy[locale].businessDirectory}
        />
      );
    default:
      return <LoadingState title={copy.loading} />;
  }
}
