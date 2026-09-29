"use client";

import { PublicSiteFooter } from "@/components/public/PublicSiteFooter";
import { SPONSOR_KRD_LOGO } from "@/lib/brand/brand-assets";
import { useOptionalRootPublicLocale } from "./RootPublicLocaleProvider";
import { rootPublicCopy } from "./root-public-copy";

export function SponsorKrdMarketingFooter({
  accentColor,
}: {
  accentColor: string;
}) {
  const locale = useOptionalRootPublicLocale()?.locale ?? "ckb";
  const copy = rootPublicCopy[locale].footer;
  return (
    <PublicSiteFooter
      brandName="Sponsor.krd"
      logo={SPONSOR_KRD_LOGO}
      description={copy.description}
      accentColor={accentColor}
      appearance="landing"
      direction="ltr"
      homeHref="/"
      showPoweredBy={false}
      copyrightText={`© ${new Date().getFullYear()} Sponsor.krd — ${copy.rights}`}
      bottomLinks={[
        { label: copy.terms, href: "/legal/terms" },
        { label: copy.privacy, href: "/legal/privacy" },
      ]}
      columns={[]}
    />
  );
}
