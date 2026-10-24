import type { Metadata } from "next";
import { BUSINESS_FAVICON_PLACEHOLDER, BUSINESS_LOGO_PLACEHOLDER, SPONSOR_KRD_FAVICON, SPONSOR_KRD_APPLE_ICON } from "./brand-assets";

/** Explicit icon wins; missing/sentinel icons derive from the actual owner logo. */
export function brandIconUrl(favicon?: string | null, logo?: string | null, platform = false): string {
  const missing = (value?: string | null) => !value || [BUSINESS_FAVICON_PLACEHOLDER, BUSINESS_LOGO_PLACEHOLDER, "/favicon.ico", "/images/Logo.jpg", "/images/DefaultAvatar.png"].includes(value);
  const defaultPlatformIcon = platform && [SPONSOR_KRD_FAVICON, "/images/brand/rise-favicon-white.png", "/images/brand/rise-favicon.png"].includes(favicon || "") && !!logo && logo !== "/images/brand/rise.svg";
  const asset = !missing(favicon) && !defaultPlatformIcon ? favicon! : !missing(logo) ? logo! : null;
  if (!asset) return platform ? SPONSOR_KRD_FAVICON : "/images/business-favicon.ico";
  if (/^\/images\/upload\/[a-zA-Z0-9_/-]+\.(?:png|jpe?g)$/i.test(asset) && !asset.includes('..')) return `/api/public/brand-icon?asset=${encodeURIComponent(asset)}`;
  if (["/images/brand/rise.svg", "/images/brand/rise-favicon-white.png", "/images/brand/rise-favicon.png"].includes(asset)) return SPONSOR_KRD_FAVICON;
  if (/^\/(?!\/)/.test(asset) || /^https?:\/\//i.test(asset)) return asset;
  return platform ? SPONSOR_KRD_FAVICON : "/images/business-favicon.ico";
}
export function brandIcons(favicon?: string | null, logo?: string | null, platform = false): Metadata["icons"] {
  const url = brandIconUrl(favicon, logo, platform);
  return {icon: [{url, ...(url.includes("brand-icon?") || /\.ico(?:$|\?)/.test(url) ? {type: "image/x-icon"} : {})}], shortcut: url, apple: logo && (/^\/(?!\/)/.test(logo) || /^https?:\/\//i.test(logo)) ? logo : platform ? SPONSOR_KRD_APPLE_ICON : BUSINESS_FAVICON_PLACEHOLDER};
}
/** Update candidates in place: Next/React owns existing metadata node lifecycles. */
export function applyTabIcon(favicon?: string | null, logo?: string | null, platform = false): void {
  if (typeof document === "undefined") return;
  const links = Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel="icon"],link[rel="shortcut icon"]'));
  if (links.length === 0) {
    const icon = document.createElement("link");
    icon.rel = "icon";
    document.head.appendChild(icon);
    links.push(icon);
  }
  const url = brandIconUrl(favicon, logo, platform);
  for (const icon of links) {
    icon.href = url;
    icon.removeAttribute("sizes");
    icon.removeAttribute("type");
  }
}
