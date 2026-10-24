import type { HTMLAttributes } from "react";

/** Shared Settings-style tab surface for interactive and pending tab rows. */
export function SegmentedTabsFrame({ fullWidth, className = "", children, ...props }: HTMLAttributes<HTMLDivElement> & { fullWidth?: boolean }) {
  return <div {...props}
    className={`custom-scrollbar brand-custom-scrollbar theme-custom-scrollbar overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm dark:border-white/10 dark:bg-[#1c222b] ${fullWidth ? "w-full" : ""} ${className}`}>
    <div className={`flex gap-1 ${fullWidth ? "w-full" : "min-w-max sm:min-w-0"}`}>{children}</div>
  </div>;
}
