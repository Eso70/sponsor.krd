"use client";
import { useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
} from "lucide-react";
import { arabicColorGradientCopy } from "@/components/shared/color-gradient-arabic-copy";
import { englishBusinessMessages } from "@/features/shared/i18n/english-messages";
import { ColorGradientModal } from "@/components/shared/ColorGradientModal";
import { ColorChannelSlider } from "@/components/shared/ColorChannelSlider";
import { ModalTextArea } from "@/components/shared/ModalTextArea";
import type { FormContentBlock, FormTextStyle, FormLanguage } from "../types";
import type { FormEditorCopy } from "../form-editor-copy";
import type { FormsCopy } from "../forms-copy";
import { formTextStyle, textSpacing } from "../form-text-style";

export function FormTextComponentEditor({
  block,
  onChange,
  labels,
  copy,
  language,
}: {
  block: FormContentBlock;
  onChange: (patch: Partial<FormContentBlock>) => void;
  labels: FormEditorCopy;
  copy: FormsCopy;
  language: FormLanguage;
}) {
  const style = block.textStyle ?? {};
  const update = (patch: Partial<FormTextStyle>) =>
    onChange({ textStyle: { ...style, ...patch } });
  const anchor = useRef<HTMLButtonElement>(null);
  const [colorOpen, setColorOpen] = useState(false);
  const tools = [
    {
      label: labels.bold,
      icon: Bold,
      active: !!style.bold,
      click: () => update({ bold: !style.bold }),
    },
    {
      label: labels.italic,
      icon: Italic,
      active: !!style.italic,
      click: () => update({ italic: !style.italic }),
    },
    {
      label: labels.underline,
      icon: Underline,
      active: !!style.underline,
      click: () => update({ underline: !style.underline }),
    },
    ...([1, 2, 3] as const).map((heading) => ({
      label:
        labels[
          heading === 1 ? "heading1" : heading === 2 ? "heading2" : "heading3"
        ],
      icon: heading === 1 ? Heading1 : heading === 2 ? Heading2 : Heading3,
      active: style.heading === heading,
      click: () => update({ heading: style.heading === heading ? 0 : heading }),
    })),
    ...(["start", "center", "end", "justify"] as const).map((align) => ({
      label:
        labels[
          align === "start"
            ? "alignStart"
            : align === "center"
              ? "alignCenter"
              : align === "end"
                ? "alignEnd"
                : "justifyText"
        ],
      icon:
        align === "start"
          ? AlignLeft
          : align === "center"
            ? AlignCenter
            : align === "end"
              ? AlignRight
              : AlignJustify,
      active: (style.align ?? "start") === align,
      click: () => update({ align }),
    })),
  ];
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
        <div
          role="group"
          aria-label={copy.sectionText}
          className="flex flex-wrap items-center gap-1 bg-slate-50 p-2 dark:bg-white/[0.03]"
        >
          {tools.map(({ label, icon: Icon, active, click }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              title={label}
              aria-pressed={active}
              onClick={click}
              className={`flex size-8 cursor-pointer items-center justify-center rounded-lg transition ${active ? "theme-soft" : "text-slate-500 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-white/10"}`}
            >
              <Icon aria-hidden className="size-4" />
            </button>
          ))}
          <button
            ref={anchor}
            type="button"
            aria-label={labels.color}
            title={labels.color}
            aria-expanded={colorOpen}
            onClick={() => setColorOpen(!colorOpen)}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-white/10"
          >
            <Palette aria-hidden className="size-4" />
          </button>
          {style.color && (
            <button
              type="button"
              onClick={() => update({ color: undefined })}
              className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-white/10"
            >
              {labels.resetColor}
            </button>
          )}
        </div>
        <ModalTextArea
          aria-label={copy.sectionText}
          placeholder={labels.textHint}
          value={block.text}
          maxLength={2000}
          rows={4}
          style={{ ...formTextStyle(style), paddingTop: 12, paddingBottom: 12 }}
          onChange={(event) => onChange({ text: event.target.value })}
          className="!min-h-28 !rounded-none !border-0 !shadow-none"
        />
      </div>
      <fieldset className="space-y-3">
        <legend className="text-[13px] font-bold text-slate-700 dark:text-slate-200">
          {labels.textMargin}
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(["marginTop", "marginBottom"] as const).map((key) => (
            <ColorChannelSlider
              key={key}
              label={labels[key]}
              value={textSpacing(style[key])}
              max={80}
              unit="px"
              color="var(--theme-primary)"
              track="var(--theme-primary)"
              onChange={(value) => update({ [key]: value })}
            />
          ))}
        </div>
      </fieldset>
      <ColorGradientModal
        anchorRef={anchor}
        isOpen={colorOpen}
        value={style.color ?? "#334155"}
        allowGradient={false}
        title={labels.color}
        onChange={(color) => update({ color })}
        onClose={() => setColorOpen(false)}
        copy={{
          ...(language === "ar"
            ? arabicColorGradientCopy
            : language === "en"
              ? englishBusinessMessages.SettingsColorPicker
              : {}),
          title: labels.color,
          apply: copy.save,
          close: copy.close,
        }}
      />
    </div>
  );
}
