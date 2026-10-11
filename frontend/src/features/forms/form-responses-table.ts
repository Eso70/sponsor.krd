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
    ];
  });
  return { headers, rows, answerColumnStart };
}
