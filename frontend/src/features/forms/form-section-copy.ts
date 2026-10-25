import type { FormContentBlock } from "./types";
import { formImageEntries } from "./form-image-entries";
import { editorSectionCopy } from "@/components/shared/editor-section-copy";
import { formsCopy, type FormsCopy } from "./forms-copy";
export function formSectionCopy(copy: FormsCopy) {
  return editorSectionCopy(
    copy === formsCopy("en") ? "en" : copy === formsCopy("ar") ? "ar" : "ckb",
  );
}

/** Summaries follow the same legacy image-entry resolution as the editor itself. */
export function formBlockSummary(block: FormContentBlock, copy: FormsCopy) {
  const details = formSectionCopy(copy);
  switch (block.type) {
    case "image":
    case "carousel":
      return details.count("images", block.images?.length ?? 0);
    case "products":
    case "testimonials":
      return details.count(
        "items",
        formImageEntries(block).filter(
          (entry) =>
            entry.image.trim() ||
            entry.title.trim() ||
            entry.description.trim(),
        ).length,
      );
    case "steps":
    case "faq":
      return details.count("items", block.items?.length ?? 0);
    default:
      return block.text.trim() || details.empty;
  }
}
