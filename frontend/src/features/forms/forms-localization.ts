import { formsCopy } from "./forms-copy";
import { formEditorCopy } from "./form-editor-copy";
import type { FormAction, FormLanguage, FormTextKey } from "./types";

/** Explicit provenance prevents translating authored text that happens to match a default. */
export function formText(
  value: string,
  key: FormTextKey | undefined,
  language: FormLanguage,
): string {
  if (!key) return value;
  const copy = formsCopy(language);
  const labels = formEditorCopy(language);
  if (key === "email" || key === "phone" || key === "policy") return copy[key];
  return labels[key];
}
export const actionTextKeys: Record<FormAction["type"], FormTextKey> = {
  website: "website",
  app: "app",
  content: "viewContent",
};
