"use client";
import { CountrySelector } from "@/components/ui/CountrySelector";
import { ModalTextInput } from "./ModalTextInput";
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
}: {
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
  return (
    <div
      data-phone-input
      dir="ltr"
      className="flex min-w-0 items-stretch gap-2"
    >
      <CountrySelector
        language={language}
        compact
        value={countryCode}
        onChange={onCountryCodeChange}
        ariaLabel={`${countryLabel}: ${label}`}
        className="!h-9 !rounded-lg !px-2 !py-0 !text-xs"
      />
      <ModalTextInput
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        dir="ltr"
        aria-label={label}
        aria-describedby={descriptionId}
        className="!h-9 min-w-0 flex-1 !rounded-lg !px-3 !py-2 !text-base sm:!text-xs"
        maxLength={1000}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
