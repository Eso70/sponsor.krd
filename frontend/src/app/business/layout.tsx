import { dashboardInstallMetadata } from "@/lib/brand/dashboard-install";
import type { Metadata } from "next";
import { headers, cookies } from "next/headers";
import { requestBranding } from "@/lib/brand/request-branding.server";
import { privateTabTitle } from "@/lib/brand/tab-sections";
import { BUSINESS_LOCALE_COOKIE, businessLocaleFromCookie } from "@/features/business/i18n/locale-cookie";

export async function generateMetadata(): Promise<Metadata> {
  const [branding, headerStore, cookieStore] = await Promise.all([requestBranding(), headers(), cookies()]);
  const path = headerStore.get("x-public-path") || "/business";
  const segment = path.split("/").filter(Boolean).at(-1) || "pages";
  const page = segment === "business" ? (cookieStore.has("business_session") ? "pages" : "login") : segment;
  return {...dashboardInstallMetadata(branding.name, "/business"), title: {absolute: privateTabTitle(page, branding.name, businessLocaleFromCookie(cookieStore.get(BUSINESS_LOCALE_COOKIE)?.value))}, robots: {index: false, follow: false}};
}
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * The business dashboard and its login screen.
 *
 * Deliberately carries no TikTok pixel. These are private, authenticated
 * screens: a business signing in or editing their page is not an audience
 * TikTok should be shown, and reporting those visits pollutes the same pixel
 * the public pages use — the owner's own sessions would be counted as traffic
 * and would train the ad algorithm on the wrong people.
 *
 * The pixel belongs to the public surfaces only: the business subdomain
 * homepage and its Linktrees.
 */
export default function BusinessLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
