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
   * Whether this business has a live advertising page. Plans below the top one
   * do not, and those two routes 404 for them — a footer link to a dead page is
   * worse than no link.
   */
  advertisingEnabled?: boolean;
  /**
   * Ultra pays to drop the "Powered by Sponsor.krd" badge. Read from the live
   * entitlement, so a downgrade puts the badge back.
   */
  brandingRemoved?: boolean;
  copy?: Partial<Record<"home" | "advertise" | "videoPage" | "pages" | "publicPages" | "contact" | "officialSite" | "rightsReserved" | "poweredBy" | "logoLabel", string>>;
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
  advertisingEnabled = false,
  brandingRemoved = false,
  copy,
}: BusinessPublicFooterProps) {
  const phone = normalizePhone(phoneValue);
  const columns: PublicFooterColumn[] = [];

  const pageLinks: BusinessPublicFooterPage[] = [];
  if (homeHref) pageLinks.push({ name: copy?.home ?? "Home", href: homeHref });
  if (advertisingEnabled) {
    pageLinks.push({ name: copy?.advertise ?? "Advertise", href: "/advertising" });
    pageLinks.push({ name: copy?.videoPage ?? "Video page", href: "/advertising/video-code" });
  }
  // Without the advertising links this column can end up empty, and a heading
  // over nothing reads as a rendering fault.
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
