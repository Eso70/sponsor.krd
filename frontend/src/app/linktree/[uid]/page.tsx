import { notFound } from "next/navigation";
import { cookies, headers } from "next/headers";
import dynamicImport from "next/dynamic";
import { PublicLinktreeLoading } from "@/components/public/PublicLinktreeLoading";
import type {
  LinktreeLink as Link,
  PublicLinktree as Linktree,
  PublicPageAnalytics,
} from "@linktree/types";
import { SPONSOR_KRD_ACCENT_COLOR } from "@/lib/sponsor-krd-theme";
import {
  INTERNAL_PROXY_KEY_HEADER,
  internalProxyKey,
} from "@/lib/security/internal-proxy-key";
import { BusinessServiceUnavailablePage } from "@/components/error-pages/BusinessServiceUnavailablePage";
import { BusinessGonePage } from "@/components/error-pages/BusinessGonePage";
import { BusinessInactivePage } from "@/components/error-pages/BusinessInactivePage";
import { BusinessBadGatewayPage } from "@/components/error-pages/BusinessBadGatewayPage";
import { BusinessGatewayTimeoutPage } from "@/components/error-pages/BusinessGatewayTimeoutPage";
import { classifyUpstreamFailure } from "@/lib/api/upstream-failure";
import { shortTabTitle } from "@/lib/utils/tab-title";
import { TikTokPixelBaseCode } from "@/components/analytics/TikTokPixelBaseCode";
import {
  BUSINESS_FAVICON_PLACEHOLDER,
  BUSINESS_LOGO_PLACEHOLDER,
} from "@/lib/brand/brand-assets";
import { resolveLinktreeHost } from "@/lib/public/linktree-host";
import { BUSINESS_PUBLIC_LOCALE_COOKIE, publicBusinessLocale } from "@/features/business/i18n/public-locale";
import { publicLinktreeCopy } from "@/features/business/i18n/public-linktree-copy";
import { businessErrorPageCopy } from "@/features/business/i18n/error-copy";
import type { BusinessLocale } from "@/features/business/i18n/messages";
import { ROOT_PUBLIC_LOCALE_COOKIE, parseRootPublicLocale } from "@/features/public-site/root-public-locale";
import { RootPublicLocaleProvider } from "@/features/public-site/RootPublicLocaleProvider";
import { RootPublicLinktreeError } from "@/features/public-site/RootErrorPage";

// Dynamically import LinktreePage to reduce initial bundle size
const LinktreePage = dynamicImport(
  () =>
    import("@/components/public/LinktreePage").then((mod) => ({
      default: mod.LinktreePage,
    })),
  {
    loading: PublicLinktreeLoading,
    ssr: true,
  },
);

// No caching - always fetch fresh data for accuracy
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ uid: string }>;
}

interface PublicLinktreeBody {
  linktree?: Linktree;
  links?: Link[];
  analytics?: PublicPageAnalytics;
}

interface PublicLinktreeResponse extends PublicLinktreeBody {
  data?: PublicLinktreeBody;
}

/** No pixel and no registered actions, for a response that carried neither. */
const NO_ANALYTICS: PublicPageAnalytics = { pixelIds: [], actions: {} };

async function publicVisitorLocale(): Promise<BusinessLocale> {
  const host = (await headers()).get("host")?.split(":")[0].toLowerCase() || "";
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost").split(":")[0].toLowerCase();
  const cookieStore = await cookies();
  if (resolveLinktreeHost(host, rootDomain).isPlatformRoot) {
    return parseRootPublicLocale(cookieStore.get(ROOT_PUBLIC_LOCALE_COOKIE)?.value);
  }
  return publicBusinessLocale(cookieStore.get(BUSINESS_PUBLIC_LOCALE_COOKIE)?.value);
}

async function fetchLinktreeData(uid: string): Promise<
  | {
      linktree: Linktree;
      links: Link[];
      analytics: PublicPageAnalytics;
      isPlatformRoot: boolean;
    }
  | "bad-gateway"
  | "gone"
  | "inactive"
  | "gateway-timeout"
  | "service-unavailable"
  | null
> {
  try {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    // Extract subdomain from host header for subdomain-scoped public access
    const headerStore = await headers();
    const host = headerStore.get("host") || "";
    const hostname = host.split(":")[0].toLowerCase();
    const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost")
      .split(":")[0]
      .toLowerCase();
    const { isPlatformRoot, subdomain } = resolveLinktreeHost(
      hostname,
      rootDomain,
    );
    const clientIp =
      headerStore.get("x-forwarded-for") || headerStore.get("x-real-ip") || "";

    const fetchHeaders: Record<string, string> = {
      "x-subdomain": subdomain,
      [INTERNAL_PROXY_KEY_HEADER]: internalProxyKey() || "",
    };
    if (clientIp) {
      fetchHeaders["x-forwarded-for"] = clientIp;
    }

    const endpoint = isPlatformRoot
      ? `/api/public/platform/linktree/${uid}`
      : `/api/public/linktree/${uid}`;
    const res = await fetch(`${backendUrl}${endpoint}`, {
      headers: fetchHeaders,
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });

    if (res.status === 403) return "inactive";
    if (res.status === 410) return "gone";
    if (res.status === 502) return "bad-gateway";
    if (res.status === 503) return "service-unavailable";
    if (res.status === 504) return "gateway-timeout";

    if (!res.ok) {
      console.error(
        `[fetchLinktreeData] Backend responded with status ${res.status} (subdomain: "${subdomain}", uid: "${uid}")`,
      );
      return null;
    }

    const json = (await res.json()) as PublicLinktreeResponse;
    const data = json.data || json;
    if (!data.linktree) return null;
    return {
      linktree: data.linktree,
      links: data.links || [],
      analytics: data.analytics || NO_ANALYTICS,
      isPlatformRoot,
    };
  } catch (error) {
    console.error(
      `[fetchLinktreeData] Connection or mapping error for UID "${uid}":`,
      error,
    );
    return classifyUpstreamFailure(error).status === 504
      ? "gateway-timeout"
      : "service-unavailable";
  }
}

