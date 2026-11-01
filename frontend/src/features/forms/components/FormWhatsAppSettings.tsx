"use client";

import { useFormWhatsAppTemplates } from "../use-form-whatsapp-templates";
import { formWhatsAppSettingsCopy } from "../form-whatsapp-settings-copy";
import { formsCopy } from "../forms-copy";
import { FormRequestError } from "./FormRequestError";
import { FormWhatsAppTemplateEditor } from "./FormWhatsAppTemplateEditor";
import { SettingsActionButton } from "@/components/shared/SettingsActionButton";
import { SHARED_NESTED_CARD_CLASS } from "@/components/shared/shared-surface-styles";
import { RefreshCw } from "lucide-react";
import type { FormLanguage } from "../types";

/** Shared workspace settings section; no portal or separate modal. */
export function FormWhatsAppSettings({
  settings,
  locale,
}: {
  settings: ReturnType<typeof useFormWhatsAppTemplates>;
  locale: FormLanguage;
}) {
  const copy = formWhatsAppSettingsCopy(locale),
    common = formsCopy(locale);
  return (
    <section
      aria-label={copy.title}
      className={`${SHARED_NESTED_CARD_CLASS} space-y-4 rounded-2xl p-4`}
      dir={locale === "en" ? "ltr" : "rtl"}
    >
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-[var(--theme-primary)]">
          {copy.title}
        </h3>
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {copy.hint}
        </p>
      </div>
      {settings.loading ? (
        <p role="status">{common.loading}</p>
      ) : settings.failed ? (
        <>
          <FormRequestError message={copy.loadError} />
          <SettingsActionButton
            label={common.retry}
            icon={RefreshCw}
            variant="soft"
            accentMode="tenant"
            onClick={() => void settings.load()}
          />
        </>
      ) : (
        <FormWhatsAppTemplateEditor
          templates={settings.templates}
          detailsSettings={settings.templates.details}
          locale={locale}
          saving={settings.saving}
          saveFailed={settings.saveFailed}
          onSave={settings.save}
          onReset={settings.clearSaveError}
        />
      )}
    </section>
  );
}
