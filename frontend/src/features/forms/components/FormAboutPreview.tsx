import type { FormContentBlock } from "../types";
import type { FormsCopy } from "../forms-copy";
import type { FormEditorCopy } from "../form-editor-copy";
import { FormMediaPreview } from "./FormMediaPreview";
export function FormAboutPreview({
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
  return (
    <section className="space-y-3 border-t border-slate-400/20 pt-4">
      <h4 className="break-words text-sm font-bold">
        {block.title || (placeholders ? labels.about : "")}
      </h4>
      {block.imageEnabled !== false && (
        <div className="overflow-hidden rounded-lg">
          <FormMediaPreview
            banner
            images={block.images ?? []}
            imageTitle={block.title || labels.about}
            placeholder={placeholders}
            copy={copy}
          />
        </div>
      )}
      <p className="whitespace-pre-wrap break-words text-xs leading-5 opacity-75">
        {block.text || (placeholders ? labels.aboutDescriptionHint : "")}
      </p>
    </section>
  );
}
