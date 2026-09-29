import { SkeletonAuthenticationPage } from "@/components/shared/SkeletonAuthenticationPage";
import { cookies } from "next/headers";
import { PLATFORM_LOCALE_COOKIE, parsePlatformLocale } from "@/features/platform-admin/i18n/locale";
import { platformLoadingCopy } from "@/features/platform-admin/i18n/loading-copy";

export default async function PlatformLoginLoading() {
  const locale = parsePlatformLocale((await cookies()).get(PLATFORM_LOCALE_COOKIE)?.value);
  const copy = platformLoadingCopy[locale];
  return (
    <SkeletonAuthenticationPage
      rememberDevice
      brandDescription={copy.loginDescription}
      loadingLabel={copy.login}
      language={locale}
    />
  );
}
