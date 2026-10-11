"use client";

import { useState } from "react";
import { BusinessHero } from "@/components/business/BusinessHero";
import { BusinessPublicSiteShell } from "@/components/business/BusinessPublicSiteShell";
import {
  BUSINESS_LANDING_SECTION_HREFS,
  BUSINESS_LANDING_SECTION_IDS,
} from "@/components/business/business-landing-sections";
import { SPONSOR_KRD_ACCENT_COLOR } from "@/lib/sponsor-krd-theme";
import { parseWebsiteColor } from "@/lib/utils/parse-website-color";
import type { BusinessLocale } from "@/features/business/i18n/messages";
import { businessPublicCopy } from "@/features/business/i18n/public-copy";
import { PublicBusinessLanguageToggle } from "@/features/business/components/PublicBusinessLanguageToggle";

interface BusinessData {
  id: string;
  name: string;
  subdomain: string;
  logo?: string | null;
  favicon?: string | null;
  default_avatar?: string | null;
  website_color?: string | null;
  footer_text?: string | null;
  footer_phone?: string | null;
  whatsapp_enabled?: boolean | null;
  advertising_enabled?: boolean | null;
  branding_removed?: boolean | null;
}

function whatsappHref(value?: string | null): string | null {
  const digits = (value || "").replace(/\D/g, "");
  return digits.length >= 8 ? `https://wa.me/${digits}` : null;
}

export function BusinessLanding({
  business,
  initialLocale = "ckb",
}: {
  business: BusinessData;
  initialLocale?: BusinessLocale;
}) {
  const [locale, setLocale] = useState(initialLocale);
  const copy = businessPublicCopy[locale];
  const accentColor = parseWebsiteColor(
    business.website_color || SPONSOR_KRD_ACCENT_COLOR,
  ).primary;
  const contactHref = business.whatsapp_enabled
    ? whatsappHref(business.footer_phone)
    : null;

  return (
    <BusinessPublicSiteShell
      id={BUSINESS_LANDING_SECTION_IDS.home}
      businessName={business.name}
      logo={
        business.logo || business.default_avatar || "/images/DefaultAvatar.png"
      }
      accentColor={accentColor}
      homeHref={BUSINESS_LANDING_SECTION_HREFS.home}
      language={locale}
      languageControl={
        <PublicBusinessLanguageToggle locale={locale} onChange={setLocale} />
      }
      navbarCopy={copy.navbar}
      navigationItems={[
        ...(business.advertising_enabled
          ? [{ label: copy.nav.advertising, href: "/advertising" }]
          : []),
      ]}
      action={
        contactHref
          ? { label: copy.nav.contact, href: contactHref, external: true }
          : null
      }
      footer={{
        logo: business.logo || business.default_avatar,
        description: business.footer_text?.trim() || undefined,
        copy: copy.footer,
        phone: business.footer_phone,
        whatsappEnabled: business.whatsapp_enabled,
        advertisingEnabled: Boolean(business.advertising_enabled),
        brandingRemoved: Boolean(business.branding_removed),
      }}
    >
      <BusinessHero accentColor={accentColor} locale={locale} />
    </BusinessPublicSiteShell>
  );
}
