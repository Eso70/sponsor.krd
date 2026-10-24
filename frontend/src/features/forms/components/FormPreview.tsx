"use client";
import type { ReactNode } from "react";
import type { FormDraft, FormLanguage } from "../types";
import { FormCardPreview } from "./FormCardPreview";
import { FormFlowPreview } from "./FormFlowPreview";
export type FormResponseValues = {
  answers: Record<string, string>;
  phoneCountryCodes: Record<string, string>;
  consent: boolean;
};
export type FormPreviewProps = {
  completionFooter?: ReactNode;
  onSubmit?: (response: FormResponseValues) => Promise<void>;
  onStart?: () => void;
  onAction?: (id: string, url: string) => void;
  form: FormDraft;
  finalPage?: boolean;
  language?: FormLanguage;
  appearance?: FormDraft["appearance"];
  color?: string;
  placeholders?: boolean;
  scrollable?: boolean;
  presentation?: "preview" | "public";
  /** Device previews use the public responsive layout without public behavior. */
  viewport?: "embedded" | "device";
};
export function FormPreview(props: FormPreviewProps) {
  // Samples belong to the editor preview, never the published page or draft.
  const previewProps = {
    ...props,
    placeholders: props.presentation !== "public" && props.placeholders === true,
  };
  return props.form.layout === "card" ? (
    <FormCardPreview {...previewProps} />
  ) : (
    <FormFlowPreview {...previewProps} />
  );
}
