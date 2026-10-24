const copy = {
  en: {
    pages: "Pages",
    views: "Views",
    visitors: "Unique visitors",
    clicks: "Clicks",
    clickers: "Unique clickers",
    contacts: "Contact actions",
    loading: "Loading page statistics",
    loadingCards: "Loading page cards", loadingTable: "Loading pages table",
    loadFailed: "Couldn’t load page data. Please try refreshing.",
  },
  ckb: {
    pages: "پەڕەکان",
    views: "بینینەکان",
    visitors: "سەردانکەرە تاکەکان",
    clicks: "کلیکەکان",
    clickers: "کلیککەرە تاکەکان",
    contacts: "کردارەکانی پەیوەندی",
    loading: "ئاماری پەڕەکان بار دەکرێت",
    loadingCards: "پەیجەکان بار دەکرێن", loadingTable: "خشتەی پەیجەکان بار دەکرێت",
    loadFailed: "نەتوانرا داتای پەڕەکان بار بکرێت. تکایە نوێی بکەرەوە.",
  },
  ar: {
    pages: "الصفحات",
    views: "المشاهدات",
    visitors: "الزوار الفريدون",
    clicks: "النقرات",
    clickers: "الزوار الذين نقروا",
    contacts: "إجراءات التواصل",
    loading: "جارٍ تحميل إحصاءات الصفحات",
    loadingCards: "جارٍ تحميل بطاقات الصفحات", loadingTable: "جارٍ تحميل جدول الصفحات",
    loadFailed: "تعذّر تحميل بيانات الصفحات. يُرجى إعادة التحديث.",
  },
};
export function linktreeStatsCopy(locale: keyof typeof copy) {
  return copy[locale];
}
