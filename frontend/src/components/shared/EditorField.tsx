"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { RequiredMark } from "./RequiredMark";

/**
 * Labeled field wrapper matching the public-page editors' local
 * field components. Shared so new editor
 * surfaces don't grow yet another copy of the same label/hint markup.
 */
export function EditorField({
  label,
  hint,
  required = false,
  error,
  errorId,
  className,
  children,
  interactive = false,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  errorId?: string;
  className?: string;
  children: ReactNode;
  /** Interactive field adornments must not be nested in a native label. */
  interactive?: boolean;
}) {
  const Wrapper = interactive ? "div" : "label";
  return (
    <Wrapper className={cn("block", className)}>
      <span className="mb-1.5 flex items-center justify-between gap-3 text-[11px] font-black text-slate-600 dark:text-slate-300">
        <span>
          {label}
          {required && <RequiredMark />}
        </span>
        {hint && <span className="font-normal text-slate-400">{hint}</span>}
      </span>
      {children}
      {error ? (
        <span
          className="mt-1.5 block text-xs font-medium text-red-500"
          role="alert"
          id={errorId}
        >
          {error}
        </span>
      ) : null}
    </Wrapper>
  );
}
