import { downloadBlob } from "@/lib/utils/download";
import { formsApi, type FormsScope } from "./api";
import { formResponsesTable } from "./form-responses-table";
import type {
  FormSubmission,
  FormSummary,
  FormSubmissionFilters,
  FormSubmissionsPage,
  FormDraft,
} from "./types";
import type { FormsCopy } from "./forms-copy";

function csvCell(value: unknown) {
  let text =
    value == null
      ? ""
      : value instanceof Date
        ? value.toISOString()
        : String(value);
  // Quoting alone does not prevent spreadsheet formula execution.
  if (/^[\s\uFEFF]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text))
    text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
function tableCsv(table: ReturnType<typeof formResponsesTable>) {
  return (
    "\uFEFF" +
    [table.headers, ...table.rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n") +
    "\r\n"
  );
}
export function formResponsesCsv(
  form: FormSummary,
  responses: FormSubmission[],
  copy: FormsCopy,
) {
  return tableCsv(formResponsesTable(form, responses, copy));
}
export async function exportFormResponses(
  scope: FormsScope,
  form: FormSummary,
  filters: FormSubmissionFilters,
  copy: FormsCopy,
  signal: AbortSignal,
  onProgress: (count: number, total: number) => void,
) {
  signal.throwIfAborted();
  const definition = await formsApi.get(scope, form.id, signal);
  return exportResponsePages({
    definition,
    filters,
    copy,
    signal,
    onProgress,
    readPage: (page, snapshot) =>
      formsApi.submissions(scope, form.id, page, signal, snapshot),
  });
}

/** Shared snapshot pagination, completeness checks and safe CSV encoding. */
export async function exportResponsePages({
  definition,
  filters,
  copy,
  signal,
  onProgress,
  readPage,
  essential = false,
}: {
  definition: Pick<FormSummary, "id" | "name" | "slug"> & {
    questions?: FormDraft["questions"];
  };
  filters: FormSubmissionFilters;
  copy: FormsCopy;
  signal: AbortSignal;
  onProgress: (count: number, total: number) => void;
  readPage: (
    page: number,
    filters: FormSubmissionFilters,
  ) => Promise<FormSubmissionsPage>;
  essential?: boolean;
}) {
  signal.throwIfAborted();
  const snapshot = {
    ...filters,
    pageSize: 100 as const,
    before: undefined as string | undefined,
  };
  const responses: FormSubmission[] = [];
  let total = 0;
  for (let page = 0; ; page++) {
    signal.throwIfAborted();
    const result = await readPage(page, snapshot);
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
  const period =
    filters.from && filters.to
      ? `${filters.from}-to-${filters.to}`
      : new Date().toISOString().slice(0, 10);
  const filename = `${definition.slug || "form"}-responses-${period}.csv`;
  const table = formResponsesTable(
    definition,
    responses,
    copy,
    definition.questions,
    essential,
  );
  const blob = new Blob([tableCsv(table)], { type: "text/csv;charset=utf-8" });
  signal.throwIfAborted();
  downloadBlob(blob, filename);
}
