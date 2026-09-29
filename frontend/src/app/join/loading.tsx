import { SkeletonAuthenticationPage } from "@/components/shared/SkeletonAuthenticationPage";
import { cookies } from "next/headers";
import { ROOT_PUBLIC_LOCALE_COOKIE, parseRootPublicLocale } from "@/features/public-site/root-public-locale";
import { rootOnboardingCopy } from "@/features/onboarding/root-onboarding-copy";

export default async function InvitationLoading() {
  const locale = parseRootPublicLocale((await cookies()).get(ROOT_PUBLIC_LOCALE_COOKIE)?.value);
  return (
    <SkeletonAuthenticationPage brandDescription={rootOnboardingCopy[locale].brand} loadingLabel={rootOnboardingCopy[locale].verifying} language={locale} />
  );
}
