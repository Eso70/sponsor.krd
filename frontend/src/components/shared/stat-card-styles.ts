export type StatCardColor =
  | "blue"
  | "green"
  | "purple"
  | "orange"
  | "slate"
  | "pink"
  | "cyan"
  | "amber"
  | "theme";

export const statCardColorClasses: Record<StatCardColor, string> = {
  blue: "bg-linear-to-br from-sky-50/70 to-blue-50/70 border-sky-100 text-sky-700 dark:from-sky-950/20 dark:to-blue-950/20 dark:border-sky-900/30 dark:text-sky-400",
  green:
    "bg-linear-to-br from-emerald-50/70 to-green-50/70 border-emerald-100 text-emerald-700 dark:from-emerald-950/20 dark:to-green-950/20 dark:border-emerald-900/30 dark:text-emerald-400",
  purple:
    "bg-linear-to-br from-violet-50/70 to-purple-50/70 border-violet-100 text-violet-700 dark:from-violet-950/20 dark:to-purple-950/20 dark:border-purple-900/30 dark:text-purple-400",
  orange:
    "bg-linear-to-br from-orange-50/70 to-amber-50/70 border-orange-100 text-orange-700 dark:from-orange-950/20 dark:to-amber-950/20 dark:border-orange-900/30 dark:text-orange-400",
  slate:
    "bg-linear-to-br from-slate-50/70 to-gray-50/70 border-slate-100 text-slate-700 dark:from-slate-800/20 dark:to-slate-900/20 dark:border-slate-800/30 dark:text-slate-400",
  pink: "bg-linear-to-br from-pink-50/70 to-rose-50/70 border-pink-100 text-pink-700 dark:from-pink-950/20 dark:to-rose-950/20 dark:border-pink-900/30 dark:text-pink-400",
  cyan: "bg-linear-to-br from-cyan-50/70 to-teal-50/70 border-cyan-100 text-cyan-700 dark:from-cyan-950/20 dark:to-teal-950/20 dark:border-cyan-900/30 dark:text-cyan-400",
  amber:
    "bg-linear-to-br from-amber-50/70 to-yellow-50/70 border-amber-100 text-amber-700 dark:from-amber-950/20 dark:to-yellow-950/20 dark:border-amber-900/30 dark:text-amber-400",
  theme:
    "bg-[color-mix(in_srgb,var(--theme-primary)_7%,white)] border-[color-mix(in_srgb,var(--theme-primary)_18%,white)] text-[var(--theme-primary)] dark:bg-[color-mix(in_srgb,var(--theme-primary)_10%,transparent)] dark:border-[color-mix(in_srgb,var(--theme-primary)_24%,transparent)] dark:text-[var(--theme-primary)]",
};

export const statCardIconBgClasses: Record<StatCardColor, string> = {
  blue: "bg-linear-to-br from-sky-100 to-blue-100 border-sky-200 dark:from-sky-900/30 dark:to-blue-900/30 dark:border-sky-800/30",
  green:
    "bg-linear-to-br from-emerald-100 to-green-100 border-emerald-200 dark:from-emerald-900/30 dark:to-green-900/30 dark:border-emerald-800/30",
  purple:
    "bg-linear-to-br from-violet-100 to-purple-100 border-violet-200 dark:from-violet-900/30 dark:to-purple-900/30 dark:border-purple-800/30",
  orange:
    "bg-linear-to-br from-orange-100 to-amber-100 border-orange-200 dark:from-orange-900/30 dark:to-amber-900/30 dark:border-orange-800/30",
  slate:
    "bg-linear-to-br from-slate-100 to-gray-100 border-slate-200 dark:from-slate-800/30 dark:to-slate-900/30 dark:border-slate-700/30",
  pink: "bg-linear-to-br from-pink-100 to-rose-100 border-pink-200 dark:from-pink-900/30 dark:to-rose-900/30 dark:border-pink-800/30",
  cyan: "bg-linear-to-br from-cyan-100 to-teal-100 border-cyan-200 dark:from-cyan-900/30 dark:to-teal-900/30 dark:border-cyan-800/30",
  amber:
    "bg-linear-to-br from-amber-100 to-yellow-100 border-amber-200 dark:from-amber-900/30 dark:to-yellow-900/30 dark:border-amber-800/30",
  theme:
    "bg-[color-mix(in_srgb,var(--theme-primary)_14%,white)] border-[color-mix(in_srgb,var(--theme-primary)_22%,white)] dark:bg-[color-mix(in_srgb,var(--theme-primary)_16%,transparent)] dark:border-[color-mix(in_srgb,var(--theme-primary)_28%,transparent)]",
};

export const statCardIconColorClasses: Record<StatCardColor, string> = {
  blue: "text-sky-500 dark:text-sky-400",
  green: "text-emerald-500 dark:text-emerald-400",
  purple: "text-violet-500 dark:text-purple-400",
  orange: "text-orange-500 dark:text-orange-400",
  slate: "text-slate-500 dark:text-slate-400",
  pink: "text-pink-500 dark:text-pink-400",
  cyan: "text-cyan-500 dark:text-cyan-400",
  amber: "text-amber-500 dark:text-amber-400",
  theme: "text-[var(--theme-primary)] dark:text-[color-mix(in_srgb,var(--theme-primary)_40%,white)]",
};
