import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { PublicDirectoryKind, PublicPageDirectory } from "@linktree/types";
import { publicFetch, publicRequestContext } from "@/lib/public/public-page.server";
import { BUSINESS_PUBLIC_LOCALE_COOKIE, publicBusinessLocale } from "@/features/business/i18n/public-locale";
import { ROOT_PUBLIC_LOCALE_COOKIE, parseRootPublicLocale } from "@/features/public-site/root-public-locale";
import { BusinessServiceUnavailablePage } from "@/components/error-pages/BusinessServiceUnavailablePage";
import { businessErrorPageCopy } from "@/features/business/i18n/error-copy";
import { RootPublicLocaleProvider } from "@/features/public-site/RootPublicLocaleProvider";
import { RootPublicLinktreeError } from "@/features/public-site/RootErrorPage";
import { brandIcons } from "@/lib/brand/tab-branding";
import { PublicDirectory } from "./components/PublicDirectory";
import { directoryCopy } from "./directory-copy";
import { directoryCampaignQuery, type DirectorySearchParams } from "./directory-navigation";

export interface PublicDirectoryRouteProps {
  searchParams: Promise<DirectorySearchParams>;
}

const loadDirectory = cache(async (kind: PublicDirectoryKind, page: number) => {
  const context = await publicRequestContext();
  const cookieStore = await cookies();
  const locale = context.isPlatformRoot
    ? parseRootPublicLocale(cookieStore.get(ROOT_PUBLIC_LOCALE_COOKIE)?.value)
    : publicBusinessLocale(cookieStore.get(BUSINESS_PUBLIC_LOCALE_COOKIE)?.value);
  let response: Response;
  try {
    response = await publicFetch(`/api/public/directory/${kind}?page=${page}`);
  } catch (error) {
    console.error("[public-directory] Upstream unavailable", error instanceof Error ? error.name : "Error");
    return { context, locale, data: null };
  }
  if (response.status === 403 || response.status === 404) notFound();
  if (!response.ok) {
    console.error("[public-directory] Upstream read failed", response.status);
    return { context, locale, data: null };
  }
  const body = await response.json() as { data: PublicPageDirectory };
  return { context, locale, data: body.data };
});

function directoryPage(params: DirectorySearchParams): number {
  if (params.page === undefined) return 1;
  if (typeof params.page !== "string" || !/^(?:[1-9]\d{0,3}|10000)$/.test(params.page)) notFound();
  return Number(params.page);
}

export async function PublicDirectoryRoute({ kind, searchParams }: PublicDirectoryRouteProps & { kind: PublicDirectoryKind }) {
  const params = await searchParams;
  const result = await loadDirectory(kind, directoryPage(params));
  if (!result.data) return result.context.isPlatformRoot
    ? <RootPublicLocaleProvider initialLocale={result.locale}><RootPublicLinktreeError kind="serviceUnavailable" /></RootPublicLocaleProvider>
    : <BusinessServiceUnavailablePage pageCopy={businessErrorPageCopy(result.locale, "serviceUnavailable")} />;
  return <PublicDirectory data={result.data} initialLocale={result.locale} isPlatformRoot={result.context.isPlatformRoot} origin={result.context.origin} campaignQuery={directoryCampaignQuery(params)} />;
}

export async function publicDirectoryMetadata(kind: PublicDirectoryKind, props: PublicDirectoryRouteProps): Promise<Metadata> {
  const params = await props.searchParams;
  const page = directoryPage(params);
  const { data, locale, context } = await loadDirectory(kind, page);
  if (!data) return { title: "Unavailable", robots: { index: false, follow: false } };
  const copy = directoryCopy[locale];
  return {
    title: { absolute: kind === "form" ? copy.form : copy.linksTitle },
    description: kind === "form" ? copy.formDescription : copy.linktreeDescription,
    icons: brandIcons(null, data.brand.logo),
    robots: { index: false, follow: true },
    alternates: { canonical: `${context.origin}/${kind}${page > 1 ? `?page=${page}` : ""}` },
  };
}
