/** Responsive presentation of the exact cells decoded from the outgoing message. */
export function FormWhatsAppProductTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="my-3 overflow-hidden rounded-lg border border-slate-200 dark:border-white/10">
      <table
        dir="ltr"
        className="w-full table-fixed border-collapse whitespace-normal text-sm"
      >
        <colgroup>
          {headers.map((_, index) => (
            <col
              key={index}
              style={{
                width: index === 0 ? "40%" : `${60 / (headers.length - 1)}%`,
              }}
            />
          ))}
        </colgroup>
        <thead className="bg-slate-100 dark:bg-white/5">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                dir="auto"
                className="break-words px-2 py-2 text-start font-semibold [overflow-wrap:anywhere] sm:px-3"
              >
                <bdi>{header}</bdi>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={index}
              className="border-t border-slate-200 dark:border-white/10"
            >
              {row.map((cell, column) => (
                <td
                  key={column}
                  dir="auto"
                  className="break-words px-2 py-2 text-start align-top [overflow-wrap:anywhere] sm:px-3"
                >
                  <bdi>{cell}</bdi>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
