import { BUSINESS_FAVICON_PLACEHOLDER } from "@/lib/brand/brand-assets";
import type { Metadata } from "next";
import type { FormDraft } from "./types";
import { formsCopy } from "./forms-copy";
import {
  automaticPageSeo,
  isPageIndexable,
  meaningfulPageDescription,
  publicAssetUrl,
} from "@/lib/public/page-seo";

/** Metadata contains public introduction content only, never response data. */
export function buildFormMetadata(
  form: FormDraft,
  origin: string,
  businessLogo?: string | null,
): Metadata {
  const page = {
    name: form.headline,
    subtitle: null,
    description: form.description,
    template_config: {},
  };
  const seo = automaticPageSeo(page);
  const title = seo.title || formsCopy(form.language).title;
  const canonical = new URL(`/form/${encodeURIComponent(form.slug!)}`, origin)
    .href;
  const banner =
    form.bannerEnabled !== false
      ? form.bannerImages?.[0] || form.banner
      : undefined;
  const image = publicAssetUrl(
    banner || (form.logoEnabled !== false ? form.logo : undefined),
    origin,
  );
  return {
    metadataBase: new URL(origin),
    title: { absolute: title },
    icons: {
      icon:
        publicAssetUrl(form.logo, origin) ||
        publicAssetUrl(businessLogo, origin) ||
        new URL(BUSINESS_FAVICON_PLACEHOLDER, origin).href,
      apple:
        publicAssetUrl(form.logo, origin) ||
        publicAssetUrl(businessLogo, origin) ||
        new URL(BUSINESS_FAVICON_PLACEHOLDER, origin).href,
    },
    description: meaningfulPageDescription(form.description)
      ? seo.description
      : title,
    alternates: { canonical },
    robots: {
      index: form.status === "active" && isPageIndexable(page),
      follow: true,
    },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description: seo.description,
      locale: { en: "en_US", ar: "ar_IQ", ckb: "ckb_IQ" }[form.language],
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description: seo.description,
      ...(image ? { images: [image] } : {}),
    },
  };
}
