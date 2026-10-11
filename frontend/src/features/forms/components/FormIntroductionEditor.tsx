import { VisibilitySwitch } from "@/components/shared/VisibilitySwitch";
import type { FormDraft } from "../types";
import type { FormsCopy } from "../forms-copy";
import type { FormEditorCopy } from "../form-editor-copy";
import { FormImagePicker } from "./FormImagePicker";
import { FormEditorInput } from "./FormEditorInput";
export function FormIntroductionEditor({
  form,
  onChange,
  copy,
  labels,
  card = false,
}: {
  form: FormDraft;
  onChange: (patch: Partial<FormDraft>) => void;
  copy: FormsCopy;
  labels: FormEditorCopy;
  card?: boolean;
}) {
  return (
    <>
      <div className="flex items-center gap-2">
        <VisibilitySwitch
          compact
          label={copy.logo}
          checked={form.logoEnabled !== false}
          onChange={(logoEnabled) => onChange({ logoEnabled })}
        />
        <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300">
          {copy.logo}
        </span>
      </div>
      {form.logoEnabled !== false && (
        <FormImagePicker
          label={copy.logo}
          variant="logo"
          labels={labels}
          images={form.logo ? [form.logo] : []}
          onChange={(images) => onChange({ logo: images[0] ?? "" })}
          hint={labels.logoHint}
          copy={copy}
        />
      )}
      <FormEditorInput
        validationField="headline"
        label={copy.headline}
        value={form.headline}
        placeholder={labels.headlineHint}
        onChange={(headline) => onChange({ headline })}
        maxLength={card ? 50 : 60}
        showCount={card}
      />
      <FormEditorInput
        label={copy.descriptionLabel}
        value={form.description}
        placeholder={labels.descriptionHint}
        onChange={(description) => onChange({ description })}
        multiline
        maxLength={210}
        hint={labels.optional}
      />
      <FormEditorInput
        label={labels.slogan}
        value={form.slogan ?? ""}
        placeholder={labels.sloganHint}
        onChange={(slogan) => onChange({ slogan })}
        maxLength={94}
        hint={labels.optional}
      />
      {card && (
        <div className="flex items-center gap-2">
          <VisibilitySwitch
            compact
            label={labels.timeEstimate}
            checked={form.displayTimeEstimate === true}
            onChange={(displayTimeEstimate) =>
              onChange({ displayTimeEstimate })
            }
          />
          <span className="text-[13px] font-semibold">
            {labels.timeEstimate}
          </span>
        </div>
      )}
    </>
  );
}
