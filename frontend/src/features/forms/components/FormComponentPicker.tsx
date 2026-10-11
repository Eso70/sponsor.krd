import {
  AlignLeft,
  ImageIcon,
  Images,
  PackageCheck,
  Quote,
  ListChecks,
  Contact,
  CircleHelp,
} from "lucide-react";
import { CustomSelect } from "@/components/shared/CustomSelect";
import type { FormContentBlock } from "../types";
import type { FormEditorCopy } from "../form-editor-copy";

type ComponentType = NonNullable<FormContentBlock["type"]>;
const components = [
  { value: "text", icon: AlignLeft },
  { value: "image", icon: ImageIcon },
  { value: "carousel", icon: Images },
  { value: "products", icon: PackageCheck },
  { value: "testimonials", icon: Quote },
  { value: "steps", icon: ListChecks },
  { value: "about", icon: Contact },
  { value: "faq", icon: CircleHelp },
] as const;

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
      options={components.map((component) => ({
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
