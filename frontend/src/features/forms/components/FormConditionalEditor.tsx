"use client";
import { useEffect, useId, useRef, useState } from "react";
import { FormEditorAddButton } from "./FormEditorAddButton";
import { ChevronDown, FileSpreadsheet } from "lucide-react";
import { conditionalCopy } from "../conditional-copy";
import {
  CONDITIONAL_CSV_MAX_BYTES,
  parseConditionalCsv,
} from "../conditional-csv";
import type { FormLanguage, FormQuestion } from "../types";

export function FormConditionalEditor({
  question,
  language,
  requirement,
  onChange,
}: {
  question: FormQuestion;
  language: FormLanguage;
  requirement: React.ReactNode;
  onChange: (patch: Partial<FormQuestion>) => void;
}) {
  const labels = conditionalCopy(language);
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const version = useRef(0);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(
    () => () => {
      version.current++;
    },
    [],
  );
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="flex items-start gap-3">
        <FileSpreadsheet
          aria-hidden
          className="size-5 shrink-0 text-[var(--theme-primary)]"
        />
        <p className="text-[13px] leading-6 text-slate-600 dark:text-slate-300">
          {labels.guide}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <a
          href="/forms/conditional-answers-template.csv"
          download
          className="theme-soft inline-flex min-h-10 items-center rounded-lg px-3 py-2 text-[13px] font-bold hover:opacity-80"
        >
          {labels.download}
        </a>
        <FormEditorAddButton
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          {busy
            ? labels.loading
            : question.conditional
              ? labels.replace
              : labels.upload}
        </FormEditorAddButton>
        <div className="ms-auto">{requirement}</div>
      </div>
      <input
        ref={input}
        type="file"
        disabled={busy}
        accept=".csv,text/csv"
        className="sr-only"
        tabIndex={-1}
        aria-label={labels.upload}
        aria-describedby={error ? id : undefined}
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          const request = ++version.current;
          setError("");
          if (
            !/\.csv$/i.test(file.name) ||
            file.size > CONDITIONAL_CSV_MAX_BYTES
          ) {
            setError(labels.invalid);
            return;
          }
          setBusy(true);
          try {
            const text = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () =>
                typeof reader.result === "string"
                  ? resolve(reader.result)
                  : reject(new Error("Invalid CSV"));
              reader.onerror = () => reject(new Error("Invalid CSV"));
              reader.readAsText(file, "UTF-8");
            });
            const conditional = parseConditionalCsv(text);
            if (request === version.current)
              onChangeRef.current({
                conditional,
                label: conditional.columns[0],
                labelKey: undefined,
              });
          } catch {
            if (request === version.current) setError(labels.invalid);
          } finally {
            if (request === version.current) setBusy(false);
          }
        }}
      />
      {error && (
        <p
          id={id}
          role="alert"
          className="text-[13px] text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
      {question.conditional && (
        <div
          className="space-y-2 rounded-lg border border-slate-200 p-3 text-[13px] dark:border-white/10"
          role="status"
        >
          <p>
            {labels.questions}: {question.conditional.columns.length} ·{" "}
            {labels.paths}: {question.conditional.rows.length}
          </p>
          <ol className="list-inside list-decimal space-y-1">
            {question.conditional.columns.map((column) => (
              <li key={column}>{column}</li>
            ))}
          </ol>
        </div>
      )}
      <details className="group/csv border-t border-slate-200 pt-3 text-[13px] dark:border-white/10">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-semibold">
          {labels.format}
          <ChevronDown
            aria-hidden
            className="size-4 transition group-open/csv:rotate-180"
          />
        </summary>
        <p className="mt-2 leading-6 text-slate-500 dark:text-slate-400">
          {labels.help}
        </p>
      </details>
    </div>
  );
}
