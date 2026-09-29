import { SkeletonDashboardShell } from "@/components/shared/Skeleton";
import { SkeletonBusinessDirectoryPage } from "@/components/shared/SkeletonPageLayouts";
import { cookies } from "next/headers";
import { PLATFORM_LOCALE_COOKIE, parsePlatformLocale } from "@/features/platform-admin/i18n/locale";
import { platformLoadingCopy } from "@/features/platform-admin/i18n/loading-copy";

export default async function PlatformDashboardLoading() {
  const locale = parsePlatformLocale((await cookies()).get(PLATFORM_LOCALE_COOKIE)?.value);
  return (
    <SkeletonDashboardShell navigationItems={12} platformAdminTheme>
      <SkeletonBusinessDirectoryPage loadingLabel={platformLoadingCopy[locale].businessDirectory} />
    </SkeletonDashboardShell>
  );
}
