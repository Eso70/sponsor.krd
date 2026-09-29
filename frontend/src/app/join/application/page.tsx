import { BusinessSignupWizard } from "@/features/onboarding/components/BusinessSignupWizard";
import { cookies } from "next/headers";
import { RootPublicLocaleProvider } from "@/features/public-site/RootPublicLocaleProvider";
import { ROOT_PUBLIC_LOCALE_COOKIE, parseRootPublicLocale } from "@/features/public-site/root-public-locale";
import { rootOnboardingCopy } from "@/features/onboarding/root-onboarding-copy";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = parseRootPublicLocale((await cookies()).get(ROOT_PUBLIC_LOCALE_COOKIE)?.value);
  const copy = rootOnboardingCopy[locale];
  return { title: `${copy.title} | Sponsor.krd`, description: copy.formDescription };
}

export default async function SignupApplicationPage() {
  const locale = parseRootPublicLocale((await cookies()).get(ROOT_PUBLIC_LOCALE_COOKIE)?.value);
  return <RootPublicLocaleProvider initialLocale={locale}><BusinessSignupWizard /></RootPublicLocaleProvider>;
}
