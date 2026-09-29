import { SkeletonMarketingPage } from "@/components/shared/SkeletonMarketingPage";
import { cookies } from "next/headers";
import { ROOT_PUBLIC_LOCALE_COOKIE, parseRootPublicLocale } from "@/features/public-site/root-public-locale";

export default async function PrivacyLoading() {
  const locale = parseRootPublicLocale((await cookies()).get(ROOT_PUBLIC_LOCALE_COOKIE)?.value);
  return <SkeletonMarketingPage body="article" loadingLabel={locale === "ar" ? "جارٍ تحميل سياسة الخصوصية" : locale === "en" ? "Loading privacy policy" : "سیاسەتی تایبەتمەندی بار دەکرێت"} />;
}
