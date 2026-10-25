"use client";
import { useEffect, useId, useRef, useState } from "react";
import {
  inspectPhoneNumber,
  phoneNumberHasAllowedStart,
} from "@linktree/types/phone-number.cjs";
import { phoneInputCopy } from "./phone-input-copy";
import { COUNTRY_DIAL_CODES } from "@/lib/constants/country-codes";
import {
  digitsOnlyInput,
  normalizeNumericInput,
} from "@/lib/utils/numeric-input";
import { CountrySelector } from "@/components/ui/CountrySelector";
import { ModalTextInput } from "./ModalTextInput";
const CALLING_CODES = [
  ...new Set(COUNTRY_DIAL_CODES.map((country) => country.code)),
].sort((a, b) => b.length - a.length);

export function PhoneNumberInput({
  label,
  countryLabel,
  value,
  onChange,
  countryCode = "964",
  onCountryCodeChange,
  placeholder,
  required = false,
  descriptionId,
  language = "en",
  inputClassName,
  selectorClassName,
}: {
  inputClassName?: string;
  selectorClassName?: string;
  label: string;
  countryLabel: string;
  value: string;
  onChange: (value: string) => void;
  countryCode?: string;
  onCountryCodeChange: (code: string) => void;
  language?: string;
  placeholder?: string;
  required?: boolean;
  descriptionId?: string;
}) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const [touched, setTouched] = useState(false);
  const errorId = useId();
  const text = phoneInputCopy(language);
  const inspection = inspectPhoneNumber(value, countryCode);
  const error =
    touched && value && !inspection.valid
      ? inspection.reason === "too_short"
        ? text.too_short
        : inspection.reason === "too_long"
          ? text.too_long
          : text.invalid
      : undefined;
  const validationMessage = value && !inspection.valid ? text.invalid : "";
  useEffect(() => {
    fieldRef.current
      ?.querySelector("input")
      ?.setCustomValidity(validationMessage);
  }, [validationMessage]);
  return (
    <div ref={fieldRef} className="min-w-0">
      <div
        data-phone-input
        dir="ltr"
        className="flex min-w-0 items-stretch gap-2"
      >
        <CountrySelector
          language={language}
          compact
          value={countryCode}
          onChange={(code) => {
            onCountryCodeChange(code);
            setTouched(false);
          }}
          ariaLabel={`${countryLabel}: ${label}`}
          className={
            selectorClassName ?? "!h-9 !rounded-lg !px-2 !py-0 !text-xs"
          }
        />
        <ModalTextInput
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="tel-national"
          dir="ltr"
          aria-label={label}
          aria-describedby={
            [descriptionId, error ? errorId : undefined]
              .filter(Boolean)
              .join(" ") || undefined
          }
          aria-invalid={!!error}
          aria-errormessage={error ? errorId : undefined}
          onBlur={() => setTouched(true)}
          className={`min-w-0 flex-1 ${inputClassName ?? "!h-9 !rounded-lg !px-3 !py-2 !text-base sm:!text-xs"}`}
          maxLength={1000}
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={(event) => {
            const raw = normalizeNumericInput(event.target.value).trim();
            let digits = digitsOnlyInput(raw);
            let nextCode = countryCode;
            if (raw.startsWith("+") || raw.startsWith("00")) {
              if (raw.startsWith("00")) digits = digits.slice(2);
              const selected = digits.startsWith(countryCode)
                ? countryCode
                : CALLING_CODES.find((code) => digits.startsWith(code));
              if (!selected) return;
              if (digits.length > selected.length) {
                nextCode = selected;
                digits = digits.slice(selected.length);
              }
            }
            if (!phoneNumberHasAllowedStart(digits, nextCode)) return;
            if (inspectPhoneNumber(digits, nextCode).reason === "too_long")
              return;
            if (nextCode !== countryCode) onCountryCodeChange(nextCode);
            onChange(digits);
          }}
        />
      </div>
      {error && (
        <p
          id={errorId}
          role="alert"
          dir="auto"
          className="mt-1.5 text-[11px] leading-5 text-red-500"
        >
          {error}
        </p>
      )}
    </div>
  );
}
