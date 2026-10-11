import type { FormSubmission } from "../types";
import { formAnswerText } from "../form-response-utils";

export function FormSubmissionDetails({
  response,
  preview = false,
}: {
  response: FormSubmission;
  preview?: boolean;
}) {
  const answers = preview ? response.answers.slice(0, 2) : response.answers;
  return (
    <dl
      className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${preview ? "" : "lg:grid-cols-3"}`}
    >
      {answers.map((answer) => (
        <div
          key={answer.questionId}
          className={`min-w-0 ${preview ? "" : "rounded-xl border border-slate-200/70 bg-white p-3 dark:border-white/10 dark:bg-white/[0.025]"}`}
        >
          <dt className="text-[11px] font-medium text-slate-500 wrap-anywhere dark:text-slate-400">
            {answer.label}
          </dt>
          <dd
            dir="auto"
            className={`mt-1 text-[13px] font-medium leading-5 text-slate-800 wrap-anywhere dark:text-slate-100 ${preview ? "line-clamp-2" : "whitespace-pre-wrap"}`}
          >
            {formAnswerText(answer.value) || "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}
