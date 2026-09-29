import { Suspense } from "react";
import { InvitationEntryPage } from "@/features/onboarding/components/InvitationEntryPage";
import { SkeletonAuthenticationPage } from "@/components/shared/SkeletonAuthenticationPage";
import { cookies } from "next/headers";
import { RootPublicLocaleProvider } from "@/features/public-site/RootPublicLocaleProvider";
import { ROOT_PUBLIC_LOCALE_COOKIE, parseRootPublicLocale } from "@/features/public-site/root-public-locale";
import { rootOnboardingCopy } from "@/features/onboarding/root-onboarding-copy";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = parseRootPublicLocale((await cookies()).get(ROOT_PUBLIC_LOCALE_COOKIE)?.value);
  const copy = rootOnboardingCopy[locale];
  return { title: `${copy.title} | Sponsor.krd`, description: copy.entryDescription };
}

export default async function JoinPage() {
  const locale = parseRootPublicLocale((await cookies()).get(ROOT_PUBLIC_LOCALE_COOKIE)?.value);
  return (
    <RootPublicLocaleProvider initialLocale={locale}>
    <Suspense
      fallback={
        <SkeletonAuthenticationPage brandDescription={rootOnboardingCopy[locale].brand} loadingLabel={rootOnboardingCopy[locale].verifying} language={locale} />
      }
    >
      <InvitationEntryPage />
    </Suspense>
    </RootPublicLocaleProvider>
  );
}
