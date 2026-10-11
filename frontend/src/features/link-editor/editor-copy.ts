/** Arabic labels for the shared Linktree editor. Platform keeps its Kurdish defaults. */
import { getPlatformNameKurdish } from "./modal-constants";
import type { BackgroundPatternStyle } from "@linktree/types";
import { localizeInlineRequestError, type InlineRequestErrorData } from "@/lib/api/inline-request-error";
export { englishEditorCopy } from "./english-editor-copy";

export const englishPatternCopy = {
  title: "Choose a background pattern", count: "patterns", close: "Close",
  radiogroup: "Background patterns",
  labels: {
    none: "None", grid: "Grid", grid45: "45° grid", dots: "Dots",
    diagonal: "Diagonal lines", cross: "Crosses", circles: "Circles",
    waves: "Waves", zigzag: "Zigzag",
  } satisfies Record<BackgroundPatternStyle, string>,
};

export const englishTemplatePickerCopy = {
  title: "Choose a page design", count: "designs", close: "Close", locked: "Locked",
};

export const englishIconPickerCopy = {
  choose: "Choose icon", icon: "Icon", title: "Choose an icon",
  search: "Search icons by name...", close: "Close", upload: "Upload image",
  clear: "Remove", icons: "icons", noResults: "No icons found for",
  loading: "Loading more icons...", categories: { all: "All" },
};

export const englishCountrySelectorCopy = {
  title: "Choose a country", count: "countries", close: "Close",
  search: "Search country or calling code...", empty: "No country found",
  loading: "Loading more countries...",
};

export const arabicPatternCopy = {
  title: "اختر نمط الخلفية", count: "أنماط", close: "إغلاق",
  radiogroup: "أنماط الخلفية",
  labels: {
    none: "بلا نمط", grid: "شبكة", grid45: "شبكة بزاوية ٤٥°",
    dots: "نقاط", diagonal: "خطوط مائلة", cross: "علامات متقاطعة",
    circles: "دوائر", waves: "أمواج", zigzag: "متعرج",
  } satisfies Record<BackgroundPatternStyle, string>,
};

export const arabicTemplatePickerCopy = {
  title: "اختر تصميم الصفحة", count: "تصاميم", close: "إغلاق",
  locked: "مقفل",
};

export const arabicIconPickerCopy = {
  choose: "اختيار أيقونة", icon: "أيقونة", title: "اختر أيقونة",
  search: "ابحث باسم الأيقونة...", close: "إغلاق",
  upload: "رفع صورة", clear: "إزالة", icons: "أيقونة",
  noResults: "لم يُعثر على أيقونات لـ", loading: "جارٍ تحميل المزيد من الأيقونات...",
  categories: { all: "الكل" },
};

export const arabicCountrySelectorCopy = {
  title: "اختر البلد", count: "بلد", close: "إغلاق",
  search: "ابحث عن بلد أو رمز الاتصال...",
  empty: "لم يُعثر على بلد", loading: "جارٍ تحميل المزيد من البلدان...",
};

const arabicPlatformNames: Record<string, string> = {
  whatsapp: "واتساب", viber: "فايبر", telegram: "تيليجرام",
  phone: "رقم الهاتف", instagram: "إنستغرام", facebook: "فيسبوك",
  twitter: "تويتر / إكس", x: "إكس", linkedin: "لينكدإن",
  snapchat: "سناب شات", tiktok: "تيك توك", youtube: "يوتيوب",
  discord: "ديسكورد", email: "البريد الإلكتروني", gps: "الموقع",
  custom: "رابط آخر",
};

const englishPlatformNames: Record<string, string> = {
  whatsapp: "WhatsApp", viber: "Viber", telegram: "Telegram", phone: "Phone",
  instagram: "Instagram", facebook: "Facebook", twitter: "X", x: "X",
  linkedin: "LinkedIn", snapchat: "Snapchat", tiktok: "TikTok",
  youtube: "YouTube", discord: "Discord", email: "Email",
  gps: "Location", custom: "Other link",
};

