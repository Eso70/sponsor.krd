"use client";
import { Check } from "lucide-react";
import type { FormDraft } from "../types";
import type { FormsCopy } from "../forms-copy";
import type { FormEditorCopy } from "../form-editor-copy";
import { useFormPreviewActions } from "../use-form-preview-actions";
import styles from "./FormPreview.module.css";
export function FormCompletionPreview({
  form,
  copy,
  labels,
  placeholders = false,
  publicPage = false,
}: {
  form: FormDraft;
  copy: FormsCopy;
  labels: FormEditorCopy;
  placeholders?: boolean;
  publicPage?: boolean;
}) {
  const Heading = publicPage ? "h1" : "h3";
  const hasAction = useFormPreviewActions(form, placeholders).length > 0;
  const description =
    form.finalDescription || (hasAction ? labels.finalDefault : "");
  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 text-center">
      <div className={styles.success}>
        <Check aria-hidden className="size-6" />
      </div>
      <Heading className="break-words text-base font-bold">
        {form.finalTitle || copy.thankYou}
      </Heading>
      {description && (
        <p className="whitespace-pre-wrap break-words text-xs leading-5 opacity-75">
          {description}
        </p>
      )}
    </div>
  );
}
