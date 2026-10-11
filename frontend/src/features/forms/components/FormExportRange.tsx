"use client";

import { useState } from "react";
import { DateTimeInput } from "@/components/shared/DateTimeInput";
import { ModalStepActions } from "@/components/shared/ModalStepActions";
import type { FormsCopy } from "../forms-copy";
import type { FormLanguage } from "../types";

/** Export-only range: never changes analytics or response-table filters. */
export function FormExportRange({
  copy,
  locale,
  disabled,
  onClose,
  onExport,
}: {
  copy: FormsCopy;
  locale: FormLanguage;
  disabled: boolean;
  onClose: () => void;
  onExport: (range: { from: string; to: string }) => void;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [attempted, setAttempted] = useState(false);
  const valid = !!from && !!to && from <= to;
  return (
    <section
      aria-label={copy.exportRange}
      className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.025]"
    >
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
          {copy.exportRange}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {copy.exportRangeHint}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <DateTimeInput
          dateOnly
          required
          locale={locale}
          label={copy.exportFrom}
          value={from}
          onChange={setFrom}
          max={to || undefined}
          disabled={disabled}
        />
        <DateTimeInput
          dateOnly
          required
          locale={locale}
          label={copy.exportTo}
          value={to}
          onChange={setTo}
          min={from || undefined}
          disabled={disabled}
        />
      </div>
      {attempted && !valid && (
        <p role="alert" className="text-xs text-rose-600 dark:text-rose-300">
          {copy.exportRangeError}
        </p>
      )}
      <ModalStepActions
        primaryLabel={copy.exportCsv}
        primaryDisabled={disabled}
        onPrimary={() => {
          setAttempted(true);
          if (valid && !disabled) onExport({ from, to });
        }}
        backLabel={copy.cancel}
        onBack={disabled ? undefined : onClose}
      />
    </section>
  );
}