const arabicPlatformPlaceholders: Record<string, string> = {
  telegram: "@username أو t.me/+رمز الدعوة أو +الرمز",
  instagram: "@username أو instagram.com/username",
  tiktok: "@username أو tiktok.com/@username",
  snapchat: "username أو snapchat.com/add/username",
  twitter: "@username أو x.com/username", x: "@username أو x.com/username",
  facebook: "username أو facebook.com/username",
  linkedin: "username أو linkedin.com/in/username",
  youtube: "@username أو youtube.com/@username",
  discord: "معرّف المستخدم أو discord.gg/...",
};

export const arabicColorNames: Record<string, string> = {
  red: "أحمر", orange: "برتقالي", yellow: "أصفر", green: "أخضر",
  cyan: "سماوي", blue: "أزرق", indigo: "نيلي", violet: "بنفسجي",
  pink: "وردي", black: "أسود", white: "أبيض",
};

export const englishColorNames: Record<string, string> = {
  red: "Red", orange: "Orange", yellow: "Yellow", green: "Green",
  cyan: "Cyan", blue: "Blue", indigo: "Indigo", violet: "Violet",
  pink: "Pink", black: "Black", white: "White",
};

export function getEditorPlatformPlaceholder(platform: string, copy?: EditorCopy): string | undefined {
  if (copy?.language === "en") {
    const value = arabicPlatformPlaceholders[platform];
    return value ? value.replaceAll("أو", "or").replace("رمز الدعوة", "invite code").replace("الرمز", "code").replace("معرّف المستخدم", "user ID") : undefined;
  }
  return arabicPlatformPlaceholders[platform];
}

export function getEditorPlatformName(platform: string, copy?: EditorCopy): string {
  if (copy?.language === "en") return englishPlatformNames[platform] ?? platform;
  return copy ? arabicPlatformNames[platform] ?? platform : getPlatformNameKurdish(platform);
}

