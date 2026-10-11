import type { FormSummary } from "../types";
import type { FormsCopy } from "../forms-copy";

export function FormCollectionBadges({
  form,
  copy,
}: {
  form: FormSummary;
  copy: FormsCopy;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
      <span
        className={`rounded-md border px-1.5 py-0.5 font-medium ${form.status === "active" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300"}`}
      >
        {copy[form.status]}
      </span>
      <span className="rounded-md border border-sky-500/20 bg-sky-500/10 px-1.5 py-0.5 text-sky-700 dark:text-sky-300">
        {form.layout === "form" ? copy.formLayout : copy.cardLayout}
      </span>
      <span className="text-gray-500 dark:text-gray-400">
        {copy.questions}: {form.questionCount ?? form.questions?.length ?? 0} ·{" "}
        {copy.submissions}: {form.submissionCount ?? 0}
      </span>
    </div>
  );
}
