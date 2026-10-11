import { VisibilitySwitch } from "@/components/shared/VisibilitySwitch";
import type { FormContentBlock } from "../types";
import type { FormsCopy } from "../forms-copy";
import type { FormEditorCopy } from "../form-editor-copy";
import { FormEditorInput } from "./FormEditorInput";
import { FormImagePicker } from "./FormImagePicker";
export function FormAboutEditor({
  block,
  onChange,
  copy,
  labels,
}: {
  block: FormContentBlock;
  onChange: (patch: Partial<FormContentBlock>) => void;
  copy: FormsCopy;
  labels: FormEditorCopy;
}) {
  return (
    <div className="space-y-4">
      <FormEditorInput
        label={copy.headline}
        value={block.title}
        placeholder={labels.about}
        maxLength={20}
        showCount
        onChange={(title) => onChange({ title })}
      />
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <VisibilitySwitch
            compact
            label={labels.image}
            checked={block.imageEnabled !== false}
            onChange={(imageEnabled) => onChange({ imageEnabled })}
          />
          <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
            {labels.image}
          </span>
        </div>
        {block.imageEnabled !== false && (
          <FormImagePicker
            variant="component"
            labels={labels}
            label={labels.image}
            images={block.images ?? []}
            onChange={(images) => onChange({ images })}
            copy={copy}
            hint={labels.componentImageHint}
          />
        )}
      </div>
      <FormEditorInput
        label={copy.descriptionLabel}
        value={block.text}
        placeholder={labels.aboutDescriptionHint}
        multiline
        maxLength={2000}
        onChange={(text) => onChange({ text })}
      />
    </div>
  );
}