export const arabicEditorCopy = {
  verificationBadge: "إظهار شارة التوثيق الزرقاء",
  editPage: "تعديل الصفحة",
  createDefaultPage: "إنشاء الصفحة الافتراضية",
  createPage: "إنشاء صفحة جديدة",
  basicDescription: "المعلومات الأساسية",
  selectDescription: "اختر المنصات",
  linksDescription: "أضف الروابط",
  basicStep: "المعلومات", selectStep: "المنصات", linksStep: "الروابط",
  save: "حفظ", create: "إنشاء", saveNow: "احفظ الآن",
  next: "متابعة", back: "العودة", backTooltip: "العودة إلى الخطوة السابقة",
  cancel: "إلغاء", cancelTooltip: "إغلاق وتجاهل التغييرات",
  requiredTooltip: "يرجى ملء الحقول المطلوبة", saving: "جارٍ الحفظ...",
  close: "إغلاق",
  incompleteQuestions: "يرجى إكمال أسئلة واتساب غير المكتملة",
  backgroundRequired: "يرجى اختيار لون الخلفية",
  templateRequired: "يرجى اختيار تصميم الصفحة",
  platformRequired: "اختر منصة واحدة على الأقل",
  linkValueRequired: "يرجى إدخال قيمة الرابط",
  fixLinks: "يرجى تصحيح أخطاء الروابط",
  footerPhoneInvalid: "رقم هاتف التذييل غير صالح (يجب أن يتكون من ١٠ إلى ١٥ رقمًا)",
  hexColorInvalid: "يجب أن يكون اللون بصيغة Hex (مثل #000000)",
  slugTaken: "معرّف الرابط مستخدم بالفعل",
  nameTaken: "توجد صفحة أخرى بالاسم نفسه",
  allFieldsRequired: "يرجى ملء جميع الحقول المطلوبة بصورة صحيحة.",
  incompleteTitle: "المعلومات غير مكتملة",
  linkErrorsTitle: "توجد أخطاء في الروابط",
  linkErrorsHint: "تحقق من عناوين الروابط ومعلوماتها ثم صحح الأخطاء.",
  saveFailedTitle: "تعذّر الحفظ",
  saveFailedHint: "حدث خطأ أثناء الحفظ. حاول مجددًا.",
  whatsappTitle: "تواصل معنا", whatsappSubtitle: "اختر سؤالًا",
  order: "طلب منتج", orderMessage: "مرحبًا، أود تقديم طلب.",
  price: "الاستفسار عن السعر", priceMessage: "مرحبًا، كم السعر؟",
  other: "سؤال آخر", otherMessage: "مرحبًا",
  defaultDescription: "للتواصل معنا، اضغط على أحد الروابط أدناه",
  untitledPage: "صفحة بلا عنوان",
  uploadBrand: "رفع صور العلامة التجارية", chooseProfileImage: "اختر صورة الملف الشخصي",
  businessName: "اسم النشاط التجاري", name: "الاسم",
  businessNamePlaceholder: "اكتب اسم النشاط التجاري", pageNamePlaceholder: "اسم الصفحة",
  checkingName: "جارٍ التحقق من الاسم...", username: "اسم المستخدم",
  subtitle: "العنوان الفرعي", subtitlePlaceholder: "اكتب عنوانًا فرعيًا",
  footerButtonColor: "لون زر التذييل",
  subtitleColor: "لون العنوان الفرعي", clearColor: "إزالة اللون",
  subtitleColorHint: "اختر لونًا واحدًا للعنوان الفرعي",
  description: "الوصف", subdomain: "النطاق الفرعي",
  subdomainPlaceholder: "اكتب النطاق الفرعي", slugPlaceholder: "اكتب المعرّف",
  checkingSlug: "جارٍ التحقق من المعرّف...",
  pageStyle: "تصميم الصفحة", chooseTemplateHint: "تحديد قالب الصفحة",
  chooseStyle: "اختر تصميمًا", backgroundPattern: "نمط الخلفية",
  choosePatternHint: "تحديد نمط خلفية الصفحة",
  websiteColor: "لون الموقع (Website Color)", backgroundColor: "لون الخلفية",
  hideFooter: "إخفاء التذييل", footerHiddenHint: "إخفاء التذييل (مخفي)",
  footerShownHint: "إظهار التذييل (ظاهر)", footerHidden: "التذييل مخفي",
  footerShown: "التذييل ظاهر", footerName: "اسم التذييل",
  footerNamePlaceholder: "مثال: Sponsor.krd", mobilePhone: "رقم الهاتف",
  whatsappQuestions: "أسئلة واتساب", disableWhatsapp: "تعطيل نافذة واتساب",
  enableWhatsapp: "تفعيل نافذة واتساب", whatsappEnabled: "نافذة واتساب مفعّلة",
  whatsappDisabled: "نافذة واتساب معطّلة", modalTitle: "عنوان النافذة",
  modalSubtitle: "العنوان الفرعي", questions: "الأسئلة",
  addQuestionHint: "إضافة سؤال واتساب جديد", addQuestion: "إضافة سؤال",
  noQuestions: "لا توجد أسئلة. انقر لإضافة سؤال جديد.", question: "سؤال",
  deleteQuestion: "حذف السؤال", questionText: "نص السؤال",
  questionMessage: "الرسالة (النص المُرسل عبر واتساب)",
  questionTextRequired: "يرجى كتابة نص السؤال", questionMessageRequired: "يرجى كتابة الرسالة",
  selectedCount: "منصة محددة", selectPlatformsTitle: "اختر المنصات",
  selectPlatform: "تحديد", removePlatform: "إزالة",
  moveUp: "نقل إلى الأعلى", moveDown: "نقل إلى الأسفل",
  removeLink: "حذف رابط", addAnother: "إضافة رابط آخر لـ",
  imageHasBackground: "هذه الصورة لها خلفيتها الخاصة", buttonColor: "لون الزر",
  linkLabelPlaceholder: "يُستخدم الاسم الإنجليزي إذا تُرك فارغًا",
  toggleLanguage: "تبديل اللغة (العربية / الإنجليزية)", arabic: "العربية",
  english: "الإنجليزية",
  noPlatforms: "لم تختر أي منصة", addLinksHint: "أضف روابط للمنصات المحددة",
  linkCount: "رابط",
  clear: "مسح", clearValue: "مسح القيمة",
  customColor: "لون مخصص", backgroundImage: "صورة الخلفية",
  removeBackgroundImage: "إزالة صورة الخلفية",
  profilePreview: "معاينة صورة الملف الشخصي", removeImage: "إزالة الصورة",
} as const;

