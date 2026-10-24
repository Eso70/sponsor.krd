"use client";

import type { BackgroundPatternStyle } from "@linktree/types";
import type { BusinessLocale } from "@/features/business/i18n/messages";
import { LinktreeAppearanceControls } from "./LinktreeAppearanceControls";
import { LinktreeDesignControls } from "./LinktreeDesignControls";
import { arabicEditorCopy, englishEditorCopy } from "../editor-copy";

/** Settings and editors share the same design, pattern and appearance pickers. */
export function LinktreeDefaultAppearanceFields({ locale, template, color, pattern, onTemplateChange, onColorChange, onPatternChange }: {
  locale: BusinessLocale;
  template: string;
  color: string;
  pattern: BackgroundPatternStyle;
  onTemplateChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onPatternChange: (value: BackgroundPatternStyle) => void;
}) {
  return <div className="grid min-w-0 grid-cols-3 gap-2" data-testid="new-page-appearance-defaults">
    <LinktreeDesignControls locale={locale} copy={locale === "en" ? englishEditorCopy : locale === "ar" ? arabicEditorCopy : undefined}
      templateKey={template} backgroundPattern={pattern} onTemplateChange={onTemplateChange} onPatternChange={onPatternChange} />
    <LinktreeAppearanceControls locale={locale} value={color} onChange={onColorChange} />
  </div>;
}
