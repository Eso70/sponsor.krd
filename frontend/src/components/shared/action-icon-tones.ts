/** Soft action surfaces keep semantic color on the icon in both themes. */
export const ACTION_ICON_TONES = {
  neutral: "text-slate-500 dark:text-slate-400",
  primary: "text-[var(--theme-primary)]",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-rose-600 dark:text-rose-400",
  info: "text-sky-600 dark:text-sky-400",
  success: "text-emerald-600 dark:text-emerald-400",
  archive: "text-violet-600 dark:text-violet-400",
} as const;
export type ActionIconTone = keyof typeof ACTION_ICON_TONES;
