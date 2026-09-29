"use client";

import { useState } from "react";
import { BusinessPublicSiteShell } from "@/components/business/BusinessPublicSiteShell";
import { BusinessHeroAccentBackdrop } from "@/components/business/BusinessHeroAccentBackdrop";
import { PublicBusinessLanguageToggle } from "@/features/business/components/PublicBusinessLanguageToggle";
import { businessPublicCopy } from "@/features/business/i18n/public-copy";
import type { BusinessLocale } from "@/features/business/i18n/messages";
import { AdvertisingVideoPlayer } from "./AdvertisingVideoPlayer";
import type { AdvertisingBusinessBranding, AdvertisingServiceConfig } from "../types";
import { translatePublicAdvertisingText } from "../public-locale";

interface PublicVideoCodePageProps {
  branding: AdvertisingBusinessBranding;
  /** Always supplied by the server: the route 404s when no published page exists. */
  config: AdvertisingServiceConfig;
  embedded?: boolean;
  initialLocale?: BusinessLocale;
  footer?: {
    description?: string | null;
    phone?: string | null;
    whatsappEnabled?: boolean | null;
    linktrees?: Array<{ name: string; href: string }>;
  };
}

export function PublicVideoCodePage({
  branding,
  config,
  embedded = false,
  initialLocale = "ckb",
  footer,
}: PublicVideoCodePageProps) {
  const [locale, setLocale] = useState<BusinessLocale>(initialLocale);
  const copy = businessPublicCopy[locale];
  const accent = branding.accentColor || "#111827";

  return (
    <BusinessPublicSiteShell
      embedded={embedded}
      businessName={branding.name}
      logo={branding.logo}
      accentColor={accent}
      homeHref="/"
      navbarCopy={copy.navbar}
      language={locale}
      languageControl={<PublicBusinessLanguageToggle locale={locale} onChange={setLocale} />}
      navigationItems={[{ label: copy.nav.advertising, href: "/advertising" }]}
      action={{ label: copy.advertising.back, href: "/advertising" }}
      footer={{
        copy: copy.footer,
        logo: branding.logo,
        description: footer?.description,
        phone: footer?.phone,
        whatsappEnabled: footer?.whatsappEnabled,
        // Reaching this page means the advertising pages are live, so the
        // footer can link to them.
        advertisingEnabled: true,
        linktrees: footer?.linktrees,
      }}
    >
      <section className="relative overflow-hidden bg-transparent px-5 pb-20 pt-36 text-center sm:px-8 sm:pb-24 sm:pt-40">
        <BusinessHeroAccentBackdrop accentColor={accent} />
        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6">
          {config.videoTutorialTitle.trim() && (
            <h1
              className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl"
              dir="auto"
            >
              {config.videoTutorialTitle}
            </h1>
          )}

          <div className="w-full max-w-sm overflow-hidden rounded-[2rem] border border-black/10 shadow-xl dark:border-white/10">
            <div className="aspect-[9/16] w-full">
              <AdvertisingVideoPlayer size="full" src={config.videoUrl} copy={{
                empty: translatePublicAdvertisingText("هیچ ڤیدیۆیەک دانەنراوە", locale),
                title: translatePublicAdvertisingText("ڤیدیۆی فێرکاری", locale),
                play: translatePublicAdvertisingText("لێدانی ڤیدیۆ", locale),
              }} />
            </div>
          </div>
        </div>
      </section>
    </BusinessPublicSiteShell>
  );
}
