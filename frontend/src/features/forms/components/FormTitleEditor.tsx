import { Check, Loader2, RefreshCw } from "lucide-react";
import { FormEditorInput } from "./FormEditorInput";
import type { FormsCopy } from "../forms-copy";
import type { useFormTitleAvailability } from "../use-form-title-availability";

export function FormTitleEditor({
  title,
  onChange,
  availability,
  copy,
  previousSlug,
}: {
  title: string;
  onChange: (name: string) => void;
  availability: ReturnType<typeof useFormTitleAvailability>;
  copy: FormsCopy;
  previousSlug?: string;
}) {
  return (
    <div className="space-y-2">
      <FormEditorInput
        label={copy.name}
        validationField="name"
        value={title}
        onChange={onChange}
        placeholder={copy.titlePlaceholder}
        maxLength={100}
        required
      />
      <div
        aria-live="polite"
        className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400"
      >
        {availability.slug && (
          <span dir="ltr" className="break-all font-mono">
            /form/{availability.slug}
          </span>
        )}
        {availability.status === "checking" && (
          <span className="inline-flex items-center gap-1">
            <Loader2 className="size-3 animate-spin motion-reduce:animate-none" />
            {copy.checkingTitle}
          </span>
        )}
        {availability.status === "available" && (
          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
            <Check className="size-3" />
            {copy.titleAvailable}
          </span>
        )}
        {availability.status === "taken" && (
          <span className="text-rose-600 dark:text-rose-300">
            {copy.titleTaken}
          </span>
        )}
        {availability.status === "error" && (
          <button
            type="button"
            onClick={availability.retry}
            className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-300"
          >
            <RefreshCw className="size-3" />
            {copy.titleCheckError}
          </button>
        )}
      </div>
      {previousSlug &&
        availability.slug &&
        previousSlug !== availability.slug && (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {copy.titleUrlChanges}
          </p>
        )}
    </div>
  );
}
