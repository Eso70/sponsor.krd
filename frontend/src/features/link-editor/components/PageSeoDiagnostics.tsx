"use client";
import { isPageIndexable, meaningfulPageDescription } from "@/lib/public/page-seo";

const labels = {
  en: { heading: "Content checks", name: "Business name", description: "Business description", visible: "Search indexing enabled", path: "Public path", hint: "Saved pages receive canonical metadata, structured data, and a generated share image automatically. Live HTTP checks are part of deployment verification." },
  ar: { heading: "فحص المحتوى", name: "اسم النشاط", description: "وصف النشاط", visible: "الفهرسة مفعلة", path: "المسار العام", hint: "تحصل الصفحات المحفوظة على بيانات البحث وصورة مشاركة تلقائياً. فحص HTTP يتم عند النشر." },
  ckb: { heading: "پشکنینی ناوەڕۆک", name: "ناوی بزنس", description: "وەسفی بزنس", visible: "دەرکەوتن لە گەڕان چالاکە", path: "ڕێڕەوی گشتی", hint: "پەڕە پاشەکەوتکراوەکان بە خۆکاری زانیاری گەڕان و وێنەی هاوبەشکردن وەردەگرن. پشکنینی HTTP لە کاتی بڵاوکردنەوە ئەنجام دەدرێت." },
};

export function PageSeoDiagnostics({ name, subtitle, description, config, slug, language }: {
  name: string; subtitle: string; description: string; config: Record<string, unknown>; slug: string;
  language: "ckb" | "ar" | "en";
}) {
  const text = labels[language];
  const checks = [
    [text.name, Boolean(name.trim())], [text.description, Boolean(meaningfulPageDescription(description) || subtitle.trim())],
    [text.visible, isPageIndexable({ name, subtitle, description, template_config: config })],
  ] as const;
  return <div className="space-y-2 border-t border-slate-200 pt-3 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300">
    <h4 className="font-bold">{text.heading}</h4>
    <ul className="space-y-1">{checks.map(([label, ok]) => <li key={label}>{ok ? "✓" : "—"} {label}</li>)}</ul>
    {slug && <p>{text.path}: <span dir="ltr">/linktree/{slug}</span></p>}
    <p className="text-slate-500 dark:text-slate-400">{text.hint}</p>
  </div>;
}
