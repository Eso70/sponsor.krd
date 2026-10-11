import { Check, MessageCircleQuestion } from "lucide-react";
import type { FormContentBlock } from "../types";
import type { FormEditorCopy } from "../form-editor-copy";
import { formListItems } from "../form-list-items";
export function FormListPreview({
  block,
  labels,
  placeholders,
}: {
  block: FormContentBlock;
  labels: FormEditorCopy;
  placeholders: boolean;
}) {
  const faq = block.type === "faq";
  return (
    <section className="space-y-3 border-t border-slate-400/20 pt-4">
      <h4 className="break-words text-sm font-bold">
        {block.title ||
          (placeholders ? (faq ? labels.faq : labels.stepsHeadlineHint) : "")}
      </h4>
      <ol className="space-y-3">
        {formListItems(block).map((step, index) => (
          <li key={step.id} className="flex items-start gap-2">
            <span
              aria-hidden
              className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full"
              style={{
                background: faq
                  ? "transparent"
                  : "var(--preview-accent-fill, #16a34a)",
                color: faq
                  ? "var(--preview-muted, #94a3b8)"
                  : "var(--preview-accent-ink, #ffffff)",
              }}
            >
              {faq ? (
                <MessageCircleQuestion className="size-4" />
              ) : (
                <Check className="size-3" strokeWidth={3} />
              )}
            </span>
            <div className="min-w-0 space-y-1">
              <h5 className="break-words text-xs font-bold">
                {step.title ||
                  (placeholders
                    ? `${faq ? labels.faqQuestionHint : labels.stepTitleHint} ${index + 1}`
                    : "")}
              </h5>
              <p className="whitespace-pre-wrap break-words text-xs leading-5 opacity-75">
                {step.text ||
                  (placeholders
                    ? `${faq ? labels.faqAnswerHint : labels.stepDescriptionHint} ${index + 1}`
                    : "")}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
