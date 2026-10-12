import { headers } from "next/headers";
import { FormsPageSkeleton } from "@/features/forms/components/FormSkeletons";
import { formsCopy } from "@/features/forms/forms-copy";
import { cookies } from "next/headers";
import { SkeletonDashboardShell } from "@/components/shared/Skeleton";
import { SkeletonPageManagement } from "@/components/shared/SkeletonPageLayouts";
import {
  BUSINESS_LOCALE_COOKIE,
  businessLocaleFromCookie,
} from "@/features/business/i18n/locale-cookie";

export default async function BusinessDashboardLoading() {
  const cookieStore = await cookies();
  const locale = businessLocaleFromCookie(
    cookieStore.get(BUSINESS_LOCALE_COOKIE)?.value,
  );
  const formPage = (await headers()).get("x-public-path") === "/business/forms";
  return (
    <SkeletonDashboardShell navigationItems={5}>
      {formPage ? (
        <FormsPageSkeleton copy={formsCopy(locale)} />
      ) : (
        <SkeletonPageManagement
          showTabs
          loadingLabel={
            locale === "ar"
              ? "جارٍ تحميل إدارة الصفحات"
              : locale === "en"
                ? "Loading page management"
                : "بەڕێوەبردنی پەیجەکان بار دەکرێت"
          }
        />
      )}
    </SkeletonDashboardShell>
  );
}
