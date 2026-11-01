import type { FormWhatsAppDetailsConfig } from "@linktree/types";
import { validFormWhatsAppTemplate } from "@linktree/types/form-whatsapp-template.cjs";
import { validFormWhatsAppDetails } from "@linktree/types/form-whatsapp-details.cjs";
import {
  submissionWhatsAppMessage,
  formWhatsAppCopy,
} from "../form-submission-whatsapp";
import { FormWhatsAppMessageText } from "./FormWhatsAppMessageText";
import { formWhatsAppMockSubmission } from "../form-whatsapp-example";
import { formWhatsAppSettingsCopy } from "../form-whatsapp-settings-copy";
import type { FormLanguage } from "../types";

export function FormWhatsAppMessagePreview({
  language,
  locale,
  template,
  details,
}: {
  language: FormLanguage;
  locale: FormLanguage;
  template: string;
  details: FormWhatsAppDetailsConfig;
}) {
  const copy = formWhatsAppSettingsCopy(locale);
  const valid =
    validFormWhatsAppTemplate(template) && validFormWhatsAppDetails(details);
  return (
    <section
      aria-label={copy.example}
      className="min-w-0 space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-white/[0.025]"
    >
      <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        {copy.example}
      </h4>
      <div
        role="document"
        data-form-content
        aria-label={formWhatsAppCopy(locale).message}
        dir="auto"
        className="min-w-0 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 dark:text-slate-200"
      >
        {valid ? (
          <FormWhatsAppMessageText
            text={submissionWhatsAppMessage(
              formWhatsAppMockSubmission(language),
              language,
              template,
              details,
            )}
          />
        ) : (
          copy.previewIncomplete
        )}
      </div>
    </section>
  );
}