export type EditorCopy = Partial<Record<keyof typeof arabicEditorCopy, string>> & { language?: "en" };

const arabicValidationErrors: Record<string, string> = {
  "تکایە ناو بنووسە": "يرجى إدخال الاسم",
  "ناو دەبێت لانی کەم ٢ پیت بێت": "يجب أن يتكون الاسم من حرفين على الأقل",
  "تکایە slug بنووسە": "يرجى إدخال معرّف الرابط",
  "Slug دەبێت لانی کەم ٢ پیت بێت": "يجب أن يتكون المعرّف من حرفين على الأقل",
  "Slug دەبێت تەنها پیتی بچووک، ژمارە و هێڵ بێت": "يُسمح بالأحرف الإنجليزية الصغيرة والأرقام والشرطة فقط",
  "تکایە بەهای لینکەکە بنووسە": "يرجى إدخال قيمة الرابط",
  "تکایە ژمارەیەکی دروستی عێراق بنووسە (دەبێت بە 075, 077, 078, 079 دەستپێبکات و ١١ ژمارە بێت)": "أدخل رقمًا عراقيًا صحيحًا يبدأ بـ 075 أو 077 أو 078 أو 079 ويتكون من ١١ رقمًا",
  "تکایە ژمارەیەکی دروستی عێراق بنووسە (دەبێت بە 75, 77, 78, 79 دەستپێبکات و ١٠ ژمارە بێت)": "أدخل رقمًا عراقيًا صحيحًا يبدأ بـ 75 أو 77 أو 78 أو 79 ويتكون من ١٠ أرقام",
  "تکایە ژمارەیەکی مۆبایلی دروست بنووسە": "يرجى إدخال رقم هاتف صحيح",
  "لینکی تێلیگرام نادروستە (ناوی بەکارهێنەر یان t.me/+کۆدی بانگهێشت بنووسە)": "رابط تيليجرام غير صالح؛ أدخل اسم المستخدم أو رابط الدعوة t.me/+code",
  "تکایە لینکێکی دروستی ئینستاگرام بنووسە (پێویستە instagram.com بێت)": "يرجى إدخال رابط إنستغرام صحيح من instagram.com",
  "ناوی بەکارهێنەری ئینستاگرام نادروستە": "اسم مستخدم إنستغرام غير صالح",
  "تکایە لینکێکی دروستی فەیسبووک بنووسە (پێویستە facebook.com بێت)": "يرجى إدخال رابط فيسبوك صحيح من facebook.com",
  "ناوی بەکارهێنەری فەیسبووک نادروستە (لانیکەم ٥ پیت یان ژمارە)": "اسم مستخدم فيسبوك غير صالح (٥ أحرف أو أرقام على الأقل)",
  "تکایە لینکێکی دروستی تیکتۆک بنووسە (پێویستە tiktok.com بێت)": "يرجى إدخال رابط تيك توك صحيح من tiktok.com",
  "ناوی بەکارهێنەری تیکتۆک نادروستە": "اسم مستخدم تيك توك غير صالح",
  "تکایە لینکێکی دروستی سناپچات بنووسە (پێویستە snapchat.com/add/username بێت)": "يرجى إدخال رابط سناب شات صحيح",
  "ناوی بەکارهێنەری سناپچات نادروستە": "اسم مستخدم سناب شات غير صالح",
  "تکایە لینکێکی دروستی یوتیوب بنووسە": "يرجى إدخال رابط يوتيوب صحيح",
  "ناوی کەناڵی یوتیوب نادروستە": "اسم قناة يوتيوب غير صالح",
  "تکایە لینکێکی دروستی ئێکس/تویتەر بنووسە": "يرجى إدخال رابط إكس/تويتر صحيح",
  "ناوی بەکارهێنەری ئێکس/تویتەر نادروستە": "اسم مستخدم إكس/تويتر غير صالح",
  "تکایە لینکێکی دروستی لینکدئین بنووسە": "يرجى إدخال رابط لينكدإن صحيح",
  "ناوی ناسنامەی لینکدئین نادروستە": "معرّف لينكدإن غير صالح",
  "تکایە لینکێکی دروستی دیسکۆرد بنووسە": "يرجى إدخال رابط ديسكورد صحيح",
  "ئایدی دیسکۆرد نادروستە (دەبێت نێوان ١٧ بۆ ٢٠ ژمارە بێت)": "معرّف ديسكورد غير صالح (١٧ إلى ٢٠ رقمًا)",
  "کۆدی بانگهێشتی دیسکۆرد نادروستە": "رمز دعوة ديسكورد غير صالح",
  "تکایە ناونیشانی ئیمەیڵێکی دروست بنووسە (نموونە: user@example.com)": "يرجى إدخال بريد إلكتروني صحيح (مثل user@example.com)",
  "تکایە ناونیشانی GPS دروست بنووسە (نموونە: 36.191, 44.009) یان لینکێکی نەخشەی گووگڵ": "أدخل إحداثيات GPS صحيحة أو رابط خرائط Google",
  "تکایە لینکێکی دروست بنووسە": "يرجى إدخال رابط صحيح",
  "تکایە لینکێکی دروست بنووسە (نموونە: example.com)": "يرجى إدخال رابط صحيح (مثل example.com)",
};

