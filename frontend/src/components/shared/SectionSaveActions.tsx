import type { ReactNode } from "react";

/** Shared bottom-right save row for settings sections on either dashboard. */
export function SectionSaveActions({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-5 dark:border-white/5">
      {children}
    </div>
  );
}
