import type { FormQuestion } from "./types";

export const CONDITIONAL_CSV_MAX_BYTES = 256 * 1024;
export type ConditionalAnswers = NonNullable<FormQuestion["conditional"]>;

export function isConditionalAnswers(data: ConditionalAnswers): boolean {
  return (
    data.columns.length >= 2 &&
    data.columns.length <= 5 &&
    new Set(data.columns).size === data.columns.length &&
    data.columns.every((value) => !!value.trim() && value.length <= 200) &&
    data.rows.length > 0 &&
    data.rows.length <= 1000 &&
    data.rows.every(
      (row) =>
        row.length === data.columns.length &&
        row.every((value) => !!value.trim() && value.length <= 200),
    )
  );
}

/** Parse text only: quoted commas, escaped quotes, UTF-8 BOM and CRLF supported. */
export function parseConditionalCsv(text: string): ConditionalAnswers {
  if (new TextEncoder().encode(text).length > CONDITIONAL_CSV_MAX_BYTES)
    throw new Error("Invalid CSV");
  const records: string[][] = [];
  let row: string[] = [],
    value = "",
    quoted = false,
    closed = false;
  const cell = () => {
    row.push(value.trim());
    value = "";
    closed = false;
    if (row.length > 5) throw new Error("Invalid CSV");
  };
  const record = () => {
    cell();
    if (row.some(Boolean)) records.push(row);
    row = [];
    if (records.length > 1001) throw new Error("Invalid CSV");
  };
  const source = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          value += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else value += char;
    } else if (char === ",") cell();
    else if (char === "\n" || char === "\r") {
      record();
      if (char === "\r" && source[i + 1] === "\n") i++;
    } else if (char === '"') {
      if (value || closed) throw new Error("Invalid CSV");
      quoted = true;
    } else {
      if (closed && char.trim()) throw new Error("Invalid CSV");
      value += char;
    }
    if (value.length > 200) throw new Error("Invalid CSV");
  }
  if (quoted) throw new Error("Invalid CSV");
  if (value || row.length || closed) record();
  const [columns = [], ...rows] = records;
  const data = {
    columns,
    rows: Array.from(
      new Map(rows.map((path) => [JSON.stringify(path), path])).values(),
    ),
  };
  if (!isConditionalAnswers(data)) throw new Error("Invalid CSV");
  return data;
}

export function conditionalOptions(
  data: ConditionalAnswers,
  column: number,
  answers: string[],
): string[] {
  if (column > 0 && answers.slice(0, column).filter(Boolean).length !== column)
    return [];
  return [
    ...new Set(
      data.rows
        .filter((row) =>
          row
            .slice(0, column)
            .every((value, index) => value === answers[index]),
        )
        .map((row) => row[column]),
    ),
  ];
}
