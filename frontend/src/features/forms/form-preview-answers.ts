import {
  isProductConfigured,
  productQuantities,
  validProductQuantity,
} from "./product-selection";
import type { FormDraft, FormQuestion } from "./types";
import {
  conditionalOptions,
  isConditionalAnswers,
  type ConditionalAnswers,
} from "./conditional-csv";

/** A changed CSV invalidates its old path and all descendants. */
export function conditionalSelection(
  data: ConditionalAnswers,
  value: string,
): string[] {
  let answers: string[] = [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      Array.isArray(parsed) &&
      parsed.every((item) => typeof item === "string")
    )
      answers = parsed;
  } catch {
    /* Unanswered or obsolete local preview state. */
  }
  const selected: string[] = [];
  for (let index = 0; index < data.columns.length; index++) {
    const options = conditionalOptions(data, index, selected);
    selected.push(options.includes(answers[index]) ? answers[index] : "");
  }
  return selected;
}

export function formPreviewAnswers(
  form: FormDraft,
  stored: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    form.questions.map((question) => {
      const value = stored[question.id] ?? "";
      return [
        question.id,
        question.type === "choice" && !question.options.includes(value)
          ? ""
          : question.type === "conditional" && question.conditional
            ? JSON.stringify(conditionalSelection(question.conditional, value))
            : value,
      ];
    }),
  );
}

/** Incomplete drafts must not silently skip an unconfigured required question. */
export function canPreviewQuestions(questions: FormQuestion[]): boolean {
  return (
    questions.length > 0 &&
    questions.every(
      (question) =>
        !question.required ||
        (question.type === "product"
          ? !!question.productSelection?.items.length &&
            question.productSelection.items.every(isProductConfigured)
          : question.type === "conditional"
            ? !!question.conditional &&
              isConditionalAnswers(question.conditional)
            : question.type === "choice"
              ? question.options.length >= 2 &&
                question.options.every((option) => !!option.trim())
              : true),
    )
  );
}

/** Shared readiness check for the full form and each card's required answers. */
export function canSubmitQuestions(
  questions: FormQuestion[],
  answers: Record<string, string>,
  phoneCountryCodes: Record<string, string>,
): boolean {
  return (
    canPreviewQuestions(questions) &&
    questions.every((question) => {
      const value = (answers[question.id] ?? "").trim();
      if (question.type === "product") {
        const items = question.productSelection?.items ?? [];
        if (!items.length || !items.every(isProductConfigured)) return false;
        const quantities = productQuantities(value);
        return (
          items.every((item) =>
            validProductQuantity(quantities[item.id] ?? ""),
          ) &&
          (!question.required ||
            items.some((item) => Number(quantities[item.id] ?? 0) > 0))
        );
      }
      if (question.type === "conditional" && question.conditional) {
        const selection = conditionalSelection(question.conditional, value);
        return !question.required || selection.every(Boolean);
      }
      if (!value) return !question.required;
      if (question.type === "choice") return question.options.includes(value);
      if (question.type === "email")
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      if (question.type === "phone") {
        const code = phoneCountryCodes[question.id] || "964";
        let digits = value.replace(/[\s()-]/g, "");
        if (digits.startsWith("+")) {
          if (!digits.startsWith(`+${code}`)) return false;
          digits = digits.slice(code.length + 1);
        } else if (code === "964") digits = digits.replace(/^0/, "");
        return /^\d{4,14}$/.test(digits) && code.length + digits.length <= 15;
      }
      if (question.type === "date")
        return (
          /^\d{4}-\d{2}-\d{2}$/.test(value) &&
          !Number.isNaN(Date.parse(value)) &&
          new Date(value).toISOString().slice(0, 10) === value
        );
      if (question.labelKey === "age")
        return /^\d{1,3}$/.test(value) && Number(value) <= 130;
      return true;
    })
  );
}
