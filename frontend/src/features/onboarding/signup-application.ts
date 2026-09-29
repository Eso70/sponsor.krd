import type { RootPublicLocale } from "@/features/public-site/root-public-locale";

export type SignupApplicationForm = {
  businessName: string;
  phone: string;
  requestedSubdomain: string;
  preferredLocale: RootPublicLocale;
};

export type SignupField = keyof SignupApplicationForm | "subdomainAvailability";
export type SignupFieldErrors = Partial<Record<SignupField, string>>;

const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function validateSignupApplication(
  form: SignupApplicationForm,
  subdomainAvailable: boolean | null,
  locale: RootPublicLocale = "ckb",
): SignupFieldErrors {
  const errors: SignupFieldErrors = {};
  const businessNameLength = form.businessName.trim().length;
  const phoneLength = form.phone.trim().length;

  if (businessNameLength < 2 || businessNameLength > 150) {
    errors.businessName = locale === "ar" ? "يجب أن يتكون اسم النشاط التجاري من حرفين إلى 150 حرفًا" : locale === "en" ? "Business name must be between 2 and 150 characters" : "ناوی بزنس دەبێت لە ٢ تا ١٥٠ پیت بێت";
  }
  if (phoneLength < 7 || phoneLength > 30) {
    errors.phone = locale === "ar" ? "يجب أن يتكون رقم الهاتف من 7 إلى 30 حرفًا" : locale === "en" ? "Mobile number must be between 7 and 30 characters" : "ژمارەی مۆبایل دەبێت لە ٧ تا ٣٠ پیت بێت";
  }
  if (!SUBDOMAIN_PATTERN.test(form.requestedSubdomain)) {
    errors.requestedSubdomain = locale === "ar" ? "أدخل نطاقًا فرعيًا صالحًا" : locale === "en" ? "Enter a valid subdomain" : "ساب‌دۆمەینێکی دروست بنووسە";
  } else if (subdomainAvailable === null) {
    errors.subdomainAvailability = locale === "ar" ? "انتظر حتى نتحقق من النطاق الفرعي" : locale === "en" ? "Wait while we check the subdomain" : "چاوەڕێی پشکنینی ساب‌دۆمەین بکە";
  } else if (!subdomainAvailable) {
    errors.subdomainAvailability = locale === "ar" ? "هذا النطاق الفرعي غير متاح" : locale === "en" ? "This subdomain is unavailable" : "ئەم ساب‌دۆمەینە بەردەست نییە";
  }

  return errors;
}

export function buildSignupApplicationPayload(form: SignupApplicationForm) {
  return {
    businessName: form.businessName.trim(),
    phone: form.phone.trim(),
    requestedSubdomain: form.requestedSubdomain,
    preferredLocale: form.preferredLocale,
  };
}
