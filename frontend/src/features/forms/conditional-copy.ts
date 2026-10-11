import type { FormLanguage } from "./types";

const copy = {
  step1: ["Step 1", "هەنگاوی ١", "الخطوة ١"],
  step2: ["Step 2", "هەنگاوی ٢", "الخطوة ٢"],
  guide: [
    "Each answer controls the next question’s choices. Download the sample, add your questions and answers, then upload your CSV.",
    "هەر وەڵامێک هەڵبژاردەکانی پرسیاری دواتر دیاری دەکات. نموونەکە دابەزێنە، پرسیار و وەڵامەکانت زیاد بکە، پاشان CSV بار بکە.",
    "تحدد كل إجابة خيارات السؤال التالي. نزّل المثال، أضف أسئلتك وإجاباتك، ثم حمّل ملف CSV.",
  ],
  format: ["How to format CSV", "چۆنیەتی ڕێکخستنی CSV", "كيفية تنسيق CSV"],
  help: [
    "First row: question titles, in order. Each following row: one complete answer path. Later choices depend on all earlier answers. Empty rows are ignored. Use 2–5 columns, up to 1,000 rows, 200 characters per cell and 256 KB. Save as UTF-8 CSV; quote values containing commas or quotes.",
    "ڕیزی یەکەم: ناونیشانی پرسیارەکان بە ڕیز. هەر ڕیزێکی دواتر: ڕێڕەوێکی تەواوی وەڵامەکان. هەڵبژاردەی دواتر پشت بە هەموو وەڵامەکانی پێشوو دەبەستێت. ڕیزی بەتاڵ پشتگوێ دەخرێت. ٢–٥ ستوون، تا ١٠٠٠ ڕیز، ٢٠٠ پیت بۆ هەر خانە و ٢٥٦ KB. بە UTF-8 CSV پاشەکەوت بکە؛ بەهاکانی ناو کۆما یان نیشانەی وتە لە نیشانەی وتەدا دابنێ.",
    "الصف الأول: عناوين الأسئلة بالترتيب. كل صف تالٍ: مسار إجابات كامل. تعتمد الخيارات التالية على جميع الإجابات السابقة. تُتجاهل الصفوف الفارغة. استخدم ٢–٥ أعمدة، حتى ١٠٠٠ صف، ٢٠٠ حرف لكل خلية و٢٥٦ KB. احفظ بصيغة UTF-8 CSV وضع القيم التي تحتوي على فواصل أو اقتباسات بين علامتي اقتباس.",
  ],
  download: [
    "Download sample CSV file",
    "دابەزاندنی نموونەی CSV",
    "تنزيل ملف CSV نموذجي",
  ],
  upload: ["Upload CSV file", "بارکردنی فایلی CSV", "تحميل ملف CSV"],
  replace: ["Replace CSV file", "گۆڕینی فایلی CSV", "استبدال ملف CSV"],
  invalid: [
    "Could not import this CSV. Check the format and limits above; your previous answers are unchanged.",
    "نەتوانرا ئەم CSV بار بکرێت. ڕێکخستن و سنوورەکانی سەرەوە بپشکنە؛ وەڵامەکانی پێشوو نەگۆڕاون.",
    "تعذر استيراد CSV. راجع التنسيق والحدود أعلاه؛ لم تتغير الإجابات السابقة.",
  ],
  loading: ["Reading CSV…", "خوێندنەوەی CSV…", "جارٍ قراءة CSV…"],
  questions: ["Questions", "پرسیارەکان", "الأسئلة"],
  paths: ["Answer paths", "ڕێڕەوی وەڵامەکان", "مسارات الإجابات"],
  select: ["Select an answer", "وەڵامێک هەڵبژێرە", "اختر إجابة"],
  empty: [
    "Upload a CSV to preview linked questions.",
    "CSV بار بکە بۆ پێشبینینی پرسیارە پەیوەستەکان.",
    "حمّل CSV لمعاينة الأسئلة المترابطة.",
  ],
};
export function conditionalCopy(language: FormLanguage) {
  const index = language === "en" ? 0 : language === "ckb" ? 1 : 2;
  return Object.fromEntries(
    Object.entries(copy).map(([key, values]) => [key, values[index]]),
  ) as Record<keyof typeof copy, string>;
}
