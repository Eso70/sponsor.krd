import { ManagementTable } from "@/components/shared/ManagementTable";
import { Inbox } from "lucide-react";
import type { FormAnalytics } from "../types";
import type { FormsCopy } from "../forms-copy";
type Rows = NonNullable<
  NonNullable<FormAnalytics["insights"]>["sourcePerformance"]
>;

export function FormSourcePerformance({
  rows,
  copy,
}: {
  rows: Rows;
  copy: FormsCopy;
}) {
  return (
    <section aria-label={copy.sourcePerformance} className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{copy.sourcePerformance}</h3>
        <p className="mt-1 text-xs text-slate-500">
          {copy.sourcePerformanceHint}
        </p>
      </div>
      <ManagementTable
        compact
        minWidth="min-w-[420px]"
        data={rows}
        empty={{ icon: Inbox, title: copy.noInsights }}
        getRowKey={(row) => row.label ?? ""}
        columns={[
          { key: "source", header: copy.source },
          { key: "starts", header: copy.starts },
          { key: "responses", header: copy.trackedResponses },
          { key: "rate", header: copy.rate },
        ]}
        renderRow={(row) => (
          <tr className="border-b border-slate-100 dark:border-white/5">
            <td className="px-3 py-2 text-xs wrap-anywhere">
              {row.label || copy.unknownSource}
            </td>
            <td className="px-3 py-2 text-xs">{row.starts}</td>
            <td className="px-3 py-2 text-xs">{row.responses}</td>
            <td className="px-3 py-2 text-xs font-semibold">
              {row.rate == null ? "—" : `${row.rate.toFixed(1)}%`}
            </td>
          </tr>
        )}
        renderCard={(row) => (
          <div className="rounded-xl border border-slate-200/70 p-3 dark:border-white/10">
            <p className="text-xs font-semibold wrap-anywhere">
              {row.label || copy.unknownSource}
            </p>
            <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <dt className="text-slate-500">{copy.starts}</dt>
                <dd>{row.starts}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{copy.trackedResponses}</dt>
                <dd>{row.responses}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{copy.rate}</dt>
                <dd>{row.rate == null ? "—" : `${row.rate.toFixed(1)}%`}</dd>
              </div>
            </dl>
          </div>
        )}
      />
    </section>
  );
}
