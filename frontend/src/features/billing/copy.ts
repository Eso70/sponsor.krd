export const subscriptionCopy = {
  en: {
    title: "Plans & subscription",
    description: "Compare access, usage limits and billing periods.",
    monthly: "Monthly",
    yearly: "Yearly",
    month: "month",
    year: "year",
    current: "Current plan",
    unlimited: "Unlimited",
    pages: "Link pages",
    pixels: "TikTok pixels",
    changes: "Profile changes / month",
    templates: "Templates",
    tiktok: "TikTok Pixel & Events API",
    branding: "Remove Sponsor.krd branding",
    advertising: "Advertising page",
    included: "Included",
    excluded: "Not included",
    renews: "Period ends",
    close: "Close",
    error: "Could not load subscription. Please try again.",
    retry: "Try again",
    usage: "Current usage",
    status: "Subscription status",
    noEnd: "No expiry date",
    checkout: "Choose plan",
    paymentSetup:
      "Contact support to change your plan. Online payments are not configured yet.",
    manage: "Manage subscription",
    saving: "Saving…",
    price: "Price",
    permissions: "Permission profile",
  },
  ckb: {
    title: "پلان و بەشداربوون",
    description: "مۆڵەت، سنووری بەکارهێنان و ماوەی بەشداربوون بەراورد بکە.",
    monthly: "مانگانە",
    yearly: "ساڵانە",
    month: "مانگ",
    year: "ساڵ",
    current: "پلانی ئێستا",
    unlimited: "بێ سنوور",
    pages: "پەڕەی لینک",
    pixels: "پیکسەلی تیکتۆک",
    changes: "گۆڕینی پڕۆفایل / مانگ",
    templates: "قاڵبەکان",
    tiktok: "پیکسەلی تیکتۆک و Events API",
    branding: "لابردنی نیشانەی Sponsor.krd",
    advertising: "پەڕەی ڕیکلام",
    included: "بەردەستە",
    excluded: "بەردەست نییە",
    renews: "کۆتایی ماوە",
    close: "داخستن",
    error: "بارکردنی بەشداربوون سەرکەوتوو نەبوو. دووبارە هەوڵ بدە.",
    retry: "دووبارە هەوڵ بدە",
    usage: "بەکارهێنانی ئێستا",
    status: "دۆخی بەشداربوون",
    noEnd: "بەرواری کۆتایی نییە",
    checkout: "هەڵبژاردنی پلان",
    paymentSetup:
      "بۆ گۆڕینی پلان پەیوەندی بە پشتگیری بکە. پارەدانی ئۆنلاین هێشتا ڕێکنەخراوە.",
    manage: "بەڕێوەبردنی بەشداربوون",
    saving: "پاشەکەوت دەکرێت…",
    price: "نرخ",
    permissions: "پڕۆفایلی مۆڵەت",
  },
  ar: {
    title: "الخطط والاشتراك",
    description: "قارن الصلاحيات وحدود الاستخدام وفترات الفوترة.",
    monthly: "شهري",
    yearly: "سنوي",
    month: "شهر",
    year: "سنة",
    current: "الخطة الحالية",
    unlimited: "غير محدود",
    pages: "صفحات الروابط",
    pixels: "بكسلات تيك توك",
    changes: "تغييرات الملف / شهر",
    templates: "القوالب",
    tiktok: "بكسل تيك توك وواجهة الأحداث",
    branding: "إزالة علامة Sponsor.krd",
    advertising: "صفحة الإعلانات",
    included: "متاح",
    excluded: "غير متاح",
    renews: "نهاية الفترة",
    close: "إغلاق",
    error: "تعذّر تحميل الاشتراك. حاول مجددًا.",
    retry: "حاول مجددًا",
    usage: "الاستخدام الحالي",
    status: "حالة الاشتراك",
    noEnd: "بدون تاريخ انتهاء",
    checkout: "اختيار الخطة",
    paymentSetup:
      "تواصل مع الدعم لتغيير خطتك. الدفع عبر الإنترنت لم يُعدّ بعد.",
    manage: "إدارة الاشتراك",
    saving: "جارٍ الحفظ…",
    price: "السعر",
    permissions: "ملف الصلاحيات",
  },
} as const;

export type BillingLocale = keyof typeof subscriptionCopy;
export type BillingCycle = "monthly" | "yearly";

export function subscriptionStatusText(
  status: string | undefined,
  locale: BillingLocale,
): string {
  const labels: Record<string, readonly [string, string, string]> = {
    active: ["Active", "چالاک", "نشط"],
    trialing: ["Trial", "تاقیکردنەوە", "تجريبي"],
    grace_period: ["Grace period", "ماوەی ڕێگەپێدان", "فترة سماح"],
    past_due: ["Payment overdue", "پارەدان دواکەوتووە", "الدفع متأخر"],
    paused: ["Paused", "ڕاگیراو", "متوقف مؤقتًا"],
    canceled: ["Canceled", "هەڵوەشێنراوەتەوە", "ملغى"],
    expired: ["Expired", "بەسەرچووە", "منتهي"],
    incomplete: ["Incomplete", "ناتەواو", "غير مكتمل"],
    unassigned: ["No subscription", "بەشداربوون نییە", "لا يوجد اشتراك"],
  };
  return (
    labels[status ?? "unassigned"]?.[
      locale === "en" ? 0 : locale === "ckb" ? 1 : 2
    ] ?? "—"
  );
}

export function billingAmount(
  minor: number | null | undefined,
  currency: string,
  locale: BillingLocale,
): string {
  return new Intl.NumberFormat(locale === "ckb" ? "en" : locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(minor ?? 0) / 100);
}
