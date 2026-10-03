import type { Metadata } from "next";
import type { PublicLinktree } from "@linktree/types";
import { NON_DESCRIPTIVE_PAGE_TEXT } from "@linktree/types";
import { BUSINESS_FAVICON_PLACEHOLDER, BUSINESS_LOGO_PLACEHOLDER } from "@/lib/brand/brand-assets";

function compactText(value?: string | null): string {
  return (value || "").replace(/[\p{Cc}\s]+/gu, " ").trim();
}

function shortenText(value: string, limit: number): string {
  const characters = Array.from(value);
  if (characters.length <= limit) return value;
  const shortened = characters.slice(0, limit - 1).join("");
  const boundary = shortened.lastIndexOf(" ");
  return `${boundary >= shortened.length * 0.7 ? shortened.slice(0, boundary) : shortened}…`;
}

/** Infer the dominant writing system; ambiguous content keeps the product default. */
function contentLocale(text: string): "ckb" | "ar" | "en" {
  const arabic = text.match(/\p{Script=Arabic}/gu)?.length || 0;
  const latin = text.match(/\p{Script=Latin}/gu)?.length || 0;
  if (arabic > 0 && arabic >= latin) return /[ڕڵۆێە]/u.test(text) ? "ckb" : "ar";
  return latin > 0 ? "en" : "ckb";
}

/** Search, sharing, HTML language and share images derive from the same visible content. */
export function automaticPageSeo(page: Pick<PublicLinktree, "name" | "subtitle" | "description">) {
  const name = compactText(page.name);
  const subtitle = meaningfulPageDescription(page.subtitle);
  const description = meaningfulPageDescription(page.description);
  const parts = [subtitle, description].filter((value, index, values) => value && values.indexOf(value) === index);
  return {
    title: shortenText(name, 150),
    description: shortenText(parts.join(" — ") || name, 200),
    imageSubtitle: shortenText(subtitle || description, 100),
    locale: contentLocale(parts.join(" ") || name),
  };
}

export function isPageIndexable(page: Pick<PublicLinktree, "name" | "subtitle" | "description" | "template_config">): boolean {
  return Boolean(page.name.trim() && (meaningfulPageDescription(page.subtitle) || meaningfulPageDescription(page.description)));
}

export function meaningfulPageDescription(description?: string | null): string {
  const value = compactText(description);
  return NON_DESCRIPTIVE_PAGE_TEXT.some(text => compactText(text).toLowerCase() === value.toLowerCase()) ? "" : value;
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
  const seo = automaticPageSeo(page);
  const canonical = canonicalPageUrl(page, origin);
  const { title, description } = seo;
  const image = `${canonical}/share-image`;
  return {
    metadataBase: new URL(origin), title: { absolute: title }, description,
    alternates: { canonical },
    robots: { index: isPageIndexable(page), follow: true },
    icons: {
      icon: publicAssetUrl(page.business_favicon || page.business_logo, origin) || new URL(BUSINESS_FAVICON_PLACEHOLDER, origin).href,
      apple: publicAssetUrl(page.business_logo || page.image, origin) || new URL(BUSINESS_LOGO_PLACEHOLDER, origin).href,
    },
    openGraph: { type: "website", url: canonical, title, description,
      locale: { ckb: "ckb_IQ", ar: "ar_IQ", en: "en_US" }[seo.locale],
      images: [{ url: image, width: 1200, height: 630, alt: page.name }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

/** WebPage describes known visible content without inventing LocalBusiness fields. */
export function buildPageJsonLd(page: PublicLinktree, origin: string) {
  const language = automaticPageSeo(page).locale;
  return {
    "@context": "https://schema.org", "@type": "WebPage",
    "@id": `${canonicalPageUrl(page, origin)}#page`, url: canonicalPageUrl(page, origin), name: page.name,
    inLanguage: language,
    ...(meaningfulPageDescription(page.description) ? { description: page.description } : {}),
    ...(publicAssetUrl(page.image, origin) ? { image: publicAssetUrl(page.image, origin) } : {}),
  };
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
