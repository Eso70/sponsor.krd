import type { FormDraft, FormQuestion } from "./types";

export function visibleFormQuestions(
  form: FormDraft,
  answers: Record<string, string>,
): FormQuestion[] {
  const visibleIds = new Set<string>();
  const byId = new Map(
    form.questions.map((question) => [question.id, question]),
  );
  return form.questions.filter((question) => {
    const visible =
      !question.condition ||
      (visibleIds.has(question.condition.questionId) &&
        answers[question.condition.questionId] === question.condition.equals &&
        byId
          .get(question.condition.questionId)
          ?.options.includes(question.condition.equals));
    if (visible) visibleIds.add(question.id);
    return visible;
  });
}
export function formCardPages(
  questions: FormQuestion[],
): { id: string; personal: boolean; questions: FormQuestion[] }[] {
  const pages: ReturnType<typeof formCardPages> = [];
  for (const question of questions) {
    if (!question.category)
      pages.push({ id: question.id, personal: false, questions: [question] });
    else {
      const previous = pages.at(-1);
      if (previous?.personal) previous.questions.push(question);
      else
        pages.push({
          id: pages.some((page) => page.personal)
            ? `personal:${question.id}`
            : "personal",
          personal: true,
          questions: [question],
        });
    }
  }
  return pages;
}
