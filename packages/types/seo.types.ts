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
