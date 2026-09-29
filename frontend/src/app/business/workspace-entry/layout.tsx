import type { Metadata } from "next";
import { cookies } from "next/headers";
import { BUSINESS_LOCALE_COOKIE, businessLocaleFromCookie } from "@/features/business/i18n/locale-cookie";
import { businessPreAuthCopy } from "@/features/business/i18n/pre-auth-copy";

export async function generateMetadata(): Promise<Metadata> {
  const locale = businessLocaleFromCookie((await cookies()).get(BUSINESS_LOCALE_COOKIE)?.value);
  return {
    title: businessPreAuthCopy[locale].entryTitle,
    description: businessPreAuthCopy[locale].entryDescription,
    robots: "noindex, nofollow",
  };
}

export default function BusinessWorkspaceEntryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
