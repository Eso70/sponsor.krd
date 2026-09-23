import { BusinessHero } from "@/components/business/BusinessHero";
import { BusinessPublicLinktreesSection } from "@/components/business/BusinessPublicLinktreesSection";
import type { PublicBusinessLinktree } from "@/components/business/BusinessPublicLinktreeCard";
import { BusinessPublicSiteShell } from "@/components/business/BusinessPublicSiteShell";
import {
  BUSINESS_LANDING_SECTION_HREFS,
  BUSINESS_LANDING_SECTION_IDS,
} from "@/components/business/business-landing-sections";
import { SPONSOR_KRD_ACCENT_COLOR } from "@/lib/sponsor-krd-theme";
import { parseWebsiteColor } from "@/lib/utils/parse-website-color";

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
  linktrees,
}: {
  business: BusinessData;
  linktrees: PublicBusinessLinktree[];
}) {
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
      navigationItems={[
        ...(linktrees.length > 0
          ? [{ label: "لینکترییەکان", href: BUSINESS_LANDING_SECTION_HREFS.workspace }]
          : []),
        ...(business.advertising_enabled
          ? [{ label: "ڕیکلام", href: "/advertising" }]
          : []),
      ]}
      action={
        contactHref
          ? { label: "پەیوەندی", href: contactHref, external: true }
          : null
      }
      footer={{
        logo: business.logo || business.default_avatar,
        description:
          business.footer_text?.trim() ||
          `${business.name}'s official public website.`,
        phone: business.footer_phone,
        whatsappEnabled: business.whatsapp_enabled,
        advertisingEnabled: Boolean(business.advertising_enabled),
        brandingRemoved: Boolean(business.branding_removed),
        linktrees: linktrees.map((item) => ({
          name: item.name,
          href: `/linktree/${item.seo_name || item.uid}`,
        })),
      }}
    >
      <BusinessHero accentColor={accentColor} />
      {linktrees.length > 0 && (
        <BusinessPublicLinktreesSection linktrees={linktrees} />
      )}
    </BusinessPublicSiteShell>
  );
}
