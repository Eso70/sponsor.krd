import "server-only";
import { SPONSOR_KRD_ACCENT_COLOR } from "@/lib/sponsor-krd-theme";
import { isWebsiteColor } from "@/lib/utils/parse-website-color";
import { cache } from "react";
import type { ResolvedBusinessDomain } from "@linktree/types";
import { resolvePublicOrigin } from "@/lib/public/public-origin";
import { getAppBaseUrl } from "@/lib/utils/app-url";
import { headers } from "next/headers";
import { resolveLinktreeHost } from "@/lib/public/linktree-host";
import { resolveBusinessHost } from "@/lib/public/domain-routing";
import { INTERNAL_PROXY_KEY_HEADER, internalProxyKey } from "@/lib/security/internal-proxy-key";
import { SPONSOR_KRD_LOGO, SPONSOR_KRD_FAVICON } from "./brand-assets";

/** Branding is keyed by the verified request host; never by a browser owner id. */
export const requestBranding = cache(async () => {
  const host = (await headers()).get("host") || "";
  const scope = resolveLinktreeHost(host, process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost");
  let subdomain = scope.subdomain;
  let verified: ResolvedBusinessDomain | null = null;
  if (!scope.isPlatformRoot && !subdomain) {
    try { verified = await resolveBusinessHost(host); subdomain = verified?.subdomain || ""; }
    catch { console.error("[tab-branding] Domain branding unavailable"); }
  }
  const platform = scope.isPlatformRoot;
  const origin = resolvePublicOrigin(host, process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost", getAppBaseUrl(), verified)?.origin || getAppBaseUrl();
  const base = {accentColor: SPONSOR_KRD_ACCENT_COLOR, origin, name: platform ? "Sponsor.krd" : "Business", logo: platform ? SPONSOR_KRD_LOGO : null as string | null, favicon: platform ? SPONSOR_KRD_FAVICON : null as string | null, platform};
  if (!platform && !subdomain) return base;
  const path = platform ? "/api/public/platform-branding" : `/api/auth/subdomain-theme/${encodeURIComponent(subdomain!)}`;
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}${path}`, {headers: {[INTERNAL_PROXY_KEY_HEADER]: internalProxyKey() || ""}, cache: "no-store", signal: AbortSignal.timeout(5000)});
    if (!response.ok) return base;
    const body = await response.json() as {data?: {name?: string; logo?: string; favicon?: string; website_color?: string; accentColor?: string}; name?: string; logo?: string; favicon?: string; website_color?: string; accentColor?: string};
    const data = body.data || body;
    const color = platform ? data.accentColor : data.website_color;
    return {...base, accentColor: isWebsiteColor(color) ? color! : base.accentColor, name: data.name?.trim() || base.name, logo: data.logo || base.logo, favicon: data.favicon || base.favicon};
  } catch { console.error("[tab-branding] Branding service unavailable"); return base; }
});
