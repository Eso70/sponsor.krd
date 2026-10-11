"use client";
import { useState } from "react";
import type { FormDraft } from "./types";
import { formPreviewAnswers } from "./form-preview-answers";

/** Independent answers and calling codes shared by both local preview flows. */
export function useFormPreviewResponses(form: FormDraft) {
  const [storedAnswers, setAnswers] = useState<Record<string, string>>({});
  const [phoneCountryCodes, setPhoneCountryCodes] = useState<
    Record<string, string>
  >({});
  const [consent, setConsent] = useState(true);
  return {
    answers: formPreviewAnswers(form, storedAnswers),
    setAnswers,
    phoneCountryCodes,
    setPhoneCountryCodes,
    consent,
    setConsent,
  };
}
