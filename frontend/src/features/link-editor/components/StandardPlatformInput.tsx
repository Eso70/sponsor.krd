"use client";

import { useCallback, useState, type ChangeEvent } from "react";
import { X } from "lucide-react";
import { CountrySelector } from "@/components/ui/CountrySelector";
import { Tooltip } from "@/components/shared/Tooltip";
import { ModalTextInput } from "@/components/shared/ModalTextInput";
import { arabicCountrySelectorCopy, englishCountrySelectorCopy, getEditorPlatformPlaceholder, type EditorCopy } from "../editor-copy";

export const PHONE_PLATFORMS = ["whatsapp", "phone", "viber"] as const;

export function isPhonePlatform(platform: string): boolean {
  return PHONE_PLATFORMS.includes(
    platform as (typeof PHONE_PLATFORMS)[number],
  );
}

export function normalizeNationalPhoneInput(
  value: string,
  countryCode = "964",
): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith(countryCode) && digits.length > countryCode.length) {
    digits = digits.slice(countryCode.length);
  }
  return digits;
}

export function platformInputPlaceholder(platform: string): string {
  return getEditorPlatformPlaceholder(platform);
}

export interface StandardPlatformInputProps {
  copy?: EditorCopy;
  ariaLabel?: string;
  platform: string;
  value: string;
  onChange: (value: string) => void;
  countryCode?: string;
  onCountryCodeChange?: (countryCode: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  inputClassName?: string;
  countryClassName?: string;
  showError?: boolean;
  revealError?: boolean;
  showClear?: boolean;
  disabled?: boolean;
}

export function StandardPlatformInput({
  copy,
  ariaLabel,
  platform,
  value,
  onChange,
  countryCode = "964",
  onCountryCodeChange,
  onBlur,
  error,
  placeholder,
  inputClassName = "",
  countryClassName = "",
  showError = false,
  revealError = false,
  showClear = false,
  disabled = false,
}: StandardPlatformInputProps) {
  const [touched, setTouched] = useState(false);
  const phoneBased = isPhonePlatform(platform);
  const errorVisible = (touched || revealError) && Boolean(error);
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(
        phoneBased
          ? normalizeNationalPhoneInput(event.target.value, countryCode)
          : event.target.value,
      );
    },
    [countryCode, onChange, phoneBased],
  );
  const handleCountryChange = useCallback(
    (nextCountryCode: string) => {
      onChange(normalizeNationalPhoneInput(value, countryCode));
      onCountryCodeChange?.(nextCountryCode);
    },
    [countryCode, onChange, onCountryCodeChange, value],
  );

  return (
    <div className="w-full">
      <div className="flex w-full items-center gap-2">
        {phoneBased && (
          <CountrySelector
            language={copy?.language === "en" ? "en" : copy ? "ar" : "ckb"}
            copy={copy?.language === "en" ? englishCountrySelectorCopy : copy ? arabicCountrySelectorCopy : undefined}
            value={countryCode || "964"}
            onChange={handleCountryChange}
            className={`h-11 shrink-0 ${countryClassName}`}
          />
        )}
        <div className="relative min-w-0 flex-1">
          <ModalTextInput
            aria-label={ariaLabel}
            type={platform === "email" ? "email" : "text"}
            inputMode={phoneBased ? "tel" : undefined}
            dir="ltr"
            value={
              phoneBased
                ? normalizeNationalPhoneInput(value, countryCode)
                : value
            }
            onChange={handleChange}
            onBlur={() => {
              setTouched(true);
              onBlur?.();
            }}
            placeholder={placeholder || getEditorPlatformPlaceholder(platform, copy)}
            hasError={errorVisible}
            error={(showError || revealError) && errorVisible ? error : undefined}
            className={`h-11 min-w-0 flex-1 py-0 md:rounded-xl md:px-4 md:py-0 text-xs sm:text-sm ${inputClassName}`}
            style={showClear && value ? { paddingRight: "2.75rem" } : undefined}
            aria-invalid={errorVisible}
            disabled={disabled}
          />
          {showClear && value && !disabled && (
            <Tooltip content={copy?.clear ?? "سڕینەوە"} side="top">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setTouched(false);
                }}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-rose-500 dark:hover:bg-white/10 cursor-pointer"
                aria-label={copy?.clearValue ?? "سڕینەوەی بەها"}
                title={copy?.clear ?? "سڕینەوە"}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
          )}
        </div>
      </div>

    </div>
  );
}
