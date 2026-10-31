"use client";
import { useRef, useState } from "react";
import { normalizePhoneNumber } from "@linktree/types/phone-number.cjs";
import { PhoneNumberInput } from "@/components/shared/PhoneNumberInput";
import { EditorField } from "@/components/shared/EditorField";
import { EDITOR_FIELD_CLASS } from "@/components/shared/editor-control-styles";
import { COUNTRY_DIAL_CODES } from "@/lib/constants/country-codes";
import type { BusinessLocale } from "@/features/business/i18n/messages";
import { sponsorEditorCopy } from "../sponsor-editor";
function initialPhone(url: string) {
  const digits = url.replace(/^tel:\+?|^https:\/\/wa\.me\//, "").split("?")[0].replace(/\D/g, "");
  const code = [...new Set(COUNTRY_DIAL_CODES.map((country) => country.code))].sort((a, b) => b.length - a.length).find((value) => digits.startsWith(value)) ?? "964";
  return { code, number: digits.startsWith(code) ? digits.slice(code.length) : digits };
}

/** Reuses the same country selection and phone validation as other dashboard fields. */
export function SponsorPhoneDestination({ initialUrl, mode, onChange, locale, error }: {
  initialUrl: string; mode: "phone" | "whatsapp"; onChange: (url: string) => void; locale: BusinessLocale; error: boolean;
}) {
  const initial = initialPhone(initialUrl);
  const [country, setCountry] = useState(initial.code);
  const countryRef = useRef(initial.code);
  const [number, setNumber] = useState(initial.number);
  const copy = sponsorEditorCopy[locale];
  const update = (value: string, code: string) => {
    const normalized = normalizePhoneNumber(value, code);
    onChange(normalized ? mode === "phone" ? `tel:${normalized}` : `https://wa.me/${normalized.replace(/^\+/, "")}` : mode === "phone" ? "tel:" : "https://wa.me/");
  };
  return <EditorField label={mode === "whatsapp" ? copy.whatsapp : copy.phone} interactive className={EDITOR_FIELD_CLASS} error={error ? copy.urlError : undefined}>
    <PhoneNumberInput label={copy.number} countryLabel={copy.country} language={locale} value={number} countryCode={country}
      onChange={(value) => { setNumber(value); update(value, countryRef.current); }}
      onCountryCodeChange={(code) => { countryRef.current = code; setCountry(code); update(number, code); }} />
  </EditorField>;
}
