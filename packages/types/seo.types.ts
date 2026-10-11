export interface PublicSitemapPage {
  slug: string;
  /** Omitted by older APIs: defaults to linktree. */
  pageType?: "linktree" | "form";
  updatedAt: string;
}

/** UI starter prompts are not descriptive business content. */
export const NON_DESCRIPTIVE_PAGE_TEXT = [
  "بۆ پەیوەندی کردن, کلیک لەم لینکانەی خوارەوە بکە",
  "للتواصل معنا، اضغط على أحد الروابط أدناه",
  "للتواصل، اضغط على أحد الروابط أدناه",
  "To contact us, tap one of the links below",
  "Explain the main benefits or important details",
  "سوودەکان یان وردەکارییە گرنگەکان بنووسە",
  "اشرح المزايا أو التفاصيل المهمة",
] as const;
