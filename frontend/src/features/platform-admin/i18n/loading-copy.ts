import type { PlatformLocale } from "./locale";

export const platformLoadingCopy: Record<PlatformLocale, {
  loading: string;
  businessDirectory: string;
  loginDescription: string;
  login: string;
}> = {
  en: {
    loading: "Loading",
    businessDirectory: "Loading business management",
    loginDescription: "Log in to manage the platform",
    login: "Loading login",
  },
  ckb: {
    loading: "بارکردن",
    businessDirectory: "بەڕێوەبردنی بزنسەکان بار دەکرێت",
    loginDescription: "بڕۆ ژوورەوە بۆ بەڕێوەبردنی پلاتفۆڕم",
    login: "چوونەژوورەوە بار دەکرێت",
  },
  ar: {
    loading: "جارٍ التحميل",
    businessDirectory: "جارٍ تحميل إدارة الأعمال",
    loginDescription: "سجّل الدخول لإدارة المنصة",
    login: "جارٍ تحميل تسجيل الدخول",
  },
};
