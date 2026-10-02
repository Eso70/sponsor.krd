/** Stored in existing Linktree template_config.seo; canonical hosts are server-owned. */
export interface PageSeo {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  locale?: "ckb" | "ar" | "en";
}

export interface PublicSitemapPage {
  slug: string;
  updatedAt: string;
}

/** UI starter prompts are contact instructions, not descriptive business content. */
export const NON_DESCRIPTIVE_PAGE_TEXT = [
  "بۆ پەیوەندی کردن, کلیک لەم لینکانەی خوارەوە بکە",
  "للتواصل معنا، اضغط على أحد الروابط أدناه",
  "للتواصل، اضغط على أحد الروابط أدناه",
  "To contact us, tap one of the links below",
] as const;
