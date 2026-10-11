import type { ReactNode } from "react";
import type { FormDraft, FormLanguage } from "../types";
import { formText } from "../forms-localization";
import type { FormsCopy } from "../forms-copy";
import type { FormEditorCopy } from "../form-editor-copy";
import { isFormUrl } from "../forms-model";
import { useFormPreviewActions } from "../use-form-preview-actions";
import { FormPrivacyHelp } from "./FormPrivacyHelp";
import { CheckboxField } from "@/components/shared/CheckboxField";
import {
  FORM_PREVIEW_ACTION_CLASS,
  FormPreviewButton,
} from "./FormPreviewButton";
import { AnimatedTapHint } from "@/components/shared/AnimatedTapHint";

/** Outside the scrolling body; form ownership preserves native required-field validation. */
export function FormPreviewFooter({
  form,
  publicPage = false,
  completionFooter,
  onAction,
  language,
  copy,
  labels,
  formId,
  showFinal,
  placeholders,
  lastStep,
  currentStep,
  canSubmit,
  onBack,
  consent,
  onConsentChange,
}: {
  form: FormDraft;
  publicPage?: boolean;
  completionFooter?: ReactNode;
  onAction?: (id: string, url: string) => void;
  language: FormLanguage;
  copy: FormsCopy;
  labels: FormEditorCopy;
  formId: string;
  showFinal: boolean;
  placeholders: boolean;
  lastStep: boolean;
  currentStep: number;
  canSubmit: boolean;
  onBack?: () => void;
  consent: boolean;
  onConsentChange: (value: boolean) => void;
}) {
  const visibleActions = useFormPreviewActions(form, placeholders);
  const buttonClass = FORM_PREVIEW_ACTION_CLASS;
  if (showFinal && !visibleActions.length && !completionFooter) return null;
  return (
    <footer className="shrink-0 space-y-2 border-t border-slate-400/20 p-3">
      {showFinal ? (
        <>
          {visibleActions.map((action) =>
            isFormUrl(action.url) && action.text.trim() ? (
              <a
                key={action.id}
                href={action.url}
                onClick={() => onAction?.(action.id, action.url)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass}
                data-form-action
              >
                {formText(action.text, action.textKey, language)}
                {form.showHandCursor !== false && <AnimatedTapHint />}
              </a>
            ) : placeholders ? (
              <span key={action.id} className={`${buttonClass} opacity-50`}>
                {formText(action.text, action.textKey, language) ||
                  labels.buttonHint}
                {form.showHandCursor !== false && <AnimatedTapHint />}
              </span>
            ) : null,
          )}
          {completionFooter}
        </>
      ) : (
        <>
          {lastStep && (
            <div
              className={`flex items-center gap-2 ${form.consentRequired ? "justify-between" : "justify-end"}`}
            >
              {form.consentRequired && (
                <CheckboxField
                  bare
                  compact
                  colorMode="inherit"
                  form={formId}
                  required
                  checked={consent}
                  onChange={onConsentChange}
                  label={copy.consentText}
                />
              )}
              <FormPrivacyHelp language={language} publicPage={publicPage} />
            </div>
          )}
          <div className="flex gap-2">
            {form.layout === "card" && currentStep > 0 && (
              <button
                type="button"
                onClick={onBack}
                className="min-h-9 rounded-lg border border-slate-400/30 px-3 py-2 text-xs"
              >
                {copy.back}
              </button>
            )}
            <FormPreviewButton
              type="submit"
              form={formId}
              disabled={!canSubmit}
              className="flex-1"
            >
              {lastStep ? copy.submit : copy.next}
            </FormPreviewButton>
          </div>
        </>
      )}
    </footer>
  );
}