export default async function LinktreePublicPage({ params }: PageProps) {
  const { uid } = await params;
  const visitorLocale = await publicVisitorLocale();

  const result = await fetchLinktreeData(uid);

  if (result === "service-unavailable" || result === "bad-gateway" || result === "gateway-timeout" || result === "gone" || result === "inactive") {
    const host = (await headers()).get("host")?.split(":")[0].toLowerCase() || "";
    const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost").split(":")[0].toLowerCase();
    if (resolveLinktreeHost(host, rootDomain).isPlatformRoot) {
      const kind = { "service-unavailable": "serviceUnavailable", "bad-gateway": "badGateway", "gateway-timeout": "gatewayTimeout", gone: "gone", inactive: "inactive" } as const;
      return <RootPublicLocaleProvider initialLocale={parseRootPublicLocale(visitorLocale)}><RootPublicLinktreeError kind={kind[result]} /></RootPublicLocaleProvider>;
    }
  }

  if (result === "service-unavailable") {
    return <BusinessServiceUnavailablePage pageCopy={businessErrorPageCopy(visitorLocale, "serviceUnavailable")} />;
  }
  if (result === "bad-gateway") {
    return <BusinessBadGatewayPage pageCopy={businessErrorPageCopy(visitorLocale, "badGateway")} />;
  }
  if (result === "gateway-timeout") {
    return <BusinessGatewayTimeoutPage pageCopy={businessErrorPageCopy(visitorLocale, "gatewayTimeout")} />;
  }
  if (result === "gone") {
    return <BusinessGonePage pageCopy={businessErrorPageCopy(visitorLocale, "gone")} />;
  }
  if (result === "inactive") {
    return <BusinessInactivePage pageCopy={businessErrorPageCopy(visitorLocale, "inactive")} />;
  }

  if (!result || !result.linktree) {
    notFound();
  }

  const { linktree, links, analytics } = result;
  const locale = "ckb";

  // A template for the page the pixel belongs to, in the HTML itself: TikTok's
  // verifier reads the served document, and the base code has to be there at
  // parse time rather than after hydration. The tracker still reports the
  // page view and fires events; this only makes the tag present and loadable.
  const headerStore = await headers();
  const nonce = headerStore.get("x-nonce") || "";
  // Reporting is the page's own job; see docs/tracking.md.
  return (
    <>
      <TikTokPixelBaseCode pixelIds={analytics.pixelIds} nonce={nonce} />
      <LinktreePage
        linktree={linktree}
        links={links}
        analytics={analytics}
        enableMarketingTracking
        initialLocale={locale}
      />
    </>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { uid } = await params;
  const visitorLocale = await publicVisitorLocale();

  // Redirect /id to root in metadata as well
  if (uid === "id") {
    return {
      title: "Sponsor.krd",
      description: publicLinktreeCopy[visitorLocale ?? "ckb"].description,
    };
  }

  const result = await fetchLinktreeData(uid);

  if (result === "service-unavailable") {
    return { title: visitorLocale === "ar" ? "الخدمة غير متاحة" : "Unavailable" };
  }
  if (result === "bad-gateway") return { title: visitorLocale === "ar" ? "تعذّر الاتصال بالخدمة" : "Upstream Error" };
  if (result === "gateway-timeout") return { title: visitorLocale === "ar" ? "انتهت مهلة الاتصال" : "Timeout" };
  if (result === "gone") return { title: visitorLocale === "ar" ? "المحتوى لم يعد متاحًا" : "Gone" };
  if (result === "inactive") return { title: visitorLocale === "ar" ? "هذه الصفحة معطلة" : "Inactive" };

  if (!result || !result.linktree) {
    return {
      title: visitorLocale === "ar" ? "الصفحة غير موجودة" : "Not Found",
    };
  }

  const { linktree } = result;
  const locale = "ckb";
  const defaultDescription = publicLinktreeCopy[locale].description;

  // Only the business's own favicon is offered as a tab icon: a larger
  // `sizes` entry beside it (the logo, the default avatar) is a candidate the
  // browser prefers, which is how the default avatar ended up in the tab
  // instead of the favicon the business uploaded.
  const iconEntries = [
    {
      url:
        linktree.business_favicon ||
        linktree.business_logo ||
        BUSINESS_FAVICON_PLACEHOLDER,
    },
  ];

  return {
    title: shortTabTitle(linktree.name),
    description:
      linktree.description && linktree.description !== publicLinktreeCopy.ckb.description
        ? linktree.description
        : linktree.subtitle || defaultDescription,
    icons: {
      icon: iconEntries,
      apple:
        linktree.business_logo ||
        linktree.business_default_avatar ||
        BUSINESS_LOGO_PLACEHOLDER,
    },
    themeColor: linktree.business_website_color || SPONSOR_KRD_ACCENT_COLOR,
    openGraph: {
      title: linktree.name,
      description:
        linktree.subtitle || defaultDescription,
      images: linktree.image ? [linktree.image] : [],
    },
  };
}
