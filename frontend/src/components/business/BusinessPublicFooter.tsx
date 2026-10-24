import { PublicSiteFooter, type PublicFooterColumn } from "@/components/public/PublicSiteFooter";

interface BusinessPublicFooterPage {
  name: string;
  href: string;
}

export interface BusinessPublicFooterProps {
  businessName: string;
  logo?: string | null;
  description?: string | null;
  phone?: string | null;
  whatsappEnabled?: boolean | null;
  accentColor: string;
  linktrees?: BusinessPublicFooterPage[];
  homeHref?: string;
  /**
   * Ultra pays to drop the "Powered by Sponsor.krd" badge. Read from the live
   * entitlement, so a downgrade puts the badge back.
   */
  brandingRemoved?: boolean;
  copy?: Partial<Record<"home" | "pages" | "publicPages" | "contact" | "officialSite" | "rightsReserved" | "poweredBy" | "logoLabel", string>>;
}

function normalizePhone(value?: string | null) {
  const display = value?.trim() || "";
  const tel = display.replace(/[^+\d]/g, "");
  const whatsapp = display.replace(/\D/g, "");
  return {
    display,
    telHref: tel.length >= 5 ? `tel:${tel}` : null,
    whatsappHref: whatsapp.length >= 8 ? `https://wa.me/${whatsapp}` : null,
  };
}

export function BusinessPublicFooter({
  businessName,
  logo,
  description,
  phone: phoneValue,
  whatsappEnabled,
  accentColor,
  linktrees = [],
  homeHref,
  brandingRemoved = false,
  copy,
}: BusinessPublicFooterProps) {
  const phone = normalizePhone(phoneValue);
  const columns: PublicFooterColumn[] = [];

  const pageLinks: BusinessPublicFooterPage[] = [];
  if (homeHref) pageLinks.push({ name: copy?.home ?? "Home", href: homeHref });
  if (pageLinks.length > 0) {
    columns.push({
      title: copy?.pages ?? "Pages",
      links: pageLinks.map((page) => ({ label: page.name, href: page.href })),
    });
  }
  if (linktrees.length > 0) {
    columns.push({
      title: copy?.publicPages ?? "Public pages",
      links: linktrees.slice(0, 5).map((page) => ({
        label: page.name,
        href: page.href,
      })),
    });
  }
  if (phone.telHref) {
    columns.push({
      title: copy?.contact ?? "Contact",
      links: [
        { label: phone.display, href: phone.telHref },
        ...(whatsappEnabled && phone.whatsappHref
          ? [
              {
                label: "WhatsApp",
                href: phone.whatsappHref,
                external: true,
              },
            ]
          : []),
      ],
    });
  }

  return (
    <PublicSiteFooter
      showPoweredBy={!brandingRemoved}
      poweredByLabel={copy?.poweredBy}
      logoLabel={copy?.logoLabel ? `${businessName} ${copy.logoLabel}` : undefined}
      brandName={businessName}
      logo={logo}
      description={
        description?.trim() || (copy?.officialSite ? `${businessName} ${copy.officialSite}` : `${businessName}'s official public website.`)
      }
      accentColor={accentColor}
      appearance="landing"
      columns={columns}
      homeHref={homeHref}
      copyrightText={`© ${new Date().getFullYear()} ${businessName}. ${copy?.rightsReserved ?? "All rights reserved."}`}
    />
  );
}
