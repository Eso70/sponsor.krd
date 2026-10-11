"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ColorGradientModal } from "@/components/shared/ColorGradientModal";
import { arabicColorGradientCopy } from "@/components/shared/color-gradient-arabic-copy";
import { englishBusinessMessages } from "@/features/shared/i18n/english-messages";
import { parseWebsiteColor } from "@/lib/utils/parse-website-color";
import { CustomSelect } from "@/components/shared/CustomSelect";
import type { FormDraft, FormLanguage } from "../types";
import type { FormsCopy } from "../forms-copy";
import type { FormEditorCopy } from "../form-editor-copy";

/** Equal-width preview preferences; these never change the saved draft. */
export function FormPreviewControls({
  language,
  appearance,
  color,
  onColorChange,
  onLanguageChange,
  onAppearanceChange,
  copy,
  labels,
}: {
  language: FormLanguage;
  appearance: FormDraft["appearance"];
  color: string;
  onColorChange: (color: string) => void;
  onLanguageChange: (language: FormLanguage) => void;
  onAppearanceChange: (appearance: FormDraft["appearance"]) => void;
  copy: FormsCopy;
  labels: FormEditorCopy;
}) {
  const colorAnchor = useRef<HTMLButtonElement>(null);
  const [colorOpen, setColorOpen] = useState(false);
  const closeColor = useCallback(() => setColorOpen(false), []);
  return (
    <div className="grid w-full grid-cols-3 gap-2">
      <CustomSelect
        hideLabel
        label={labels.previewLanguage}
        triggerLabel={labels.language}
        value={language}
        options={[
          { value: "ckb", label: "کوردی" },
          { value: "ar", label: "العربية" },
          { value: "en", label: "English" },
        ]}
        onChange={onLanguageChange}
        triggerClassName="!justify-center !text-xs"
      />
      <CustomSelect
        hideLabel
        label={labels.previewTheme}
        triggerLabel={labels.theme}
        value={appearance}
        options={[
          { value: "light", label: copy.light },
          { value: "dark", label: copy.dark },
        ]}
        onChange={onAppearanceChange}
        triggerClassName="!justify-center !text-xs"
      />
      <button
        ref={colorAnchor}
        type="button"
        aria-label={labels.color}
        aria-haspopup="dialog"
        aria-expanded={colorOpen}
        onClick={() => setColorOpen((open) => !open)}
        className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
      >
        <span
          aria-hidden
          className="size-3 shrink-0 rounded-full"
          style={{ background: parseWebsiteColor(color).css }}
        />
        <span>{labels.color}</span>
        <ChevronDown aria-hidden className="size-3 shrink-0" />
      </button>
      <ColorGradientModal
        isOpen={colorOpen}
        anchorRef={colorAnchor}
        value={color}
        onChange={onColorChange}
        onClose={closeColor}
        solidFallback="#16a34a"
        gradientFallback="#3b82f6"
        title={labels.color}
        copy={
          language === "ar"
            ? arabicColorGradientCopy
            : language === "en"
              ? englishBusinessMessages.SettingsColorPicker
              : undefined
        }
      />
    </div>
  );
}
