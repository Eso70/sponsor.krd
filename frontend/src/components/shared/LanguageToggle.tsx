"use client";

import { DashboardHeaderActionButton } from "./DashboardHeaderActionButton";
import { Tooltip } from "./Tooltip";

export type LanguageToggleLocale = "ckb" | "ar" | "en";
const languageCodes = { ckb: "KU", ar: "AR", en: "EN" } as const;

export function nextLanguageLocale(
  locale: LanguageToggleLocale,
): LanguageToggleLocale {
  return locale === "ckb" ? "ar" : locale === "ar" ? "en" : "ckb";
}

/** Shared active-language badge; callers own localization and preference persistence. */
export function LanguageToggle({
  locale,
  label,
  onClick,
  disabled = false,
  busy = false,
  size = "standard",
}: {
  locale: LanguageToggleLocale;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  size?: "standard" | "compact" | "dashboard";
}) {
  return (
    <Tooltip content={label} side="bottom">
      <DashboardHeaderActionButton
        data-language-toggle={locale}
        className={`${size === "dashboard" ? "" : size === "compact" ? "!size-9 !p-0" : "!size-10 !p-0"} shrink-0 cursor-pointer text-xs font-bold tracking-wide`}
        aria-label={label}
        aria-busy={busy || undefined}
        disabled={disabled || busy}
        onClick={onClick}
      >
        <span
          aria-hidden="true"
          dir="ltr"
          className={
            size === "dashboard"
              ? "flex size-4 items-center justify-center md:size-5"
              : undefined
          }
        >
          {languageCodes[locale]}
        </span>
      </DashboardHeaderActionButton>
    </Tooltip>
  );
}
