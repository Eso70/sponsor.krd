"use client";
import { Ban, Loader2, LockKeyhole, Trash2 } from "lucide-react";
import type { BlockedSubdomains } from "@linktree/types";
import {
  ManagementTable,
  MANAGEMENT_TABLE_ROW_CLASS,
  MANAGEMENT_TABLE_CARD_CLASS,
} from "@/components/shared/ManagementTable";
import { IconActionButton } from "@/components/shared/IconActionButton";
import { subdomainCopy } from "@/features/subdomains/copy";

type BlockedRow = { name: string; system: boolean };
export function BlockedSubdomainsTable({
  data,
  locale,
  isLoading,
  busy,
  removing,
  onDelete,
}: {
  data: BlockedSubdomains | null;
  locale: keyof typeof subdomainCopy;
  isLoading: boolean;
  busy: boolean;
  removing: string | null;
  onDelete: (name: string) => void;
}) {
  const copy = subdomainCopy[locale];
  const rows: BlockedRow[] = data
    ? [
        ...data.custom.map((name) => ({ name, system: false })),
        ...data.system.map((name) => ({ name, system: true })),
      ]
    : [];
  const action = (row: BlockedRow) => (
    <IconActionButton
      label={`${copy.delete}: ${row.name}`}
      tone="danger"
      disabled={busy || row.system}
      onClick={() => {
        if (!row.system) onDelete(row.name);
      }}
    >
      {removing === row.name ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </IconActionButton>
  );
  const type = (row: BlockedRow) => (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-500 dark:bg-white/5 dark:text-slate-400"
      title={row.system ? copy.permanent : undefined}
    >
      {row.system && <LockKeyhole className="h-3 w-3" />}
      {row.system ? copy.system : copy.manual}
    </span>
  );
  return (
    <ManagementTable
      compact
      minWidth="min-w-[420px]"
      data={rows}
      columns={[
        { key: "name", header: copy.label },
        { key: "type", header: copy.type },
        {
          key: "actions",
          header: copy.actions,
          width: "w-24",
          className: "text-center",
        },
      ]}
      getRowKey={(row) => row.name}
      isLoading={isLoading}
      loadingLabel={copy.loading}
      pagination={{ mode: "client" }}
      paginationCopy={{ of: copy.of, previous: copy.previous, next: copy.next }}
      empty={{ icon: Ban, title: copy.noNames }}
      renderRow={(row) => (
        <tr className={MANAGEMENT_TABLE_ROW_CLASS}>
          <td className="px-4 py-4">
            <span
              dir="ltr"
              className="break-all text-xs font-medium text-slate-700 dark:text-slate-200"
            >
              {row.name}
            </span>
          </td>
          <td className="px-4 py-4">{type(row)}</td>
          <td className="px-4 py-4 text-center">{action(row)}</td>
        </tr>
      )}
      renderCard={(row) => (
        <div
          className={`${MANAGEMENT_TABLE_CARD_CLASS} flex items-center justify-between gap-3`}
        >
          <div className="min-w-0 space-y-1">
            <p
              dir="ltr"
              className="break-all text-xs font-medium text-slate-700 dark:text-slate-200"
            >
              {row.name}
            </p>
            {type(row)}
          </div>
          {action(row)}
        </div>
      )}
    />
  );
}
