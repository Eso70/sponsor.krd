"use client";
import { useSyncExternalStore } from "react";
import type { FormDraft, FormAction } from "./types";
import { formActionUrl, isFormUrl } from "./forms-model";
const subscribeToDevice = () => () => {};
/** The completion guidance and footer must agree on available destinations. */
export function useFormPreviewActions(
  form: FormDraft,
  placeholders: boolean,
): FormAction[] {
  const userAgent = useSyncExternalStore(
    subscribeToDevice,
    () => navigator.userAgent,
    () => "",
  );
  if (form.actionsEnabled === false) return [];
  const actions: FormAction[] = [
    ...(form.buttonText
      ? [
          {
            id: "legacy",
            type: "website" as const,
            text: form.buttonText,
            url: form.buttonUrl,
          },
        ]
      : []),
    ...(form.actions ?? []),
  ];
  return actions
    .filter(
      (action) =>
        placeholders ||
        (isFormUrl(formActionUrl(action, userAgent)) && !!action.text.trim()),
    )
    .map((action) => ({ ...action, url: formActionUrl(action, userAgent) }));
}
