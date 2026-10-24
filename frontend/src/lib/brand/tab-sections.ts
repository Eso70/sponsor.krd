import { businessMessages, type BusinessLocale } from "@/features/business/i18n/messages";
import { businessTabTitle } from "@/lib/utils/tab-title";

const sections = {
  businesses: ["Businesses", "بزنسەکان", "الأنشطة التجارية"],
  campaigns: ["Campaigns", "کەمپەینەکان", "الحملات"],
  "access-control": ["Access control", "کۆنترۆڵی دەستگەیشتن", "التحكم بالوصول"],
  "communication-center": ["Communications", "پەیوەندییەکان", "الاتصالات"],
  billing: ["Plans & billing", "پلان و پسووڵەکان", "الخطط والفوترة"],
  login: ["Sign in", "چوونەژوورەوە", "تسجيل الدخول"],
  "workspace-entry": ["Find your workspace", "دۆزینەوەی داشبۆرد", "ابحث عن مساحة عملك"],
  consume: ["Signing in", "چوونەژوورەوە", "جارٍ تسجيل الدخول"],
} as const;
export function privateSectionTitle(segment: string, locale: BusinessLocale): string {
  const copy = businessMessages[locale].Dashboard;
  const common: Record<string, string> = {pages: copy.linktrees, linktrees: copy.linktrees, forms: copy.forms, templates: copy.templates, settings: copy.settings, profile: copy.profile, "tiktok-config": copy.tiktokSettings, "getting-started": copy.subtitle};
  if (common[segment]) return common[segment];
  const entry = sections[segment as keyof typeof sections];
  return entry?.[locale === "en" ? 0 : locale === "ar" ? 2 : 1] || copy.subtitle;
}
export function privateTabTitle(segment: string, brand: string, locale: BusinessLocale) {
  return businessTabTitle(brand, privateSectionTitle(segment, locale));
}
