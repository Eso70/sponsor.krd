import type { BusinessInfoStepProps } from "@/features/link-editor/components/BusinessInfoStep";
import { arabicColorGradientCopy } from "@/components/shared/color-gradient-arabic-copy";
import { englishBusinessMessages } from "@/features/shared/i18n/english-messages";
import type { PlatformLocale } from "./locale";

type EditCopy = {
  title: string;
  createTitle: string;
  description: string;
  close: string;
  cancel: string;
  saving: string;
  update: string;
  create: string;
  loading: string;
  validation: Record<"nameShort" | "nameUsed" | "usernameRequired" | "usernameInvalid" | "usernameUsed" | "phoneRequired" | "phoneInvalid" | "subdomainRequired" | "subdomainInvalid" | "subdomainUsed" | "colorInvalid", string>;
  form: BusinessInfoStepProps["copy"];
};

export const platformEditCopy: Record<PlatformLocale, EditCopy> = {
  en: {
    title: "Edit business", createTitle: "Add new business", description: "Core details and brand images", close: "Close", cancel: "Cancel", saving: "Saving...", update: "Update", create: "Create", loading: "Loading business details",
    validation: { nameShort: "Business name must have at least 2 characters", nameUsed: "Business name is already in use", usernameRequired: "Username is required", usernameInvalid: "Username must contain 3–32 lowercase letters, digits, hyphens, or underscores", usernameUsed: "Username is already in use", phoneRequired: "Mobile number is required", phoneInvalid: "Mobile number must contain 7–15 digits without 964", subdomainRequired: "Subdomain is required", subdomainInvalid: "Subdomain must contain 3–32 lowercase letters, digits, hyphens, or underscores", subdomainUsed: "Subdomain is already in use", colorInvalid: "Choose a valid website color" },
    form: {
      businessName: "Business name", businessNamePlaceholder: "Enter business name", username: "Username", subdomain: "Subdomain", subdomainPlaceholder: "Enter subdomain", randomSubdomain: "Generate random subdomain", phone: "Mobile number", tiktok: "TikTok settings", tiktokGroups: "TikTok groups", addTiktok: "Add Pixel and Events API", plan: "Subscription plan", loadingPlans: "Loading plans...", noPlans: "No active plans",
      brand: { stack: "Brand images", avatar: "Avatar", favicon: "Favicon", logo: "Logo", uploadAvatar: "Upload avatar", uploadFavicon: "Upload favicon", uploadLogo: "Upload logo", unlockAvatar: "Allow avatar changes", unlockFavicon: "Allow favicon changes", websiteColor: "Website color" },
      owner: { accountName: "Account name", fromVerified: "From verified account", email: "Email", verified: "Verified", unverified: "Unverified", unavailable: "Unavailable", verifiedEmail: "Email verified" },
      tiktokModal: { title: "TikTok settings", description: "Each group has a Pixel ID and Events API. Maximum {max} groups.", close: "Close", group: "Group", remove: "Remove", optional: "Optional", pixelPlaceholder: "Enter Pixel ID", tokenPlaceholder: "Enter Events API token", addGroup: "Add group", done: "Done" },
      color: englishBusinessMessages.SettingsColorPicker,
    },
  },
  ckb: {
    title: "دەستکاریکردنی بزنس", createTitle: "زیادکردنی بزنسی نوێ",
    description: "زانیارییە سەرەکییەکان و وێنەکانی بڕاند",
    close: "داخستن", cancel: "هەڵوەشاندنەوە", saving: "پاشەکەوتکردن...",
    update: "نوێکردنەوە", create: "دروستکردن",
    loading: "بارکردنی زانیارییەکانی بزنس",
    validation: {
      nameShort: "ناوی بزنس دەبێت لانی کەم ٢ پیت بێت",
      nameUsed: "ناوی بزنس پێشتر بەکارهاتووە",
      usernameRequired: "ناوی بەکارهێنەر پێویستە",
      usernameInvalid: "ناوی بەکارهێنەر دەبێت ٣ تا ٣٢ پیتی بچووک، ژمارە، هێڵ یان ژێرهێڵ بێت",
      usernameUsed: "ناوی بەکارهێنەر پێشتر بەکارهاتووە",
      phoneRequired: "ژمارەی مۆبایل پێویستە",
      phoneInvalid: "ژمارەی مۆبایل دەبێت ٧ تا ١٥ ژمارە بێت، بەبێ ٩٦٤",
      subdomainRequired: "سەب دۆمەین پێویستە",
      subdomainInvalid: "سەب دۆمەین دەبێت ٣ تا ٣٢ پیتی بچووک، ژمارە، هێڵ یان ژێرهێڵ بێت",
      subdomainUsed: "سەب دۆمەین پێشتر بەکارهاتووە",
      colorInvalid: "ڕەنگێکی دروستی وێبسایت هەڵبژێرە",
    },
    form: {
      brand: { stack: "وێنەکانی بڕاند", avatar: "ئەڤاتار", favicon: "فایڤئایکۆن", logo: "لۆگۆ", uploadAvatar: "بارکردنی ئەڤاتار", uploadFavicon: "بارکردنی فایڤئایکۆن", uploadLogo: "بارکردنی لۆگۆ", unlockAvatar: "کردنەوەی ئەڤاتار", unlockFavicon: "کردنەوەی فایڤئایکۆن", websiteColor: "ڕەنگی وێبسایت" },
      owner: { accountName: "ناوی هەژمار", fromVerified: "لە هەژماری پشتڕاستکراوەوە", email: "ئیمەیڵ", verified: "پشتڕاستکراوە", unverified: "پشتڕاستنەکراوە", unavailable: "بەردەست نییە", verifiedEmail: "ئیمەیڵ پشتڕاستکراوە" },
    },
  },
  ar: {
    title: "تعديل النشاط التجاري", createTitle: "إضافة نشاط تجاري جديد",
    description: "البيانات الأساسية وصور العلامة التجارية",
    close: "إغلاق", cancel: "إلغاء", saving: "جارٍ الحفظ...",
    update: "تحديث", create: "إنشاء",
    loading: "جارٍ تحميل بيانات النشاط التجاري",
    validation: {
      nameShort: "يجب أن يتكون اسم النشاط التجاري من حرفين على الأقل",
      nameUsed: "اسم النشاط التجاري مستخدم بالفعل",
      usernameRequired: "اسم المستخدم مطلوب",
      usernameInvalid: "يجب أن يتكون اسم المستخدم من ٣ إلى ٣٢ حرفًا إنجليزيًا صغيرًا أو رقمًا أو شرطة أو شرطة سفلية",
      usernameUsed: "اسم المستخدم مستخدم بالفعل",
      phoneRequired: "رقم الهاتف مطلوب",
      phoneInvalid: "يجب أن يتكون رقم الهاتف من ٧ إلى ١٥ رقمًا دون 964",
      subdomainRequired: "النطاق الفرعي مطلوب",
      subdomainInvalid: "يجب أن يتكون النطاق الفرعي من ٣ إلى ٣٢ حرفًا إنجليزيًا صغيرًا أو رقمًا أو شرطة أو شرطة سفلية",
      subdomainUsed: "النطاق الفرعي مستخدم بالفعل",
      colorInvalid: "اختر لونًا صالحًا للموقع",
    },
    form: {
      businessName: "اسم النشاط التجاري", businessNamePlaceholder: "اكتب اسم النشاط التجاري",
      username: "اسم المستخدم", subdomain: "النطاق الفرعي",
      subdomainPlaceholder: "اكتب النطاق الفرعي", randomSubdomain: "إنشاء نطاق فرعي عشوائي",
      phone: "رقم الهاتف", tiktok: "إعدادات تيك توك", tiktokGroups: "مجموعات تيك توك",
      addTiktok: "إضافة Pixel وEvents API", plan: "خطة الاشتراك",
      loadingPlans: "جارٍ تحميل الخطط...", noPlans: "لا توجد خطط نشطة",
      brand: { stack: "صور العلامة التجارية", avatar: "الصورة الافتراضية", favicon: "أيقونة الموقع", logo: "الشعار", uploadAvatar: "رفع الصورة الافتراضية", uploadFavicon: "رفع أيقونة الموقع", uploadLogo: "رفع الشعار", unlockAvatar: "إتاحة تغيير الصورة الافتراضية", unlockFavicon: "إتاحة تغيير أيقونة الموقع", websiteColor: "لون الموقع" },
      owner: { accountName: "اسم الحساب", fromVerified: "من الحساب الموثّق", email: "البريد الإلكتروني", verified: "موثّق", unverified: "غير موثّق", unavailable: "غير متاح", verifiedEmail: "البريد الإلكتروني موثّق" },
      tiktokModal: { title: "إعدادات تيك توك", description: "تحتوي كل مجموعة على Pixel ID وEvents API. الحد الأقصى {max} مجموعات.", close: "إغلاق", group: "المجموعة", remove: "حذف", optional: "اختياري", pixelPlaceholder: "أدخل Pixel ID", tokenPlaceholder: "أدخل رمز Events API", addGroup: "إضافة مجموعة", done: "تم" },
      color: arabicColorGradientCopy,
    },
  },
};
