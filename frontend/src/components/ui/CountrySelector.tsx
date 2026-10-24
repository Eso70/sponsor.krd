"use client";

import { useMemo } from "react";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { COUNTRY_DIAL_CODES } from "@/lib/constants/country-codes";

interface CountrySelectorProps {
  compact?: boolean;
  language?: string;
  ariaLabel?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  copy?: Partial<
    Record<"title" | "count" | "close" | "search" | "empty" | "loading", string>
  >;
}

const ALL_COUNTRIES = [...COUNTRY_DIAL_CODES].sort((a, b) =>
  a.name.localeCompare(b.name),
);

export function CountrySelector({
  value,
  onChange,
  className = "",
  copy,
  compact = false,
  language = "en",
  ariaLabel,
}: CountrySelectorProps) {
  const selectedCode = ALL_COUNTRIES.find((country) => country.code === value)?.code ?? "964";
  const regionNames = useMemo(
    () => new Intl.DisplayNames([language], { type: "region" }),
    [language],
  );
  const options = useMemo(
    () => ALL_COUNTRIES.map((country) => {
      const name = country.regions
        .map((region) => regionNames.of(region) || region)
        .join(" / ");
      return {
        value: country.code,
        label: `${name} (+${country.code})`,
        searchTerms: [name, country.name, ...country.regions, country.code, `+${country.code}`],
      };
    }),
    [regionNames],
  );
  const searchCopy = language === "ar"
    ? { search: "البحث عن البلدان", empty: "لم يُعثر على بلد" }
    : language === "ckb"
      ? { search: "گەڕان لە وڵاتەکان", empty: "هیچ وڵاتێک نەدۆزرایەوە" }
      : { search: "Search countries", empty: "No country found" };

  return (
    <div className="shrink-0">
      <CustomSelect
        label={ariaLabel || copy?.title || "Country code"}
        ariaLabel={ariaLabel || `${copy?.title || "Country code"} +${selectedCode}`}
        hideLabel
        fullWidth={false}
        value={selectedCode}
        triggerLabel={`+${selectedCode}`}
        onChange={onChange}
        searchable
        searchPlaceholder={copy?.search || searchCopy.search}
        emptyLabel={copy?.empty || searchCopy.empty}
        inheritAppearance
        minMenuWidth={340}
        maxMenuHeight={360}
        triggerClassName={`${compact
          ? "!h-9 !w-auto !justify-start !gap-1 !rounded-lg !px-2 !text-xs [&_svg]:!size-3"
          : "min-w-25 !text-sm"} ${className}`}
        options={options}
      />
    </div>
  );
}
