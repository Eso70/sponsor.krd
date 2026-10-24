import { X } from "lucide-react";
import { Tooltip } from "@/components/shared/Tooltip";
import type { FormsCopy } from "../forms-copy";

export function FormExportProgress({
  copy,
  count,
  total,
  onCancel,
}: {
  copy: FormsCopy;
  count: number;
  total: number;
  onCancel: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-between rounded-xl bg-sky-50 px-4 py-3 text-xs text-sky-700 dark:bg-sky-500/10 dark:text-sky-200"
    >
      <span>
        {copy.exporting} · {count.toLocaleString()} / {total.toLocaleString()}
      </span>
      <Tooltip content={copy.cancelExport}>
        <button
          type="button"
          aria-label={copy.cancelExport}
          onClick={onCancel}
          className="rounded-lg p-1"
        >
          <X className="size-4" />
        </button>
      </Tooltip>
    </div>
  );
}
