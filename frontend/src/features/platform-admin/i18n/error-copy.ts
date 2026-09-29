import { ERROR_PAGE_COPY } from "@/components/error-pages/copy";
import type { PlatformLocale } from "./locale";

type PlatformErrorKind =
  | "notFound"
  | "badGateway"
  | "serviceUnavailable"
  | "gatewayTimeout"
  | "forbidden"
  | "unexpected";

const ARABIC_ERRORS: Record<PlatformErrorKind, { title: string; description: string }> = {
  notFound: {
    title: "الصفحة غير موجودة",
    description: "لم نعثر على هذه الصفحة. حاول لاحقًا أو عُد إلى الصفحة الرئيسية.",
  },
  forbidden: {
    title: "ليس لديك صلاحية",
    description: "ليس لديك صلاحية لعرض هذه الصفحة. عُد إلى الصفحة الرئيسية.",
  },
  unexpected: {
    title: "حدث خطأ",
    description: "حدث خطأ غير متوقع. حاول مرة أخرى لاحقًا.",
  },
  badGateway: {
    title: "لم يصل رد صالح",
    description: "تعذّر الحصول على رد صالح من الخدمة المطلوبة. حاول مرة أخرى.",
  },
  serviceUnavailable: {
    title: "الخدمة غير متاحة",
    description: "الخدمة غير متاحة مؤقتًا. حاول مرة أخرى لاحقًا.",
  },
  gatewayTimeout: {
    title: "انتهت مهلة الانتظار",
    description: "لم ترد الخدمة المطلوبة في الوقت المحدد. حاول مرة أخرى.",
  },
};

const ENGLISH_ERRORS: Record<PlatformErrorKind, { title: string; description: string }> = {
  notFound: { title: "Page not found", description: "We couldn't find this page. Try again later or return home." },
  forbidden: { title: "Access denied", description: "You don't have permission to view this page. Return home." },
  unexpected: { title: "Something went wrong", description: "An unexpected error occurred. Please try again later." },
  badGateway: { title: "Invalid response", description: "The requested service returned an invalid response. Please try again." },
  serviceUnavailable: { title: "Service unavailable", description: "The service is temporarily unavailable. Please try again later." },
  gatewayTimeout: { title: "Request timed out", description: "The requested service did not respond in time. Please try again." },
};

export function platformErrorCopy(kind: PlatformErrorKind, locale: PlatformLocale) {
  return {
    ...ERROR_PAGE_COPY[kind],
    ...(locale === "ar" ? ARABIC_ERRORS[kind] : locale === "en" ? ENGLISH_ERRORS[kind] : {}),
    language: locale,
    copy: locale === "ar"
      ? {
          errorCode: "رمز الخطأ",
          retry: "حاول مرة أخرى",
          home: "الصفحة الرئيسية",
          footerDescription: "منصة لإنشاء صفحات الروابط",
          footer: {
            home: "الرئيسية",
            pages: "الصفحات",
            rightsReserved: "جميع الحقوق محفوظة",
          },
          navbar: {
            navigation: "التنقل",
            theme: "المظهر",
            menu: "القائمة",
            logo: "شعار",
          },
        }
      : locale === "en" ? {
          errorCode: "Error code", retry: "Try again", home: "Home page", footerDescription: "A platform for creating Linktree pages",
          footer: { home: "Home", pages: "Pages", rightsReserved: "All rights reserved" },
          navbar: { navigation: "Navigation", theme: "Appearance", menu: "Menu", logo: "Logo" },
        } : undefined,
  };
}
