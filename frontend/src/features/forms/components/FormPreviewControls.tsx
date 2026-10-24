"use client";

import { ColorGradientPopupButton } from "@/components/shared/ColorGradientPopupButton";
import { arabicColorGradientCopy } from "@/components/shared/color-gradient-arabic-copy";
import { englishBusinessMessages } from "@/features/shared/i18n/english-messages";
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
      <ColorGradientPopupButton
        label={labels.color}
        value={color}
        onChange={onColorChange}
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
