import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import {
  HEADER_ACTION_SIZE_CLASS,
  HEADER_ACTION_BUTTON_CLASS,
} from "./shared-control-styles";
import { ThemeToggleButton } from "./ThemeToggleButton";
import { AuthenticationLanguageToggle } from "./AuthenticationLanguageToggle";
import {
  authenticationHeaderCopy,
  type AuthenticationLocalePreference,
} from "./authentication-header-copy";

export function AuthenticationHeader({
  backHref,
  backLabel,
  themeCopy,
  language,
  headerAction,
  localePreference,
}: {
  backHref: string;
  backLabel?: string;
  themeCopy?: { label: string; light: string; dark: string };
  language?: string;
  headerAction?: ReactNode;
  localePreference: AuthenticationLocalePreference;
}) {
  const locale = language === "en" || language === "ar" ? language : "ckb";
  const copy = authenticationHeaderCopy[locale];
  return (
    <header
      className="absolute inset-x-0 top-0 z-20 flex min-w-0 items-center justify-between gap-3 px-5 py-5 sm:px-8 sm:py-8"
      dir="ltr"
    >
      <a
        href={backHref}
        className={`${HEADER_ACTION_BUTTON_CLASS} ${HEADER_ACTION_SIZE_CLASS}`}
        aria-label={backLabel ?? copy.back}
      >
        <ArrowLeft aria-hidden className="size-4" />
      </a>
      <div className="flex shrink-0 items-center gap-2">
        {headerAction ?? (
          <AuthenticationLanguageToggle
            locale={locale}
            preference={localePreference}
          />
        )}
        <ThemeToggleButton copy={themeCopy ?? copy.theme} />
      </div>
    </header>
  );
}
