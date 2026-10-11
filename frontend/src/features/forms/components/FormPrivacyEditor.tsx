import { ShieldCheck } from "lucide-react";
import { VisibilitySwitch } from "@/components/shared/VisibilitySwitch";
import type { FormDraft } from "../types";
import type { FormEditorCopy } from "../form-editor-copy";
import { FormPolicyLinks } from "./FormPolicyLinks";

export function FormPrivacyEditor({
  form,
  onChange,
  labels,
}: {
  form: FormDraft;
  onChange: (patch: Partial<FormDraft>) => void;
  labels: FormEditorCopy;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex items-center gap-2 text-sm font-bold">
          <ShieldCheck className="size-4" />
          {labels.automaticPrivacy}
        </div>
        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
          {labels.automaticPrivacyHint}
        </p>
        <FormPolicyLinks language={form.language} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {labels.showAcknowledgement}
        </span>
        <VisibilitySwitch
          compact
          checked={form.consentRequired}
          label={labels.showAcknowledgement}
          onChange={(consentRequired) => onChange({ consentRequired })}
        />
      </div>
    </div>
  );
}
