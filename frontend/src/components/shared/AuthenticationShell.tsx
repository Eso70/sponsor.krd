import { AuthenticationHeader } from "./AuthenticationHeader";
import type { AuthenticationLocalePreference } from "./authentication-header-copy";
import { AuthenticationPreviewPanel } from "@/components/shared/AuthenticationPreviewPanel";
import {
  parseWebsiteColor,
  readableInk,
} from "@/lib/utils/parse-website-color";
import {
  BUSINESS_LOGO_PLACEHOLDER,
  SPONSOR_KRD_LOGO,
} from "@/lib/brand/brand-assets";

interface AuthenticationShellProps {
  children: React.ReactNode;
  brandDescription: string;
  backHref?: string;
  wide?: boolean;
  headerAction?: React.ReactNode;
  brandName?: string;
  brandLogo?: string | null;
  accentColor?: string | null;
  previewTitle?: string;
  businessTenant?: boolean;
  backLabel?: string;
  themeCopy?: { label: string; light: string; dark: string };
  language?: string;
  localePreference?: AuthenticationLocalePreference;
}

export function AuthenticationShell({
  children,
  brandDescription,
  backHref = "/",
  wide = false,
  headerAction,
  brandName,
  brandLogo,
  accentColor,
  previewTitle,
  businessTenant = false,
  backLabel,
  themeCopy,
  language,
  localePreference,
}: AuthenticationShellProps) {
  const accent = accentColor ? parseWebsiteColor(accentColor) : null;
  const themeStyle = accent
    ? ({
        "--business-website-color": accent.primary,
        "--theme-primary": accent.primary,
        "--theme-css": accent.css,
        "--sponsor-krd-accent": accent.primary,
        "--sponsor-krd-accent-ink": readableInk(accent.primary),
        "--sponsor-krd-accent-hover": `color-mix(in srgb, ${accent.primary} 86%, black)`,
      } as React.CSSProperties)
    : businessTenant
      ? ({
          "--business-website-color": "var(--theme-primary, #64748b)",
          "--theme-primary": "var(--theme-primary, #64748b)",
          "--theme-css": "var(--theme-css, #64748b)",
          "--sponsor-krd-accent": "var(--business-website-color, #1e293b)",
          "--sponsor-krd-accent-ink": "#ffffff",
          "--sponsor-krd-accent-hover":
            "color-mix(in srgb, var(--sponsor-krd-accent, #1e293b) 86%, black)",
        } as React.CSSProperties)
      : undefined;

  const effectiveBrandName =
    brandName ?? (businessTenant ? "بزنس" : "Sponsor.krd");
  const effectiveBrandLogo =
    brandLogo !== undefined
      ? brandLogo
      : businessTenant
        ? BUSINESS_LOGO_PLACEHOLDER
        : SPONSOR_KRD_LOGO;
  const effectivePreviewTitle =
    previewTitle ??
    (businessTenant || effectiveBrandName !== "Sponsor.krd"
      ? "پانێڵی بزنس"
      : undefined);

  return (
    <main
      lang={language}
      dir="ltr"
      data-sponsor-krd-theme={accent || businessTenant ? undefined : true}
      className={`${accent ? "custom-scrollbar theme-custom-scrollbar" : ""} relative flex min-h-dvh min-w-0 flex-col bg-[#f7f8fa] text-slate-900 transition-colors dark:bg-[#0d0f12] dark:text-white`}
      style={themeStyle}
    >
      <AuthenticationHeader
        backHref={backHref}
        backLabel={backLabel}
        themeCopy={themeCopy}
        language={language}
        headerAction={headerAction}
        localePreference={
          localePreference ?? (businessTenant ? "business" : "public")
        }
      />
      <div
        className="grid min-h-dvh min-w-0 flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]"
        dir="ltr"
      >
        <section className="flex min-w-0 flex-col justify-center px-5 pb-10 pt-20 sm:px-8 lg:px-10 lg:py-20">
          <div className="flex min-w-0 items-center justify-center">
            <div
              className={`min-w-0 w-full ${wide ? "max-w-4xl" : "max-w-lg"}`}
            >
              {children}
            </div>
          </div>
        </section>
        <AuthenticationPreviewPanel
          description={brandDescription}
          brandName={effectiveBrandName}
          brandLogo={effectiveBrandLogo}
          title={effectivePreviewTitle}
          businessTenant={businessTenant}
        />
      </div>
    </main>
  );
}
