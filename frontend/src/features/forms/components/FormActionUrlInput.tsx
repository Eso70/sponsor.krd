import { ExternalLink } from "lucide-react";
import { isFormUrl } from "../forms-model";
import { FormEditorInput } from "./FormEditorInput";

export function FormActionUrlInput({
  label,
  value,
  placeholder,
  onChange,
  previewLabel,
  validationField,
}: {
  validationField?: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (url: string) => void;
  previewLabel: string;
}) {
  const content = (
    <>
      <ExternalLink aria-hidden className="size-3" />
      {previewLabel}
    </>
  );
  const className =
    "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold";
  return (
    <FormEditorInput
      validationField={validationField}
      label={label}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      maxLength={2048}
      inputAction={
        isFormUrl(value) ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${previewLabel}: ${label}`}
            className={className}
          >
            {content}
          </a>
        ) : (
          <button
            type="button"
            disabled
            aria-label={`${previewLabel}: ${label}`}
            className={`${className} opacity-40`}
          >
            {content}
          </button>
        )
      }
    />
  );
}
