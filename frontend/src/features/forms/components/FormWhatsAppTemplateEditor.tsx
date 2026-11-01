"use client";

import { useId, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  FORM_WHATSAPP_TEMPLATE_LIMIT,
  validFormWhatsAppTemplate,
} from "@linktree/types/form-whatsapp-template.cjs";
import type { FormWhatsAppTemplates } from "@linktree/types";
import type {
  FormWhatsAppSettings,
  FormWhatsAppDetailsConfig,
} from "@linktree/types";
import { validFormWhatsAppDetails } from "@linktree/types/form-whatsapp-details.cjs";
import { FormWhatsAppDetailsEditor } from "./FormWhatsAppDetailsEditor";
import { FormWhatsAppMessagePreview } from "./FormWhatsAppMessagePreview";
import { ModalTextArea } from "@/components/shared/ModalTextArea";
import { SettingsActionButton } from "@/components/shared/SettingsActionButton";
import { LanguagePreferenceSelect } from "@/components/shared/LanguagePreferenceSelect";
import { FormWhatsAppSettingsActions } from "./FormWhatsAppSettingsActions";
import {
  defaultFormWhatsAppTemplate,
  defaultFormWhatsAppDetails,
  formWhatsAppCopy,
} from "../form-submission-whatsapp";
import { formWhatsAppSettingsCopy } from "../form-whatsapp-settings-copy";
import type { FormLanguage } from "../types";

export function FormWhatsAppTemplateEditor({
  templates,
  detailsSettings,
  locale,
  saving,
  saveFailed,
  onSave,
  onReset,
}: {
  templates: FormWhatsAppTemplates;
  detailsSettings?: FormWhatsAppSettings["details"];
  locale: FormLanguage;
  saving: boolean;
  saveFailed: boolean;
  onSave: (
    language: FormLanguage,
    value: string | null,
    details?: FormWhatsAppDetailsConfig,
  ) => Promise<boolean>;
  onReset?: () => void;
}) {
  const [language, setLanguage] = useState(locale);
  const [values, setValues] = useState<FormWhatsAppTemplates>(templates);
  const [details, setDetails] = useState(detailsSettings ?? {});
  const id = useId();
  const field = useRef<HTMLTextAreaElement>(null);
  const copy = formWhatsAppSettingsCopy(locale),
    messageCopy = formWhatsAppCopy(locale);
  const defaultValue = defaultFormWhatsAppTemplate(language);
  const value = values[language] ?? defaultValue;
  const detailDefaults = defaultFormWhatsAppDetails(language);
  const detailValue = details[language] ?? detailDefaults;
  const templateValid = validFormWhatsAppTemplate(value);
  const detailsValid = validFormWhatsAppDetails(detailValue);
  const valid = templateValid && detailsValid;
  const insert = (token: string) => {
    const start = field.current?.selectionStart ?? value.length,
      end = field.current?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + token + value.slice(end);
    if (next.length > FORM_WHATSAPP_TEMPLATE_LIMIT) return;
    setValues((previous) => ({ ...previous, [language]: next }));
    queueMicrotask(() => {
      field.current?.focus({ preventScroll: true });
      field.current?.setSelectionRange(
        start + token.length,
        start + token.length,
      );
    });
  };
  return (
    <div className="space-y-4" dir={locale === "en" ? "ltr" : "rtl"}>
      <FormWhatsAppSettingsActions
        locale={locale}
        saving={saving}
        valid={valid}
        onRestore={() => {
          setValues((previous) => ({
            ...previous,
            [language]: defaultValue,
          }));
          setDetails((previous) => ({
            ...previous,
            [language]: detailDefaults,
          }));
          onReset?.();
        }}
        onSave={() => {
          void onSave(
            language,
            value === defaultValue ? null : value,
            detailValue,
          ).then((saved) => {
            if (saved) toast.success(copy.saved);
          });
        }}
      />
      <LanguagePreferenceSelect
        label={copy.language}
        value={language}
        onChange={setLanguage}
        disabled={saving}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SettingsActionButton
          label={copy.name}
          icon={Plus}
          variant="soft"
          accentMode="tenant"
          disabled={saving}
          onClick={() => insert("{{name}}")}
        />
        <SettingsActionButton
          label={copy.details}
          icon={Plus}
          variant="soft"
          accentMode="tenant"
          disabled={saving}
          onClick={() => insert("{{details}}")}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={id} className="text-sm font-semibold">
            {messageCopy.message}
          </label>
        </div>
        <ModalTextArea
          id={id}
          ref={field}
          dir="auto"
          rows={9}
          maxLength={FORM_WHATSAPP_TEMPLATE_LIMIT}
          value={value}
          disabled={saving}
          aria-invalid={!templateValid || undefined}
          onChange={(event) =>
            setValues((previous) => ({
              ...previous,
              [language]: event.target.value,
            }))
          }
        />
        {!templateValid && (
          <p role="alert" className="text-xs text-rose-600 dark:text-rose-300">
            {copy.invalid}
          </p>
        )}
        {saveFailed && (
          <p role="alert" className="text-xs text-rose-600 dark:text-rose-300">
            {copy.saveError}
          </p>
        )}
      </div>
      <FormWhatsAppDetailsEditor
        value={detailValue}
        locale={locale}
        disabled={saving}
        onChange={(next) =>
          setDetails((previous) => ({ ...previous, [language]: next }))
        }
      />
      <FormWhatsAppMessagePreview
        language={language}
        locale={locale}
        template={value}
        details={detailValue}
      />
      {!detailsValid && (
        <p role="alert" className="text-xs text-rose-600 dark:text-rose-300">
          {copy.detailInvalid}
        </p>
      )}
    </div>
  );
}
