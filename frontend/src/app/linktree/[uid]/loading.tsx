import { SkeletonPublicLinktreePage } from "@/components/shared/Skeleton";
import { cookies, headers } from "next/headers";
import { BUSINESS_PUBLIC_LOCALE_COOKIE, publicBusinessLocale } from "@/features/business/i18n/public-locale";
import { resolveLinktreeHost } from "@/lib/public/linktree-host";
import { publicLinktreeCopy } from "@/features/business/i18n/public-linktree-copy";
import { ROOT_PUBLIC_LOCALE_COOKIE, parseRootPublicLocale } from "@/features/public-site/root-public-locale";

export default async function LinktreeLoading() {
  const host = (await headers()).get("host")?.split(":")[0].toLowerCase() || "";
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost").split(":")[0].toLowerCase();
  const isPlatformRoot = resolveLinktreeHost(host, rootDomain).isPlatformRoot;
  const cookieStore = await cookies();
  const locale = isPlatformRoot
    ? parseRootPublicLocale(cookieStore.get(ROOT_PUBLIC_LOCALE_COOKIE)?.value)
    : publicBusinessLocale(cookieStore.get(BUSINESS_PUBLIC_LOCALE_COOKIE)?.value);
  return <SkeletonPublicLinktreePage loadingLabel={publicLinktreeCopy[locale].loading} />;
}
