import type { ReactNode } from "react";
import {
  BusinessPublicFooter,
  type BusinessPublicFooterProps,
} from "@/components/business/BusinessPublicFooter";
import { PublicMarketingSiteShell } from "@/components/public/PublicMarketingSiteShell";

interface BusinessPublicSiteShellProps {
  accentColor: string;
  businessName: string;
  children: ReactNode;
  embedded?: boolean;
  footer: Omit<BusinessPublicFooterProps, "accentColor" | "businessName">;
  homeHref?: string;
  id?: string;
  logo?: string | null;
  navigationItems?: ReadonlyArray<{ label: string; href: string }>;
  action?: { label: string; href: string; external?: boolean } | null;
  emphasizeFirstNavItem?: boolean;
  hideBrandName?: boolean;
  navbarCopy?: Partial<Record<"navigation" | "theme" | "menu" | "logo", string>>;
  language?: string;
  languageControl?: ReactNode;
}

export function BusinessPublicSiteShell({
  accentColor,
  businessName,
  children,
  embedded = false,
  footer,
  homeHref = "/",
  id,
  logo,
  navigationItems,
  action,
  emphasizeFirstNavItem = true,
  hideBrandName = false,
  navbarCopy,
  language,
  languageControl,
}: BusinessPublicSiteShellProps) {
  return (
    <PublicMarketingSiteShell
      id={id}
      accentColor={accentColor}
      brandName={businessName}
      logo={logo}
      homeHref={homeHref}
      navigationItems={navigationItems}
      primaryAction={action}
      emphasizeFirstNavItem={emphasizeFirstNavItem}
      hideBrandName={hideBrandName}
      embedded={embedded}
      navbarCopy={navbarCopy}
      language={language}
      languageControl={languageControl}
      footer={
        <BusinessPublicFooter
          {...footer}
          businessName={businessName}
          accentColor={accentColor}
          logo={footer.logo || logo}
          homeHref={homeHref}
        />
      }
    >
      {children}
    </PublicMarketingSiteShell>
  );
}
