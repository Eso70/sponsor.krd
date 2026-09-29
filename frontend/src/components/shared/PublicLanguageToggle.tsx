"use client";

export function PublicLanguageToggle({ nextLocale, label, onClick }: {
  nextLocale: "ckb" | "ar" | "en";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-xs font-bold text-slate-600 transition-colors hover:bg-black/6 hover:text-slate-950 dark:text-white/75 dark:hover:bg-white/8 dark:hover:text-white"
      aria-label={label}
      onClick={onClick}
    >
      {nextLocale === "ckb" ? "KU" : nextLocale.toUpperCase()}
    </button>
  );
}
