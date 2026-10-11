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
};
export function FormPreview(props: FormPreviewProps) {
  return props.form.layout === "card" ? (
    <FormCardPreview {...props} />
  ) : (
    <FormFlowPreview {...props} />
  );
}
