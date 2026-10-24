"use client";

import { Tooltip } from "./Tooltip";

/** One bounded caption row: the metric label followed by optional context. */
export function StatCardCaption({
  label,
  detail,
  className = "",
}: {
  label: string;
  detail?: string;
  className?: string;
}) {
  const context = detail?.trim();
  return (
    <Tooltip content={context ? `${label} · ${context}` : label}>
      <div
        tabIndex={context ? 0 : undefined}
        className={`flex min-w-0 max-w-full items-baseline gap-1.5 whitespace-nowrap leading-tight ${className}`}
      >
        <span className="min-w-0 truncate">{label}</span>
        {context && (
          <>
            <span
              aria-hidden="true"
              className="shrink-0 text-slate-400 dark:text-slate-500"
            >
              ·
            </span>
            <span className="min-w-0 max-w-[55%] shrink truncate text-[0.8em] font-normal text-slate-500 dark:text-slate-400">
              {context}
            </span>
          </>
        )}
      </div>
    </Tooltip>
  );
}
