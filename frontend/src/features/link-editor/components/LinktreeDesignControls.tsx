"use client";

import { useId, useRef, useState } from "react";
import { Layout, Sparkles } from "lucide-react";
import type { BackgroundPatternStyle } from "@linktree/types";
import type { BusinessLocale } from "@/features/business/i18n/messages";
import { BackgroundPatternModal } from "@/components/shared/BackgroundPatternModal";
import { SHARED_SOFT_BUTTON_CLASS } from "@/components/shared/shared-control-styles";
import { Tooltip } from "@/components/shared/Tooltip";
import { TEMPLATE_OPTIONS } from "@/lib/templates/config";
import { backgroundPatternLabel } from "@/lib/templates/background-pattern";
import { TemplateSelector } from "../TemplateSelector";
import { arabicPatternCopy, arabicTemplatePickerCopy, englishPatternCopy, englishTemplatePickerCopy, type EditorCopy } from "../editor-copy";

/** Existing design pickers, grouped with the page appearance above the preview. */
export function LinktreeDesignControls({ locale, copy, templateKey, backgroundPattern, onTemplateChange, onPatternChange, templateError, allowedTemplateKeys }: {
  locale: BusinessLocale;
  copy?: EditorCopy;
  templateKey: string;
  backgroundPattern: BackgroundPatternStyle;
  onTemplateChange: (key: string) => void;
  onPatternChange: (pattern: BackgroundPatternStyle) => void;
  templateError?: string;
  allowedTemplateKeys?: readonly string[];
}) {
  const templateAnchor = useRef<HTMLButtonElement>(null);
  const errorId = useId();
  const patternAnchor = useRef<HTMLButtonElement>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [patternOpen, setPatternOpen] = useState(false);
  const template = TEMPLATE_OPTIONS.find((item) => item.id === templateKey);
  const patternCopy = locale === "en" ? englishPatternCopy : locale === "ar" ? arabicPatternCopy : undefined;
  const buttonClass = `${SHARED_SOFT_BUTTON_CLASS} flex h-10 min-w-0 items-center justify-center gap-2 px-2 text-xs font-semibold`;
  const designLabel = copy?.pageStyle ?? "شێوازی پەڕە";
  const patternLabel = copy?.backgroundPattern ?? "شێوازی پاشبنەما";
  return (
    <div className="contents" data-template-section dir={locale === "en" ? "ltr" : "rtl"}>
      <div className="contents">
        <Tooltip content={designLabel}>
          <button ref={templateAnchor} type="button" aria-label={designLabel} aria-haspopup="dialog" aria-expanded={templateOpen}
            aria-describedby={templateError ? errorId : undefined} onClick={() => setTemplateOpen(true)} className={buttonClass}>
            <Layout aria-hidden className="size-4 shrink-0" />
            <span className="truncate">{template?.name ?? copy?.chooseStyle ?? "شێوازێک هەڵبژێرە"}</span>
          </button>
        </Tooltip>
        <Tooltip content={patternLabel}>
          <button ref={patternAnchor} type="button" aria-label={patternLabel} aria-haspopup="dialog" aria-expanded={patternOpen}
            onClick={() => setPatternOpen(true)} className={buttonClass}>
            <Sparkles aria-hidden className="size-4 shrink-0" />
            <span className="truncate">{patternCopy?.labels[backgroundPattern] ?? backgroundPatternLabel(backgroundPattern)}</span>
          </button>
        </Tooltip>
      </div>
      {templateError && <p id={errorId} role="alert" className="col-span-3 text-xs text-red-500">{templateError}</p>}
      <TemplateSelector anchorRef={templateAnchor} copy={locale === "en" ? englishTemplatePickerCopy : locale === "ar" ? arabicTemplatePickerCopy : undefined}
        isOpen={templateOpen} onClose={() => setTemplateOpen(false)} selectedTemplate={templateKey}
        onSelectTemplate={onTemplateChange} allowedTemplateKeys={allowedTemplateKeys} />
      <BackgroundPatternModal anchorRef={patternAnchor} copy={patternCopy} isOpen={patternOpen} onClose={() => setPatternOpen(false)}
        value={backgroundPattern} onChange={onPatternChange} />
    </div>
  );
}
