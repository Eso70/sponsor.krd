import { SkeletonMarketingPage } from "@/components/shared/SkeletonMarketingPage";
import { cookies } from "next/headers";
import { BUSINESS_PUBLIC_LOCALE_COOKIE, publicBusinessLocale } from "@/features/business/i18n/public-locale";
import { businessPublicCopy } from "@/features/business/i18n/public-copy";

export default async function AdvertisingLoading() {
  const locale = publicBusinessLocale((await cookies()).get(BUSINESS_PUBLIC_LOCALE_COOKIE)?.value);
  return <SkeletonMarketingPage body="pricing" loadingLabel={businessPublicCopy[locale].advertising.loading} />;
}
