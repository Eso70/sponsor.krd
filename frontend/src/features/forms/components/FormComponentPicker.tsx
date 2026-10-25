import { FORM_CONTENT_COMPONENTS } from "../form-content-components";
import { CustomSelect } from "@/components/shared/CustomSelect";
import type { FormContentBlock } from "../types";
import type { FormEditorCopy } from "../form-editor-copy";

type ComponentType = NonNullable<FormContentBlock["type"]>;

/** Localized component cards reuse the shared viewport-aware action picker. */
export function FormComponentPicker({
  labels,
  disabled,
  onAdd,
}: {
  labels: FormEditorCopy;
  disabled: boolean;
  onAdd: (type: ComponentType) => void;
}) {
  return (
    <CustomSelect<ComponentType | "">
      hideLabel
      label={labels.addComponent}
      triggerLabel={`+ ${labels.addComponent}`}
      value=""
      allowEmptySelection
      fullWidth
      disabled={disabled}
      menuLayout="grid"
      minMenuWidth={480}
      maxMenuHeight={460}
      options={FORM_CONTENT_COMPONENTS.map((component) => ({
        ...component,
        label: labels[component.value],
      }))}
      onChange={(type) => {
        if (type) onAdd(type);
      }}
      triggerClassName="!border-dashed !text-[13px]"
    />
  );
}