export function localizeEditorValidationError(error: string | undefined, copy?: EditorCopy): string | undefined {
  if (!copy || !error) return error;
  if (copy.language === "en") {
    const maxNameEnglish = error.match(/^ناو دەبێت کەمتر لە (\d+) پیت بێت$/);
    if (maxNameEnglish) return `Name must contain fewer than ${maxNameEnglish[1]} characters`;
    const maxSlugEnglish = error.match(/^Slug دەبێت کەمتر لە (\d+) پیت بێت$/);
    if (maxSlugEnglish) return `Slug must contain fewer than ${maxSlugEnglish[1]} characters`;
    return englishValidationErrors[error] ?? error;
  }
  const maxName = error.match(/^ناو دەبێت کەمتر لە (\d+) پیت بێت$/);
  if (maxName) return `يجب ألا يزيد الاسم عن ${maxName[1]} حرفًا`;
  const maxSlug = error.match(/^Slug دەبێت کەمتر لە (\d+) پیت بێت$/);
  if (maxSlug) return `يجب ألا يزيد المعرّف عن ${maxSlug[1]} حرفًا`;
  return arabicValidationErrors[error] ?? error;
}

export function localizeEditorUploadError(error: InlineRequestErrorData, copy?: EditorCopy): InlineRequestErrorData {
  return localizeInlineRequestError(error, copy?.language === "en" ? "en" : copy ? "ar" : "ckb");
}

