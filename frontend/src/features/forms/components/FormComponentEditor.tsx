import type { FormContentBlock, FormLanguage } from "../types";
import type { FormsCopy } from "../forms-copy";
import type { FormEditorCopy } from "../form-editor-copy";
import { FormListEditor } from "./FormListEditor";
import { FormImageSetEditor } from "./FormImageSetEditor";
import { FormTextComponentEditor } from "./FormTextComponentEditor";
import { FormAboutEditor } from "./FormAboutEditor";
import { FormImagePicker } from "./FormImagePicker";

export function FormComponentEditor({
  block,
  onChange,
  copy,
  labels,
  language = "en",
}: {
  block: FormContentBlock;
  onChange: (patch: Partial<FormContentBlock>) => void;
  copy: FormsCopy;
  labels: FormEditorCopy;
  language?: FormLanguage;
}) {
  if (block.type === "about")
    return (
      <FormAboutEditor
        block={block}
        onChange={onChange}
        copy={copy}
        labels={labels}
      />
    );
  if (block.type === "steps" || block.type === "faq")
    return (
      <FormListEditor
        block={block}
        onChange={onChange}
        copy={copy}
        labels={labels}
      />
    );
  if (block.type === "products" || block.type === "testimonials")
    return (
      <FormImageSetEditor
        block={block}
        onChange={onChange}
        copy={copy}
        labels={labels}
      />
    );
  if ((block.type ?? "text") === "text") {
    return (
      <FormTextComponentEditor
        block={block}
        language={language}
        onChange={onChange}
        copy={copy}
        labels={labels}
      />
    );
  }
  if (block.type === "image" || block.type === "carousel") {
    return (
      <FormImagePicker
        variant="component"
        labels={labels}
        label={block.type === "carousel" ? labels.carousel : labels.image}
        multiple={block.type === "carousel"}
        images={block.images ?? []}
        onChange={(images) => onChange({ images })}
        copy={copy}
        hint={labels.componentImageHint}
      />
    );
  }
  return null;
}
