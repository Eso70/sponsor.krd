import type { Metadata } from "next";
import type { PageSeo, PublicLinktree } from "@linktree/types";
import { NON_DESCRIPTIVE_PAGE_TEXT } from "@linktree/types";
import { BUSINESS_FAVICON_PLACEHOLDER, BUSINESS_LOGO_PLACEHOLDER } from "@/lib/brand/brand-assets";

export function readPageSeo(config?: Record<string, unknown> | null): PageSeo {
  const value = config?.seo;
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const input = value as Record<string, unknown>;
  const result: PageSeo = {};
  for (const key of ["title", "description", "ogTitle", "ogDescription"] as const) {
    if (typeof input[key] === "string") result[key] = input[key].trim().slice(0, key.endsWith("escription") ? 320 : 150);
  }
  for (const key of ["robotsIndex", "robotsFollow"] as const) {
    if (typeof input[key] === "boolean") result[key] = input[key];
  }
  if (input.locale === "ckb" || input.locale === "ar" || input.locale === "en") result.locale = input.locale;
  return result;
}

export function isPageIndexable(page: Pick<PublicLinktree, "name" | "subtitle" | "description" | "template_config">): boolean {
  const seo = readPageSeo(page.template_config);
  if (seo.robotsIndex !== undefined) return seo.robotsIndex;
  return Boolean(page.name.trim() && (page.subtitle?.trim() || meaningfulPageDescription(page.description)));
}

export function meaningfulPageDescription(description?: string | null): string {
  const value = description?.trim() || "";
  return NON_DESCRIPTIVE_PAGE_TEXT.some(text => text === value) ? "" : value;
}

export function canonicalPageUrl(page: Pick<PublicLinktree, "uid" | "seo_name">, origin: string): string {
  return new URL(`/linktree/${encodeURIComponent(page.seo_name || page.uid)}`, origin).href;
}

/** Only web URLs and local assets may appear in public metadata. No script/data URLs. */
export function publicAssetUrl(value: string | null | undefined, origin: string): string | undefined {
  if (!value || value.startsWith("//")) return undefined;
  try {
    const url = new URL(value, origin);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : undefined;
  } catch { return undefined; }
}

export function buildPageMetadata(page: PublicLinktree, origin: string): Metadata {
  const seo = readPageSeo(page.template_config);
  const canonical = canonicalPageUrl(page, origin);
  const title = seo.title || page.name;
  const description = seo.description ||
    meaningfulPageDescription(page.description) ||
    page.subtitle?.trim() || page.name;
  const ogTitle = seo.ogTitle || title;
  const ogDescription = seo.ogDescription || description;
  const image = `${canonical}/share-image`;
  return {
    metadataBase: new URL(origin), title: { absolute: title }, description,
    alternates: { canonical },
    robots: { index: isPageIndexable(page), follow: seo.robotsFollow ?? true },
    icons: {
      icon: publicAssetUrl(page.business_favicon || page.business_logo, origin) || new URL(BUSINESS_FAVICON_PLACEHOLDER, origin).href,
      apple: publicAssetUrl(page.business_logo || page.image, origin) || new URL(BUSINESS_LOGO_PLACEHOLDER, origin).href,
    },
    openGraph: { type: "website", url: canonical, title: ogTitle, description: ogDescription,
      ...(seo.locale ? { locale: { ckb: "ckb_IQ", ar: "ar_IQ", en: "en_US" }[seo.locale] } : {}),
      images: [{ url: image, width: 1200, height: 630, alt: page.name }] },
    twitter: { card: "summary_large_image", title: ogTitle, description: ogDescription, images: [image] },
  };
}

/** WebPage describes known visible content without inventing LocalBusiness fields. */
export function buildPageJsonLd(page: PublicLinktree, origin: string) {
  return {
    "@context": "https://schema.org", "@type": "WebPage",
    "@id": `${canonicalPageUrl(page, origin)}#page`, url: canonicalPageUrl(page, origin), name: page.name,
    ...(meaningfulPageDescription(page.description) ? { description: page.description } : {}),
    ...(publicAssetUrl(page.image, origin) ? { image: publicAssetUrl(page.image, origin) } : {}),
  };
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
