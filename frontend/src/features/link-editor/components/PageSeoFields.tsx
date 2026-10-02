"use client";

import type { PageSeo } from "@linktree/types";
import { EditorField } from "@/components/shared/EditorField";
import { readPageSeo } from "@/lib/public/page-seo";
import { modalInputClass, modalTextareaClass } from "../modal-input-styles";
import type { EditorCopy } from "../editor-copy";
import { PageSeoDiagnostics } from "./PageSeoDiagnostics";

const labels = {
  en: { heading: "Search and sharing", policy: "Search visibility", automatic: "Automatic — descriptive profiles only", index: "Index this public page", noindex: "Keep out of search", title: "Search title", description: "Search description", ogTitle: "Share title", ogDescription: "Share description", locale: "Page language", hint: "Leave blank to use the page’s existing content. Search engines decide whether to index a page.", follow: "Allow search engines to follow links" },
  ar: { heading: "البحث والمشاركة", policy: "الظهور في البحث", automatic: "تلقائي — الصفحات ذات المحتوى الوصفي", index: "السماح بفهرسة الصفحة", noindex: "إخفاء الصفحة من البحث", title: "عنوان البحث", description: "وصف البحث", ogTitle: "عنوان المشاركة", ogDescription: "وصف المشاركة", locale: "لغة الصفحة", hint: "اترك الحقول فارغة لاستخدام محتوى الصفحة. محركات البحث تقرر الفهرسة.", follow: "السماح لمحركات البحث باتباع الروابط" },
  ckb: { heading: "گەڕان و هاوبەشکردن", policy: "دەرکەوتن لە گەڕان", automatic: "خۆکار — تەنها پەڕەی وەسفدار", index: "ڕێگە بدە پەڕەکە لە گەڕان دەربکەوێت", noindex: "پەڕەکە لە گەڕان بشارەوە", title: "ناونیشانی گەڕان", description: "وەسفی گەڕان", ogTitle: "ناونیشانی هاوبەشکردن", ogDescription: "وەسفی هاوبەشکردن", locale: "زمانی پەڕە", hint: "بە بەتاڵی جێی بهێڵە بۆ بەکارهێنانی ناوەڕۆکی پەڕە. بزوێنەری گەڕان بڕیاری فهرستکردن دەدات.", follow: "ڕێگە بدە بزوێنەری گەڕان لینکەکان بەدوادا بچێت" },
};

export function PageSeoFields({ config, onChange, name, subtitle, description, slug, copy }: {
  config: Record<string, unknown>; onChange: (seo: PageSeo) => void;
  name: string; subtitle: string; description: string; slug: string; copy?: EditorCopy;
}) {
  const language = copy?.language === "en" ? "en" : copy ? "ar" : "ckb";
  const text = labels[language];
  const seo = readPageSeo(config);
  const update = (key: keyof PageSeo, value: string | boolean | undefined) => onChange({ ...seo, [key]: value });
  return <section className="mt-6 space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700" dir={language === "en" ? "ltr" : "rtl"}>
    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{text.heading}</h3>
    <p className="text-xs text-slate-500 dark:text-slate-400">{text.hint}</p>
    <EditorField label={text.policy}>
      <select className={modalInputClass(false)} value={seo.robotsIndex === undefined ? "auto" : String(seo.robotsIndex)}
        onChange={event => update("robotsIndex", event.target.value === "auto" ? undefined : event.target.value === "true")}>
        <option value="auto">{text.automatic}</option><option value="true">{text.index}</option><option value="false">{text.noindex}</option>
      </select>
    </EditorField>
    <EditorField label={text.title}><input className={modalInputClass(false)} maxLength={150} value={seo.title || ""}
      placeholder={name} onChange={event => update("title", event.target.value)} /></EditorField>
    <EditorField label={text.description}><textarea className={modalTextareaClass(false)} maxLength={320} rows={3} value={seo.description || ""}
      placeholder={description || subtitle} onChange={event => update("description", event.target.value)} /></EditorField>
    <EditorField label={text.ogTitle}><input className={modalInputClass(false)} maxLength={150} value={seo.ogTitle || ""}
      onChange={event => update("ogTitle", event.target.value)} /></EditorField>
    <EditorField label={text.ogDescription}><textarea className={modalTextareaClass(false)} maxLength={320} rows={2} value={seo.ogDescription || ""}
      onChange={event => update("ogDescription", event.target.value)} /></EditorField>
    <EditorField label={text.locale}><select className={modalInputClass(false)} value={seo.locale || "ckb"}
      onChange={event => onChange({ ...seo, locale: event.target.value as PageSeo["locale"] })}>
      <option value="ckb">کوردی</option><option value="ar">العربية</option><option value="en">English</option>
    </select></EditorField>
    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300"><input type="checkbox"
      checked={seo.robotsFollow !== false} onChange={event => update("robotsFollow", event.target.checked)} />{text.follow}</label>
    <PageSeoDiagnostics name={name} subtitle={subtitle} description={description} config={config} slug={slug} language={language} />
  </section>;
}
