import type { EditorCopy } from "./editor-copy";

export function questionVideoCopy(copy?: EditorCopy) {
  if (copy?.language === "en") return { label: "Video link", error: "Enter a valid video link" };
  if (copy) return { label: "رابط الفيديو", error: "أدخل رابط فيديو صحيحًا" };
  return { label: "بەستەری ڤیدیۆ", error: "بەستەرێکی دروستی ڤیدیۆ بنووسە" };
}
