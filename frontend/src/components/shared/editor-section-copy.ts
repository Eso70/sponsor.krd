type Locale = "en" | "ar" | "ckb";
type CountKind =
  "images" | "links" | "questions" | "platforms" | "items" | "required";
const text = {
  en: {
    empty: "Not set",
    off: "Off",
    automatic: "Automatic",
    enabled: "Enabled",
    required: "Acknowledgement on",
  },
  ar: {
    empty: "غير محدد",
    off: "معطّل",
    automatic: "تلقائي",
    enabled: "مفعّل",
    required: "الإقرار مفعّل",
  },
  ckb: {
    empty: "دانەنراوە",
    off: "ناچالاک",
    automatic: "خۆکار",
    enabled: "چالاک",
    required: "ڕەزامەندی چالاکە",
  },
} as const;
const counts = {
  en: {
    images: ["image", "images"],
    links: ["link", "links"],
    questions: ["question", "questions"],
    platforms: ["platform", "platforms"],
    items: ["item", "items"],
    required: ["required", "required"],
  },
  ar: {
    images: "صور",
    links: "روابط",
    questions: "أسئلة",
    platforms: "منصات",
    items: "عناصر",
    required: "مطلوبة",
  },
  ckb: {
    images: "وێنە",
    links: "بەستەر",
    questions: "پرسیار",
    platforms: "پلاتفۆڕم",
    items: "دانە",
    required: "پێویست",
  },
} as const;
export function editorSectionCopy(locale: Locale) {
  return {
    ...text[locale],
    count: (kind: CountKind, count: number) => {
      const label =
        locale === "en"
          ? counts.en[kind][count === 1 ? 0 : 1]
          : counts[locale][kind];
      return `${new Intl.NumberFormat(locale).format(count)} ${label}`;
    },
  };
}
