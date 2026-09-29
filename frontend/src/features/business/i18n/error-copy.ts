import { ERROR_PAGE_COPY } from "@/components/error-pages/copy";
import type { BusinessLocale } from "./messages";

type BusinessErrorKind = "badGateway" | "serviceUnavailable" | "gatewayTimeout" | "forbidden" | "unexpected" | "notFound" | "gone" | "inactive";

const ARABIC_ERRORS: Record<BusinessErrorKind, { title: string; description: string }> = {
  badGateway: { title: "تعذّر الاتصال بالخدمة", description: "لم نتلقَّ استجابة صالحة من الخدمة المطلوبة. حاول مجددًا." },
  serviceUnavailable: { title: "الخدمة غير متاحة", description: "الخدمة غير متاحة مؤقتًا. حاول لاحقًا." },
  gatewayTimeout: { title: "انتهت مهلة الاتصال", description: "لم تستجب الخدمة في الوقت المحدد. حاول مجددًا." },
  forbidden: { title: "ليس لديك صلاحية", description: "لا تملك صلاحية عرض هذه الصفحة. عُد إلى الصفحة الرئيسية." },
  unexpected: { title: "حدث خطأ", description: "حدث خطأ غير متوقع. حاول مجددًا لاحقًا." },
  notFound: { title: "الصفحة غير موجودة", description: "لم نعثر على هذه الصفحة. حاول لاحقًا أو عُد إلى الصفحة الرئيسية." },
  gone: { title: "المحتوى لم يعد متاحًا", description: "حُذفت هذه الصفحة نهائيًا ولم تعد متاحة." },
  inactive: { title: "هذه الصفحة معطلة", description: "عطّل مالك الصفحة عرضها حاليًا. يُرجى المحاولة لاحقًا." },
};

const ENGLISH_ERRORS: Record<BusinessErrorKind, { title: string; description: string }> = {
  badGateway: { title: "Couldn't connect to the service", description: "The service returned an invalid response. Please try again." },
  serviceUnavailable: { title: "Service unavailable", description: "The service is temporarily unavailable. Please try again later." },
  gatewayTimeout: { title: "Connection timed out", description: "The service didn't respond in time. Please try again." },
  forbidden: { title: "Access denied", description: "You don't have permission to view this page. Return to the home page." },
  unexpected: { title: "Something went wrong", description: "An unexpected error occurred. Please try again later." },
  notFound: { title: "Page not found", description: "We couldn't find this page. Try again later or return home." },
  gone: { title: "Content unavailable", description: "This page has been permanently removed." },
  inactive: { title: "Page inactive", description: "The owner has disabled this page for now. Please try again later." },
};

const BUSINESS_ERROR_CONTROLS = {
  ckb: {
    errorCode: "کۆدی هەڵە", retry: "هەوڵ بدەوە", home: "پەڕەی سەرەکی",
    linktrees: "لینکترییەکان", advertise: "ڕیکلام", contact: "پەیوەندی", logoLabel: "لۆگۆ",
    footer: {
      home: "سەرەکی", advertise: "ڕیکلام", videoPage: "پەڕەی ڤیدیۆ",
      pages: "پەڕەکان", publicPages: "پەڕە گشتییەکان", contact: "پەیوەندی",
      officialSite: "ماڵپەڕی فەرمییە.", rightsReserved: "هەموو مافەکان پارێزراون.",
      poweredBy: "بە هێزی", logoLabel: "لۆگۆ",
    },
    navbar: { navigation: "ڕێنوێنی سەرەکی", theme: "گۆڕینی دۆخی ڕەنگ", menu: "گۆڕینی مینیو", logo: "لۆگۆ" },
  },
  ar: {
    errorCode: "رمز الخطأ", retry: "حاول مجددًا", home: "الصفحة الرئيسية",
    linktrees: "صفحات لينكتري", advertise: "الإعلانات", contact: "تواصل معنا", logoLabel: "الشعار",
    footer: {
      home: "الرئيسية", advertise: "الإعلانات", videoPage: "صفحة الفيديو",
      pages: "الصفحات", publicPages: "الصفحات العامة", contact: "التواصل",
      officialSite: "هو الموقع الرسمي.", rightsReserved: "جميع الحقوق محفوظة.",
      poweredBy: "بواسطة", logoLabel: "الشعار",
    },
    navbar: { navigation: "التنقل الرئيسي", theme: "تغيير المظهر", menu: "تبديل القائمة", logo: "الشعار" },
  },
  en: {
    errorCode: "Error code", retry: "Try again", home: "Home page",
    linktrees: "Linktrees", advertise: "Advertising", contact: "Contact", logoLabel: "Logo",
    footer: {
      home: "Home", advertise: "Advertising", videoPage: "Video page",
      pages: "Pages", publicPages: "Public pages", contact: "Contact",
      officialSite: "is the official website.", rightsReserved: "All rights reserved.",
      poweredBy: "Powered by", logoLabel: "Logo",
    },
    navbar: { navigation: "Main navigation", theme: "Toggle theme", menu: "Toggle menu", logo: "Logo" },
  },
} as const;

export function businessErrorPageCopy(locale: BusinessLocale, kind: BusinessErrorKind) {
  return {
    ...ERROR_PAGE_COPY[kind],
    ...(locale === "ar" ? ARABIC_ERRORS[kind] : locale === "en" ? ENGLISH_ERRORS[kind] : {}),
    copy: BUSINESS_ERROR_CONTROLS[locale],
    language: locale,
  };
}
