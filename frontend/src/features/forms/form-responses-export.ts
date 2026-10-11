import { downloadBlob } from "@/lib/utils/download";
import { formsApi, type FormsScope } from "./api";
import { formAnswerText } from "./form-response-utils";
import type {
  FormSubmission,
  FormSummary,
  FormSubmissionFilters,
} from "./types";
import type { FormsCopy } from "./forms-copy";

function csvCell(value: unknown) {
  let text = value == null ? "" : String(value);
  // Quoting alone does not prevent spreadsheet formula execution.
  if (/^[\s\uFEFF]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text))
    text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
export function formResponsesCsv(
  form: FormSummary,
  responses: FormSubmission[],
  copy: FormsCopy,
) {
  const questions = new Map<string, string>();
  for (const response of responses)
    for (const answer of response.answers)
      if (!questions.has(answer.questionId))
        questions.set(answer.questionId, answer.label);
  const columns = [...questions];
  const labels = columns.map(([id, label]) =>
    columns.filter(([, other]) => other === label).length > 1
      ? `${label} (${id})`
      : label,
  );
  const header = [
    copy.responseId,
    copy.submittedUtc,
    copy.name,
    ...labels,
    copy.source,
    copy.campaign,
    copy.medium,
    copy.channel,
    copy.device,
    copy.responseCountry,
    `${copy.timeSpent} (${copy.seconds})`,
    copy.privacyConsent,
    copy.policyVersion,
    copy.formVersion,
  ];
  const rows = responses.map((response) => {
    const answers = new Map(
      response.answers.map((answer) => [
        answer.questionId,
        formAnswerText(answer.value),
      ]),
    );
    return [
      response.id,
      new Date(response.createdAt).toISOString(),
      form.name,
      ...columns.map(([id]) => answers.get(id) ?? ""),
      response.attribution?.source,
      response.attribution?.campaign,
      response.attribution?.medium,
      response.attribution?.channel,
      response.attribution?.device,
      response.attribution?.country,
      response.durationMs == null ? "" : response.durationMs / 1000,
      response.consent ? copy.consentGranted : copy.consentDeclined,
      response.privacyVersion,
      response.revision,
    ];
  });
  return (
    "\uFEFF" +
    [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") +
    "\r\n"
  );
}
export async function exportFormResponses(
  scope: FormsScope,
  form: FormSummary,
  filters: FormSubmissionFilters,
  copy: FormsCopy,
  signal: AbortSignal,
  onProgress: (count: number, total: number) => void,
) {
  const snapshot = {
    ...filters,
    pageSize: 100 as const,
    before: undefined as string | undefined,
  };
  const responses: FormSubmission[] = [];
  let total = 0;
  for (let page = 0; ; page++) {
    signal.throwIfAborted();
    const result = await formsApi.submissions(
      scope,
      form.id,
      page,
      signal,
      snapshot,
    );
    signal.throwIfAborted();
    if (page === 0) snapshot.before = result.snapshotAt;
    total = result.total;
    responses.push(...result.items);
    onProgress(responses.length, total);
    if (responses.length >= total || result.items.length === 0) break;
  }
  if (
    responses.length !== total ||
    new Set(responses.map((response) => response.id)).size !== responses.length
  )
    throw new Error("Incomplete export");
  signal.throwIfAborted();
  const filename = `${form.slug || "form"}-responses-${new Date().toISOString().slice(0, 10)}.csv`;
  downloadBlob(
    new Blob([formResponsesCsv(form, responses, copy)], {
      type: "text/csv;charset=utf-8",
    }),
    filename,
  );
}
