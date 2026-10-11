import type { FormAnalytics } from "../types";
import type { FormsCopy } from "../forms-copy";
type Summary = NonNullable<
  NonNullable<FormAnalytics["insights"]>["answerSummaries"]
>;

export function FormAnswerAnalytics({
  questions,
  copy,
}: {
  questions: Summary;
  copy: FormsCopy;
}) {
  if (!questions.length) return null;
  return (
    <section aria-label={copy.answerSummaries} className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{copy.answerSummaries}</h3>
        <p className="mt-1 text-xs text-slate-500">{copy.summaryHint}</p>
      </div>
      {questions.map((question) => (
        <details
          key={question.questionId}
          className="rounded-xl border border-slate-200/70 p-3 dark:border-white/10"
        >
          <summary className="cursor-pointer text-xs font-semibold wrap-anywhere">
            {question.label}
            <span className="ms-2 font-normal text-slate-500">
              {copy.answered}: {question.totalAnswers}
            </span>
          </summary>
          <dl className="mt-3 space-y-3">
            {question.options.map((option, index) => (
              <div key={index}>
                <div className="flex justify-between gap-3 text-xs">
                  <dt className="min-w-0 wrap-anywhere">
                    {option.label ?? copy.otherAnswers}
                  </dt>
                  <dd className="shrink-0 font-semibold">
                    {option.count} · {option.percentage.toFixed(1)}%
                  </dd>
                </div>
                <div
                  aria-hidden
                  className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/5"
                >
                  <div
                    className="theme-fill h-full rounded-full"
                    style={{ width: `${Math.min(100, option.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </dl>
        </details>
      ))}
    </section>
  );
}
