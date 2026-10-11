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
        (question.type === "conditional"
          ? !!question.conditional && isConditionalAnswers(question.conditional)
          : question.type === "choice"
            ? question.options.length >= 2 &&
              question.options.every((option) => !!option.trim())
            : true),
    )
  );
}
