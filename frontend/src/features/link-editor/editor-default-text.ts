import { arabicEditorCopy, englishEditorCopy, getEditorPlatformName, type EditorCopy } from "./editor-copy";
import { DEFAULT_DESCRIPTION, getPlatformNameKurdish, SOCIAL_PLATFORMS } from "./modal-constants";

const kurdishDefaults = {
  defaultDescription: DEFAULT_DESCRIPTION,
  whatsappTitle: "پەیوەندی کردن",
  whatsappSubtitle: "پرسیارێک هەڵبژێرە",
  order: "داواکردن",
  orderMessage: "سڵاو بەڕێز دەمەوێت داوا بکەم.",
  price: "زانینی نرخ",
  priceMessage: "سڵاو بەڕێز، نرخی چەندە ؟",
  other: "پرسیارێکی تر",
  otherMessage: "سڵاو",
};
export type EditorDefaultTextKey = keyof typeof kurdishDefaults;

/** Translate only recognized built-in defaults; authored content is never translated. */
export function localizeEditorDefaultText(value: string, key: EditorDefaultTextKey, copy?: EditorCopy): string {
  const defaults = [kurdishDefaults[key], englishEditorCopy[key], arabicEditorCopy[key]];
  const normalized = value.trim().normalize("NFKC").toLocaleLowerCase();
  const builtIn = key === "whatsappTitle" || key === "whatsappSubtitle"
    ? defaults.some((text) => text.trim().normalize("NFKC").toLocaleLowerCase() === normalized)
    : defaults.includes(value);
  return builtIn
    ? copy?.[key] ?? kurdishDefaults[key] : value;
}

export function localizeEditorDefaultLinkName(value: string | undefined, platform: string, copy?: EditorCopy): string | undefined {
  if (value === undefined) return value;
  const defaults = [getPlatformNameKurdish(platform), getEditorPlatformName(platform, englishEditorCopy), getEditorPlatformName(platform, arabicEditorCopy), SOCIAL_PLATFORMS.find((item) => item.id === platform)?.name];
  return defaults.includes(value) ? getEditorPlatformName(platform, copy) : value;
}

export function questionDefaultKeys(id: string): { text: EditorDefaultTextKey; message: EditorDefaultTextKey } | undefined {
  switch (id) {
    case "order": return { text: "order", message: "orderMessage" };
    case "price": return { text: "price", message: "priceMessage" };
    case "other": return { text: "other", message: "otherMessage" };
    default: return undefined;
  }
}
