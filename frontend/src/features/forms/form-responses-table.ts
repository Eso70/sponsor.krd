import { formAnswerText } from "./form-response-utils";
import type { FormDraft, FormSubmission, FormSummary } from "./types";
import type { FormsCopy } from "./forms-copy";

export type FormExportCell = string | number | Date | null;

/** Authoritative CSV column order, including historical questions. */
export function formResponsesTable(
  form: FormSummary,
  responses: FormSubmission[],
  copy: FormsCopy,
  questions: FormDraft["questions"] = [],
) {
  const columns = new Map(
    questions.map((question) => [question.id, question.label]),
  );
  for (const response of responses)
    for (const answer of response.answers)
      if (!columns.has(answer.questionId))
        columns.set(answer.questionId, answer.label);
  const headers = [
    "response_id",
    "created_time_utc",
    "form_id",
    "form_name",
    "form_url",
    "source",
    "source_action",
    "campaign_name",
    "medium",
    "channel",
    "device",
    "browser",
    "operating_system",
    "country",
    "referrer",
    "campaign_content",
    "campaign_term",
    "completion_seconds",
    "privacy_consent",
    "privacy_version",
    "form_version",
  ];
  const answerColumnStart = headers.length;
  const seen = new Set(headers.map((header) => header.toLowerCase()));
  for (const [id, label] of columns) {
    let header = label.trim() || id;
    if (seen.has(header.toLowerCase())) header = `${header} (${id})`;
    while (seen.has(header.toLowerCase())) header += " (answer)";
    headers.push(header);
    seen.add(header.toLowerCase());
  }
  const products = new Map<
    string,
    { label: string; items: Map<string, string> }
  >();
  for (const question of questions)
    if (question.type === "product")
      products.set(question.id, {
        label: question.label,
        items: new Map(
          question.productSelection?.items.map((item) => [
            item.id,
            item.name,
          ]) ?? [],
        ),
      });
  for (const response of responses)
    for (const answer of response.answers)
      if (answer.products) {
        if (!products.has(answer.questionId))
          products.set(answer.questionId, {
            label: answer.label,
            items: new Map(),
          });
        const group = products.get(answer.questionId)!;
        for (const item of answer.products.items)
          if (!group.items.has(item.id)) group.items.set(item.id, item.name);
      }
  const productFields: ((response: FormSubmission) => FormExportCell)[] = [];
  const addProductColumn = (
    label: string,
    read: (response: FormSubmission) => FormExportCell,
  ) => {
    let header = label;
    let suffix = 2;
    while (seen.has(header.toLowerCase())) header = `${label} (${suffix++})`;
    seen.add(header.toLowerCase());
    headers.push(header);
    productFields.push(read);
  };
  for (const [questionId, group] of products) {
    const snapshot = (response: FormSubmission) =>
      response.answers.find((answer) => answer.questionId === questionId)
        ?.products;
    addProductColumn(
      `${group.label} / currency`,
      (response) => snapshot(response)?.currency ?? null,
    );
    addProductColumn(
      `${group.label} / total`,
      (response) => snapshot(response)?.total ?? null,
    );
    for (const [productId, name] of group.items) {
      for (const field of [
        "name",
        "unit",
        "quantity",
        "unitPrice",
        "lineTotal",
      ] as const)
        addProductColumn(
          `${group.label} / ${name || productId} / ${field}`,
          (response) =>
            snapshot(response)?.items.find((item) => item.id === productId)?.[
              field
            ] ?? null,
        );
    }
  }
  const rows: FormExportCell[][] = responses.map((response) => {
    const answers = new Map(
      response.answers.map((answer) => [
        answer.questionId,
        formAnswerText(answer.value),
      ]),
    );
    const attribution = response.attribution;
    return [
      response.id,
      new Date(response.createdAt),
      form.id,
      form.name,
      form.slug ? `/form/${form.slug}` : null,
      attribution?.source ?? null,
      "form_submit",
      attribution?.campaign ?? null,
      attribution?.medium ?? null,
      attribution?.channel ?? null,
      attribution?.device ?? null,
      attribution?.browser ?? null,
      attribution?.os ?? null,
      attribution?.country ?? null,
      attribution?.referrer ?? null,
      attribution?.content ?? null,
      attribution?.term ?? null,
      response.durationMs == null ? null : response.durationMs / 1000,
      response.consent ? copy.consentGranted : copy.consentDeclined,
      response.privacyVersion ?? null,
      response.revision,
      ...[...columns.keys()].map((id) => answers.get(id) ?? null),
      ...productFields.map((read) => read(response)),
    ];
  });
  return { headers, rows, answerColumnStart };
}
