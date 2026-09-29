import { headers } from "next/headers";
import { cookies } from "next/headers";
import { SkeletonPublicLandingPage } from "@/components/shared/Skeleton";
import { extractSubdomain } from "@/lib/subdomain-utils";
import { ROOT_PUBLIC_LOCALE_COOKIE, parseRootPublicLocale } from "@/features/public-site/root-public-locale";
import { BUSINESS_PUBLIC_LOCALE_COOKIE, publicBusinessLocale } from "@/features/business/i18n/public-locale";

const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost")
  .split(":")[0]
  .toLowerCase();

export default async function Loading() {
  const headerStore = await headers();
  const host = headerStore.get("host") || "";
  const hostname = host.split(":")[0].toLowerCase();
  const isRoot =
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) ||
    ["localhost", "lvh.me", ROOT_DOMAIN, `www.${ROOT_DOMAIN}`].includes(
      hostname,
    );
  const subdomain = isRoot
    ? null
    : extractSubdomain(host, undefined, ROOT_DOMAIN);
  const cookieStore = await cookies();
  const locale = subdomain
    ? publicBusinessLocale(cookieStore.get(BUSINESS_PUBLIC_LOCALE_COOKIE)?.value)
    : parseRootPublicLocale(cookieStore.get(ROOT_PUBLIC_LOCALE_COOKIE)?.value);
  const loadingLabel = locale === "ar" ? "جارٍ تحميل الصفحة الرئيسية" : locale === "en" ? "Loading homepage" : "پەڕەی سەرەکی بار دەکرێت";

  return (
    <SkeletonPublicLandingPage variant={subdomain ? "business" : "platform"} loadingLabel={loadingLabel} />
  );
}
