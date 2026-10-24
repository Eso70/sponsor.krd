import { brandIcons } from "@/lib/brand/tab-branding";
import type { Metadata } from "next";
import type { PublicLinktree } from "@linktree/types";
import { NON_DESCRIPTIVE_PAGE_TEXT } from "@linktree/types";
import { readLinktreeSeo, linktreeCategoryLabel, LINKTREE_BUSINESS_TYPES } from "@linktree/types/linktree-seo.cjs";

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

function visiblePageDescription(page: Pick<PublicLinktree, "subtitle" | "description">): string {
  return [meaningfulPageDescription(page.subtitle), meaningfulPageDescription(page.description)]
    .filter((value, index, values) => value && values.indexOf(value) === index).join(" — ");
}

/** Search, sharing, HTML language and share images derive from the same visible content. */
export function automaticPageSeo(page: Pick<PublicLinktree, "name" | "subtitle" | "description"> & { template_config?: Record<string, unknown> | null }) {
  const name = compactText(page.name);
  const subtitle = meaningfulPageDescription(page.subtitle);
  const description = meaningfulPageDescription(page.description);
  const visibleDescription = visiblePageDescription(page);
  const settings = readLinktreeSeo(page.template_config?.seo);
  const locale = settings?.language && settings.language !== "auto" ? settings.language : contentLocale(visibleDescription || name);
  const category = linktreeCategoryLabel(settings, locale);
  const context = [category, settings?.business?.city || settings?.business?.serviceArea].filter(Boolean).join(" · ");
  return {
    title: shortenText(settings?.title || name, 70),
    description: shortenText(settings?.description || visibleDescription || [name, context].filter(Boolean).join(" — "), 200),
    imageSubtitle: shortenText(settings?.description || subtitle || description || context, 100),
    locale,
  };
}

export function isPageIndexable(page: Pick<PublicLinktree, "name" | "subtitle" | "description" | "template_config">): boolean {
  const seo = readLinktreeSeo(page.template_config?.seo);
  if (seo?.indexing === "noindex") return false;
  return Boolean(page.name.trim() && (meaningfulPageDescription(page.subtitle) || meaningfulPageDescription(page.description) || (seo?.category && seo.category !== "other")));
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
  const settings = readLinktreeSeo(page.template_config?.seo);
  const revision = page.updated_at ? `?v=${encodeURIComponent(page.updated_at)}` : "";
  const image = publicAssetUrl(settings?.socialImage, origin) || `${canonical}/share-image${revision}`;
  return {
    metadataBase: new URL(origin), title: { absolute: title }, description,
    alternates: { canonical },
    robots: { index: isPageIndexable(page), follow: true },
    icons: brandIcons(page.business_favicon, page.business_logo),
    openGraph: { type: "website", url: canonical, title, description,
      locale: { ckb: "ckb_IQ", ar: "ar_IQ", en: "en_US" }[seo.locale],
      images: [{ url: image, ...(!settings?.socialImage ? { width: 1200, height: 630 } : {}), alt: page.name }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

/** WebPage describes known visible content without inventing LocalBusiness fields. */
export function buildPageJsonLd(page: PublicLinktree, origin: string, links: { platform: string; url: string }[] = []) {
  const visibleDescription = visiblePageDescription(page);
  const language = automaticPageSeo(page).locale;
  const seo = readLinktreeSeo(page.template_config?.seo);
  const business = seo?.business;
  const entityType = LINKTREE_BUSINESS_TYPES.find(type => type.id === seo?.businessType)?.schema;
  const person = seo?.category === "personal" || entityType === "Person";
  const physical = Boolean(business?.street && business?.city);
  const schema = person ? "Person" : entityType && (entityType === "School" || entityType === "Organization" || physical) ? entityType : seo?.category === "retail" && physical ? "Store" : "Organization";
  const url = canonicalPageUrl(page, origin);
  const entity = seo?.category && seo.category !== "other" ? {
    "@type": schema, "@id": `${url}#entity`, name: page.name, url,
    ...(visibleDescription ? { description: visibleDescription } : {}),
    ...(publicAssetUrl(page.image, origin) ? { image: publicAssetUrl(page.image, origin) } : {}),
    ...(physical && !person ? { address: { "@type": "PostalAddress", streetAddress: business?.street, addressLocality: business?.city, ...(business?.country ? { addressCountry: business.country } : {}) } } : {}),
    ...(business?.serviceArea && !person ? { areaServed: business.serviceArea } : {}),
    ...(schema === "Restaurant" && business?.cuisine ? { servesCuisine: business.cuisine } : {}),
    ...(physical && business?.hours && !person ? { openingHoursSpecification: { "@type": "OpeningHoursSpecification", dayOfWeek: business.hours.days.map(day => `https://schema.org/${({Mo:"Monday",Tu:"Tuesday",We:"Wednesday",Th:"Thursday",Fr:"Friday",Sa:"Saturday",Su:"Sunday"} as const)[day]}`), opens: business.hours.opens, closes: business.hours.closes } } : {}),
    ...(() => { const phone = links.find(link => link.platform === "phone" && /^tel:\+?[0-9 ()-]{6,25}$/.test(link.url)); return phone ? { telephone: phone.url.slice(4) } : {}; })(),
    ...(() => { const sameAs = links.filter(link => ["instagram","facebook","tiktok","youtube","twitter","x","linkedin","snapchat"].includes(link.platform)).map(link => publicAssetUrl(link.url, origin)).filter(Boolean); return sameAs.length ? { sameAs: [...new Set(sameAs)] } : {}; })(),
  } : undefined;
  return {
    "@context": "https://schema.org", "@type": person ? "ProfilePage" : "WebPage",
    "@id": `${canonicalPageUrl(page, origin)}#page`, url: canonicalPageUrl(page, origin), name: page.name,
    inLanguage: language,
    ...(visibleDescription ? { description: visibleDescription } : {}),
    ...(publicAssetUrl(page.image, origin) ? { image: publicAssetUrl(page.image, origin) } : {}),
    ...(entity ? { mainEntity: entity } : {}),
  };
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
