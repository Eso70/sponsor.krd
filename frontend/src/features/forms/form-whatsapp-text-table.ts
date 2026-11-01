/** Fixed text columns with directional isolation for mixed RTL/LTR cell values. */
export function whatsAppTextTable(
  headers: readonly string[],
  rows: readonly (readonly string[])[],
) {
  const clean = (text: string) =>
    text
      .replace(/[\u202a-\u202e\u2066-\u2069]/g, "")
      .replace(/`/g, "ˋ")
      .replace(/\|/g, "｜");
  const wrapName = (text: string): string[] => {
    const chars = Array.from(clean(text).replace(/\s+/g, " ").trim());
    const lines: string[] = [];
    while (chars.length) lines.push(chars.splice(0, 16).join(""));
    return lines.length ? lines : [""];
  };
  const cells = [
    headers.map((header) => header.split("\n").map(clean)),
    ...rows.map((row) =>
      row.map((cell, index) =>
        index === 0 ? wrapName(cell) : [clean(cell).replace(/\s+/g, " ")],
      ),
    ),
  ];
  const widths = headers.map((_, index) =>
    Math.max(
      ...cells.flatMap((row) =>
        row[index].map((line) => Array.from(line).length),
      ),
    ),
  );
  const render = (row: string[][]) =>
    Array.from(
      { length: Math.max(...row.map((cell) => cell.length)) },
      (_, line) =>
        "\u200e" +
        row
          .map((cell, index) => {
            const value = cell[line] ?? "";
            return `\u2068${value}\u2069${" ".repeat(widths[index] - Array.from(value).length)}`;
          })
          .join("|"),
    ).join("\n");
  const rule = "\u200e" + widths.map((width) => "-".repeat(width)).join("+");
  return [
    "```",
    render(cells[0]),
    rule,
    ...cells.slice(1).map(render),
    "```",
  ].join("\n");
}

/** A bounded summary must not leave the remainder of the message inside a code block. */
export function closeWhatsAppCodeBlock(text: string) {
  return (text.match(/```/g)?.length ?? 0) % 2 ? `${text}\n\`\`\`` : text;
}

/** Read only our isolated text-table format; ordinary code remains plain text. */
export function parseWhatsAppTextTable(text: string) {
  const lines = text
    .trim()
    .split("\n")
    .map((line) => line.replace(/^\u200e/, ""));
  const divider = lines.findIndex((line) => /^-+(?:\+-+)+$/.test(line));
  if (divider < 1) return null;
  const cells = (line: string) => {
    const values = line
      .split("|")
      .map((cell) => /^\u2068(.*)\u2069 *$/.exec(cell)?.[1]);
    return values.every((value): value is string => value !== undefined)
      ? values
      : null;
  };
  const count = lines[divider].split("+").length;
  const parsed = [...lines.slice(0, divider), ...lines.slice(divider + 1)].map(cells);
  const valid = parsed.filter(
    (row): row is string[] => row !== null && row.length === count,
  );
  if (valid.length !== parsed.length) return null;
  const headerLines = valid.slice(0, divider);
  const bodyLines = valid.slice(divider);
  const headers = Array.from({ length: count }, (_, index) =>
    headerLines.map((row) => row[index]).filter(Boolean).join(" "),
  );
  const rows: string[][] = [];
  for (const row of bodyLines) {
    // The serializer wraps long product names onto lines with empty numeric cells.
    if (row.slice(1).every((cell) => !cell)) {
      if (!rows.length) return null;
      rows[rows.length - 1][0] += row[0];
    } else {
      rows.push(row);
    }
  }
  return { headers, rows };
}
