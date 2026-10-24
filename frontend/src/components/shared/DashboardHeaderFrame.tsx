import type { ReactNode } from "react";
import chrome from "./dashboard-chrome.module.css";

/** Shared dashboard chrome, including the public owner-branded report header. */
export function DashboardHeaderFrame({
  children,
  contained = false,
  surface = "dashboard",
}: {
  children: ReactNode;
  contained?: boolean;
  surface?: "dashboard" | "page";
}) {
  return (
    <header
      className={`${chrome.headerRow} sticky top-0 z-30 shrink-0 border-b border-slate-200 dark:border-white/10 ${surface === "page" ? "bg-slate-50 dark:bg-[#151a21]" : "bg-white dark:bg-[#161B22]"}`}
    >
      <div
        className={`flex h-full min-w-0 items-center justify-between gap-3 px-4 sm:px-6 ${contained ? "mx-auto w-full max-w-7xl" : ""}`}
      >
        {children}
      </div>
    </header>
  );
}
