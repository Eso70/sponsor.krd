"use client";

import type { ButtonHTMLAttributes } from "react";

export const dashboardHeaderActionClassName =
  "group relative flex items-center justify-center rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-gray-50 p-2 text-slate-500 shadow-sm transition-all duration-300 hover:from-slate-100 hover:to-gray-100 hover:text-slate-700 hover:shadow disabled:cursor-wait disabled:opacity-60 dark:border-white/10 dark:from-white/5 dark:to-white/5 dark:text-gray-300 dark:hover:from-white/10 dark:hover:to-white/10 sm:p-2.5 md:p-3";

export function DashboardHeaderActionButton({
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`${dashboardHeaderActionClassName} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