const englishValidationErrors: Record<string, string> = {
  "تکایە ناو بنووسە": "Enter a name",
  "ناو دەبێت لانی کەم ٢ پیت بێت": "Name must contain at least 2 characters",
  "تکایە slug بنووسە": "Enter a slug",
  "Slug دەبێت لانی کەم ٢ پیت بێت": "Slug must contain at least 2 characters",
  "Slug دەبێت تەنها پیتی بچووک، ژمارە و هێڵ بێت": "Use lowercase letters, numbers, and hyphens only",
  "تکایە بەهای لینکەکە بنووسە": "Enter a link value",
  "تکایە ژمارەیەکی دروستی عێراق بنووسە (دەبێت بە 075, 077, 078, 079 دەستپێبکات و ١١ ژمارە بێت)": "Enter an 11-digit Iraqi number starting with 075, 077, 078, or 079",
  "تکایە ژمارەیەکی دروستی عێراق بنووسە (دەبێت بە 75, 77, 78, 79 دەستپێبکات و ١٠ ژمارە بێت)": "Enter a 10-digit Iraqi number starting with 75, 77, 78, or 79",
  "تکایە ژمارەیەکی مۆبایلی دروست بنووسە": "Enter a valid phone number",
  "لینکی تێلیگرام نادروستە (ناوی بەکارهێنەر یان t.me/+کۆدی بانگهێشت بنووسە)": "Invalid Telegram link; enter a username or t.me/+invite-code",
  "تکایە لینکێکی دروستی ئینستاگرام بنووسە (پێویستە instagram.com بێت)": "Enter a valid instagram.com link",
  "ناوی بەکارهێنەری ئینستاگرام نادروستە": "Invalid Instagram username",
  "تکایە لینکێکی دروستی فەیسبووک بنووسە (پێویستە facebook.com بێت)": "Enter a valid facebook.com link",
  "ناوی بەکارهێنەری فەیسبووک نادروستە (لانیکەم ٥ پیت یان ژمارە)": "Invalid Facebook username (at least 5 letters or digits)",
  "تکایە لینکێکی دروستی تیکتۆک بنووسە (پێویستە tiktok.com بێت)": "Enter a valid tiktok.com link",
  "ناوی بەکارهێنەری تیکتۆک نادروستە": "Invalid TikTok username",
  "تکایە لینکێکی دروستی سناپچات بنووسە (پێویستە snapchat.com/add/username بێت)": "Enter a valid Snapchat link",
  "ناوی بەکارهێنەری سناپچات نادروستە": "Invalid Snapchat username",
  "تکایە لینکێکی دروستی یوتیوب بنووسە": "Enter a valid YouTube link",
  "ناوی کەناڵی یوتیوب نادروستە": "Invalid YouTube channel name",
  "تکایە لینکێکی دروستی ئێکس/تویتەر بنووسە": "Enter a valid X link",
  "ناوی بەکارهێنەری ئێکس/تویتەر نادروستە": "Invalid X username",
  "تکایە لینکێکی دروستی لینکدئین بنووسە": "Enter a valid LinkedIn link",
  "ناوی ناسنامەی لینکدئین نادروستە": "Invalid LinkedIn profile ID",
  "تکایە لینکێکی دروستی دیسکۆرد بنووسە": "Enter a valid Discord link",
  "ئایدی دیسکۆرد نادروستە (دەبێت نێوان ١٧ بۆ ٢٠ ژمارە بێت)": "Discord ID must contain 17–20 digits",
  "کۆدی بانگهێشتی دیسکۆرد نادروستە": "Invalid Discord invite code",
  "تکایە ناونیشانی ئیمەیڵێکی دروست بنووسە (نموونە: user@example.com)": "Enter a valid email address (for example, user@example.com)",
  "تکایە ناونیشانی GPS دروست بنووسە (نموونە: 36.191, 44.009) یان لینکێکی نەخشەی گووگڵ": "Enter valid GPS coordinates or a Google Maps link",
  "تکایە لینکێکی دروست بنووسە": "Enter a valid link",
  "تکایە لینکێکی دروست بنووسە (نموونە: example.com)": "Enter a valid link (for example, example.com)",
};
