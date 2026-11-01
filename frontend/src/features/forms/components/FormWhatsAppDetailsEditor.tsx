"use client";

import { useId } from "react";
import type { FormWhatsAppDetailsConfig } from "@linktree/types";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { ModalTextInput } from "@/components/shared/ModalTextInput";
import { SettingsField } from "@/components/shared/SettingsField";
import { VisibilitySwitch } from "@/components/shared/VisibilitySwitch";
import { formWhatsAppSettingsCopy } from "../form-whatsapp-settings-copy";
import type { FormLanguage } from "../types";

export function FormWhatsAppDetailsEditor({
  value,
  locale,
  disabled,
  onChange,
}: {
  value: FormWhatsAppDetailsConfig;
  locale: FormLanguage;
  disabled: boolean;
  onChange: (value: FormWhatsAppDetailsConfig) => void;
}) {
  const copy = formWhatsAppSettingsCopy(locale),
    id = useId();
  return (
    <section
      aria-label={copy.detailLayout}
      className="space-y-3 border-t border-slate-200/70 pt-4 dark:border-white/10"
    >
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">{copy.detailLayout}</h4>
      </div>
      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        {copy.restriction}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <CustomSelect
          label={copy.order}
          value={value.order}
          onChange={(order) => onChange({ ...value, order })}
          disabled={disabled}
          options={[
            { value: "form", label: copy.formOrder },
            { value: "products_first", label: copy.productsFirst },
            { value: "answers_first", label: copy.answersFirst },
          ]}
        />
        <CustomSelect
          label={copy.style}
          value={value.style}
          onChange={(style) => onChange({ ...value, style })}
          disabled={disabled}
          options={[
            { value: "compact", label: copy.compact },
            { value: "spaced", label: copy.spaced },
            { value: "bullets", label: copy.bullets },
          ]}
        />
        <CustomSelect
          label={copy.productLayout}
          value={value.productLayout ?? "calculation"}
          disabled={disabled}
          onChange={(productLayout) => onChange({ ...value, productLayout })}
          options={[
            { value: "columns", label: copy.columns },
            { value: "calculation", label: copy.calculation },
          ]}
        />
        <SettingsField label={copy.namePrefix} htmlFor={`${id}-name`}>
          <ModalTextInput
            id={`${id}-name`}
            value={value.namePrefix}
            maxLength={80}
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...value, namePrefix: event.target.value })
            }
          />
        </SettingsField>
        <SettingsField label={copy.heading} htmlFor={`${id}-heading`}>
          <ModalTextInput
            id={`${id}-heading`}
            value={value.heading}
            maxLength={160}
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...value, heading: event.target.value })
            }
          />
        </SettingsField>
        <SettingsField label={copy.totalLabel} htmlFor={`${id}-total`}>
          <ModalTextInput
            id={`${id}-total`}
            value={value.totalLabel}
            maxLength={80}
            required
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...value, totalLabel: event.target.value })
            }
          />
        </SettingsField>
        <VisibilitySwitch
          label={copy.showLabels}
          stateLabel={copy.showLabels}
          checked={value.showLabels}
          disabled={disabled}
          onChange={(showLabels) => onChange({ ...value, showLabels })}
        />
      </div>
    </section>
  );
}
