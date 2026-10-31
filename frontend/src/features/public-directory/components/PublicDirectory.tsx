"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Link2 } from "lucide-react";
import type { PublicPageDirectory } from "@linktree/types";
import type { BusinessLocale } from "@/features/business/i18n/messages";
import { BusinessPublicSiteShell } from "@/components/business/BusinessPublicSiteShell";
import { businessPublicCopy } from "@/features/business/i18n/public-copy";
import { LanguageToggle, nextLanguageLocale } from "@/components/shared/LanguageToggle";
import { rememberPublicBusinessLocale } from "@/features/business/i18n/public-locale";
import { rememberRootPublicLocale } from "@/features/public-site/root-public-locale";
import { EmptyState } from "@/components/shared/EmptyState";
import { TablePagination } from "@/components/shared/TablePagination";
import { ManagementGridLayout } from "@/components/shared/ManagementGridLayout";
import { parseWebsiteColor } from "@/lib/utils/parse-website-color";
import { directoryCopy } from "../directory-copy";
import { directoryHref } from "../directory-navigation";
import { PublicDirectoryCard } from "./PublicDirectoryCard";

export function PublicDirectory({ data, initialLocale, campaignQuery, isPlatformRoot, origin = "" }: {
  data: PublicPageDirectory;
  initialLocale: BusinessLocale;
  campaignQuery: string;
  isPlatformRoot: boolean;
  origin?: string;
}) {
  const [locale, setLocale] = useState(initialLocale);
  const router = useRouter();
  const copy = directoryCopy[locale];
  const publicCopy = businessPublicCopy[locale];
  const navigation = [{ label: copy.home, href: directoryHref("/", campaignQuery) },
    { label: copy.linktree, href: directoryHref("/linktree", campaignQuery) },
    { label: copy.form, href: directoryHref("/form", campaignQuery) }];
  return (
    <BusinessPublicSiteShell businessName={data.brand.name} logo={data.brand.logo}
      accentColor={parseWebsiteColor(data.brand.accentColor).primary}
      language={locale} navbarCopy={publicCopy.navbar} navigationItems={navigation}
      emphasizeFirstNavItem={false} hideBrandName
      languageControl={<LanguageToggle size="compact" locale={locale} label={publicCopy.switchLanguage} onClick={() => {
        const next = nextLanguageLocale(locale);
        (isPlatformRoot ? rememberRootPublicLocale : rememberPublicBusinessLocale)(next);
        setLocale(next);
      }} />}
      footer={{ copy: publicCopy.footer, brandingRemoved: data.brand.brandingRemoved,
        linktrees: navigation.slice(1).map(({ label, href }) => ({ name: label, href })) }}>
      <section dir={locale === "en" ? "ltr" : "rtl"} className="relative mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col px-5 pb-12 pt-24 sm:px-8 sm:pb-16 sm:pt-28">
        <h1 className="sr-only">{copy[data.kind]}</h1>
        <div className="flex flex-1 flex-col justify-center">
          {data.items.length ? <ManagementGridLayout centered cardSize="large" items={data.items.map((item) => ({ key: item.slug, content:
            <PublicDirectoryCard item={item} kind={data.kind} locale={locale}
              origin={origin} campaignQuery={campaignQuery} />
          }))} /> : <EmptyState compact icon={data.kind === "form" ? FileText : Link2} title={copy.empty} description={copy.emptyDescription} />}
        </div>
        {data.totalPages > 1 && <TablePagination page={data.page} totalPages={data.totalPages}
          totalItems={data.total} pageSize={24}
          copy={copy} onPageChange={(page) => router.push(directoryHref(`/${data.kind}`, campaignQuery, page))} />}
      </section>
    </BusinessPublicSiteShell>
  );
}
