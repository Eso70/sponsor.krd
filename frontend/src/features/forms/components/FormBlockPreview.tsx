import { FormListPreview } from "./FormListPreview";
import { FormAboutPreview } from "./FormAboutPreview";
import { FormImageSetPreview } from "./FormImageSetPreview";
import { formTextStyle } from "../form-text-style";
import type { FormContentBlock } from "../types";
import type { FormsCopy } from "../forms-copy";
import type { FormEditorCopy } from "../form-editor-copy";
import { FormMediaPreview } from "./FormMediaPreview";

export function FormBlockPreview({
  block,
  copy,
  labels,
  placeholders,
}: {
  block: FormContentBlock;
  copy: FormsCopy;
  labels: FormEditorCopy;
  placeholders: boolean;
}) {
  if (block.type === "about")
    return (
      <FormAboutPreview
        block={block}
        copy={copy}
        labels={labels}
        placeholders={placeholders}
      />
    );
  if (block.type === "steps" || block.type === "faq")
    return (
      <FormListPreview
        block={block}
        labels={labels}
        placeholders={placeholders}
      />
    );
  if (block.type === "products" || block.type === "testimonials")
    return (
      <FormImageSetPreview
        block={block}
        copy={copy}
        labels={labels}
        placeholders={placeholders}
      />
    );
  if ((block.type ?? "text") === "text") {
    return (
      <section
        style={formTextStyle(block.textStyle)}
        className="whitespace-pre-wrap break-words"
      >
        {block.text || (placeholders ? labels.textHint : "")}
      </section>
    );
  }
  return (
    <section className="space-y-2">
      <h4 className="break-words text-sm font-bold">
        {block.title || (placeholders ? labels[block.type ?? "text"] : "")}
      </h4>
      <FormMediaPreview
        images={block.images ?? []}
        imageTitle={block.title || labels[block.type ?? "text"]}
        carousel={block.type === "carousel"}
        placeholder={
          placeholders && ["image", "carousel"].includes(block.type ?? "text")
        }
        copy={copy}
      />
      <p className="whitespace-pre-wrap break-words text-xs opacity-75">
        {block.text ||
          (placeholders && !["image", "carousel"].includes(block.type ?? "text")
            ? labels.textHint
            : "")}
      </p>
    </section>
  );
}
