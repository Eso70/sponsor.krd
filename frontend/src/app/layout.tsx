import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { cookies, headers } from "next/headers";
import { extractSubdomain } from "@/lib/subdomain-utils";
import {
  BUSINESS_FAVICON_PLACEHOLDER,
  SPONSOR_KRD_APPLE_ICON,
  SPONSOR_KRD_FAVICON,
} from "@/lib/brand/brand-assets";
import { getAppBaseUrl } from "@/lib/utils/app-url";
import { AppToaster } from "@/components/shared/AppToaster";
import { GlobalInputLimits } from "@/components/shared/GlobalInputLimits";
import { AppMotionProvider } from "@/components/motion/AppMotionProvider";
import { APP_THEME_COOKIE } from "@/lib/app-theme";
import {
  createSponsorKrdThemeVariables,
  SPONSOR_KRD_ACCENT_COLOR,
} from "@/lib/sponsor-krd-theme";
import "./globals.css";
import { PublicRouteTracking } from "@/components/analytics/PublicRouteTracking";
import { resolveLinktreeHost } from "@/lib/public/linktree-host";
import { fetchPublicLinktree } from "@/lib/public/public-page.server";
import { automaticPageSeo } from "@/lib/public/page-seo";
import { ROOT_PUBLIC_LOCALE_COOKIE, parseRootPublicLocale } from "@/features/public-site/root-public-locale";
import { BUSINESS_PUBLIC_LOCALE_COOKIE, publicBusinessLocale } from "@/features/business/i18n/public-locale";

/* Applied in the initial HTML while the full stylesheet initializes. */
const criticalCursor =
  'url("/cursors/customCursor.svg") 10 2, default';

const sponsorKrdThemeStyle =
  createSponsorKrdThemeVariables() as CSSProperties;

const baseMetadata: Metadata = {
  metadataBase: new URL(getAppBaseUrl()),
  title: "Sponsor.krd",
  description:
    "Sponsor.krd connects communities with networking opportunities tailored for growth and support.",
  formatDetection: {
    telephone: false,
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host") || "";
  const tenant = extractSubdomain(
    host,
    undefined,
    process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost",
  );
  return {
    ...baseMetadata,
    icons: {
      icon: tenant ? BUSINESS_FAVICON_PLACEHOLDER : SPONSOR_KRD_FAVICON,
      apple: tenant ? BUSINESS_FAVICON_PLACEHOLDER : SPONSOR_KRD_APPLE_ICON,
    },
  };
}

export const viewport: Viewport = {
  themeColor: SPONSOR_KRD_ACCENT_COLOR,
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover", // For devices with notches
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialTheme = cookieStore.get(APP_THEME_COOKIE)?.value;
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-public-path") || "";
  const scope = resolveLinktreeHost(requestHeaders.get("host") || "", process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost");
  let language = "en";
  const linktree = pathname.match(/^\/linktree\/([a-z0-9-]{1,50})\/?$/);
  if (linktree) {
    const result = await fetchPublicLinktree(linktree[1]);
    language = result && typeof result !== "string" ? automaticPageSeo(result.linktree).locale : "ckb";
  } else if (pathname === "/" || pathname.startsWith("/legal/")) {
    language = scope.isPlatformRoot || pathname.startsWith("/legal/")
      ? parseRootPublicLocale(cookieStore.get(ROOT_PUBLIC_LOCALE_COOKIE)?.value)
      : publicBusinessLocale(cookieStore.get(BUSINESS_PUBLIC_LOCALE_COOKIE)?.value);
  }

  return (
    <html
      className={initialTheme === "dark" ? "dark" : undefined}
      lang={language}
      dir="ltr"
      style={sponsorKrdThemeStyle}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content={SPONSOR_KRD_ACCENT_COLOR} />
        {/* Prevent browser caching of HTML pages */}
        <meta
          httpEquiv="Cache-Control"
          content="no-cache, no-store, must-revalidate"
        />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <meta name="format-detection" content="telephone=no" />
        {/* Browser compatibility meta tags */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <link
          rel="preload"
          href="/cursors/customCursor.svg"
          as="image"
          type="image/svg+xml"
          fetchPriority="high"
        />
        <link
          rel="preload"
          href="/cursors/customTextSelect.svg"
          as="image"
          type="image/svg+xml"
          fetchPriority="high"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <AppMotionProvider>
          <GlobalInputLimits />
          <style
            id="critical-custom-cursor"
            dangerouslySetInnerHTML={{
              __html: `:where(html,body,body *){cursor:${criticalCursor}}`,
            }}
          />
          <div
            data-theme-background
            className="relative min-h-screen min-h-[100dvh] w-full overflow-x-clip text-slate-900 dark:text-white"
            style={{
              background: `linear-gradient(to bottom right, var(--theme-bg-from, #f8fafc), var(--theme-bg-via, #ffffff), var(--theme-bg-to, #f1f5f9))`,
              backgroundAttachment: "scroll", // Safari/iOS: Use scroll instead of fixed for better performance
              backgroundSize: "200% 200%",
              contain: "layout style", // Performance optimization (removed 'paint' to not break position: fixed)
              isolation: "isolate", // Create new stacking context
            }}
            suppressHydrationWarning
          >
            <div className="relative z-10" suppressHydrationWarning>
              {children}
            </div>
          </div>
          <AppToaster />
          <PublicRouteTracking />
        </AppMotionProvider>
      </body>
    </html>
  );
}
