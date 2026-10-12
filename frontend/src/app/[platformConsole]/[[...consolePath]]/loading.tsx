import { headers } from "next/headers";
import { FormsPageSkeleton } from "@/features/forms/components/FormSkeletons";
import { formsCopy } from "@/features/forms/forms-copy";
import { SkeletonDashboardShell } from "@/components/shared/Skeleton";
import { SkeletonBusinessDirectoryPage } from "@/components/shared/SkeletonPageLayouts";
import { cookies } from "next/headers";
import {
  PLATFORM_LOCALE_COOKIE,
  parsePlatformLocale,
} from "@/features/platform-admin/i18n/locale";
import { platformLoadingCopy } from "@/features/platform-admin/i18n/loading-copy";

export default async function PlatformDashboardLoading() {
  const locale = parsePlatformLocale(
    (await cookies()).get(PLATFORM_LOCALE_COOKIE)?.value,
  );
  const formPage = /\/forms\/?$/.test(
    (await headers()).get("x-public-path") || "",
  );
  return (
    <SkeletonDashboardShell navigationItems={12} platformAdminTheme>
      {formPage ? (
        <FormsPageSkeleton copy={formsCopy(locale)} />
      ) : (
        <SkeletonBusinessDirectoryPage
          loadingLabel={platformLoadingCopy[locale].businessDirectory}
        />
      )}
    </SkeletonDashboardShell>
  );
}
