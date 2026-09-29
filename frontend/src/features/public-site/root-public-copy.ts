import type { RootPublicLocale } from "./root-public-locale";

export const rootPublicCopy: Record<RootPublicLocale, {
  hero: { eyebrow: string; titleBefore: string; titleAccent: string; description: string };
  footer: { description: string; rights: string; terms: string; privacy: string };
  navbar: { navigation: string; theme: string; menu: string; logo: string };
  metadataDescription: string;
}> = {
  ckb: {
    hero: {
      eyebrow: "پلاتفۆرمی SaaS بۆ هەژمارە ڕیکلامییەکان",
      titleBefore: "پەیوەندییەکی ڕێکخراو بۆ",
      titleAccent: "بەڕێوەبردنی ڕیکلام",
      description: "Sponsor.krd ژێرخانی پارێزراو و یەکگرتوو بۆ پەیوەستکردن بە هەژمارە ڕیکلامییەکانی TikTok دابین دەکات. پەیوەندیی بەڕێوەبەری پلاتفۆرم بە جیا بەڕێوەدەبرێت، و پەیوەستکردنی هەژماری تایبەتی بزنسەکان لە قۆناغی داهاتوودا بەردەست دەبێت",
    },
    footer: {
      description: "شوێنی دیجیتاڵی خۆت بە پلاتفۆرمێکی سادە و پارێزراو دروست بکە",
      rights: "هەموو مافەکان پارێزراون",
      terms: "مەرجەکان",
      privacy: "سیاسەتی تایبەتمەندی",
    },
    navbar: { navigation: "گەشتکردنی سەرەکی", theme: "گۆڕینی دۆخی ڕەنگ", menu: "کردنەوەی مینیو", logo: "لۆگۆ" },
    metadataDescription: "پلاتفۆرمێکی پارێزراو بۆ پەیوەستکردنی ڕێکخراو بە هەژمارە ڕیکلامییەکانی TikTok",
  },
  ar: {
    hero: {
      eyebrow: "منصة SaaS لحسابات الإعلانات",
      titleBefore: "اتصال منظّم من أجل",
      titleAccent: "إدارة الإعلانات",
      description: "توفّر Sponsor.krd بنية آمنة وموحّدة للاتصال بحسابات إعلانات TikTok. تُدار صلاحية مدير المنصة بشكل مستقل، وسيصبح ربط حسابات الأعمال الخاصة متاحًا في مرحلة لاحقة.",
    },
    footer: {
      description: "أنشئ حضورك الرقمي على منصة بسيطة وآمنة",
      rights: "جميع الحقوق محفوظة",
      terms: "شروط الاستخدام",
      privacy: "سياسة الخصوصية",
    },
    navbar: { navigation: "التنقل الرئيسي", theme: "تغيير المظهر", menu: "فتح القائمة", logo: "الشعار" },
    metadataDescription: "منصة آمنة للاتصال المنظّم بحسابات إعلانات TikTok",
  },
  en: {
    hero: {
      eyebrow: "SaaS platform for advertising accounts",
      titleBefore: "An organized connection for",
      titleAccent: "advertising management",
      description: "Sponsor.krd provides secure, unified infrastructure for connecting to TikTok advertising accounts. Platform administrator access is managed separately; connecting businesses' own accounts will be available in a future phase.",
    },
    footer: {
      description: "Build your digital presence on a simple, secure platform",
      rights: "All rights reserved",
      terms: "Terms of use",
      privacy: "Privacy policy",
    },
    navbar: { navigation: "Main navigation", theme: "Toggle appearance", menu: "Open menu", logo: "Logo" },
    metadataDescription: "A secure platform for organized connections to TikTok advertising accounts",
  },
};
