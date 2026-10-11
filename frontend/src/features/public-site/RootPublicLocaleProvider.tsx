"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  LanguageToggle,
  nextLanguageLocale,
} from "@/components/shared/LanguageToggle";
import {
  rememberRootPublicLocale,
  type RootPublicLocale,
} from "./root-public-locale";

type RootPublicLocaleContextValue = {
  locale: RootPublicLocale;
  changeLocale: (locale: RootPublicLocale) => void;
};

const RootPublicLocaleContext =
  createContext<RootPublicLocaleContextValue | null>(null);

export function RootPublicLocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: RootPublicLocale;
  children: ReactNode;
}) {
  const [locale, setLocale] = useState(initialLocale);
  const changeLocale = (next: RootPublicLocale) => {
    rememberRootPublicLocale(next);
    setLocale(next);
  };
  return (
    <RootPublicLocaleContext.Provider value={{ locale, changeLocale }}>
      {children}
    </RootPublicLocaleContext.Provider>
  );
}

export function useRootPublicLocale() {
  const context = useContext(RootPublicLocaleContext);
  if (!context) throw new Error("RootPublicLocaleProvider is required");
  return context;
}

export function useOptionalRootPublicLocale() {
  return useContext(RootPublicLocaleContext);
}

export function RootPublicLanguageToggle({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { locale, changeLocale } = useRootPublicLocale();
  const nextLocale = nextLanguageLocale(locale);
  const label =
    locale === "ckb"
      ? "گۆڕینی زمان بۆ عەرەبی"
      : locale === "ar"
        ? "التبديل إلى الإنجليزية"
        : "Switch to Kurdish";
  return (
    <LanguageToggle
      size={compact ? "compact" : "standard"}
      locale={locale}
      label={label}
      onClick={() => changeLocale(nextLocale)}
    />
  );
}

export function RootPublicLinktreeLanguageToggle({
  locale,
  onChange,
}: {
  locale: RootPublicLocale;
  onChange: (locale: RootPublicLocale) => void;
}) {
  const nextLocale = nextLanguageLocale(locale);
  const label =
    locale === "ckb"
      ? "گۆڕینی زمان بۆ عەرەبی"
      : locale === "ar"
        ? "التبديل إلى الإنجليزية"
        : "Switch to Kurdish";
  return (
    <LanguageToggle
      locale={locale}
      label={label}
      onClick={() => {
        rememberRootPublicLocale(nextLocale);
        onChange(nextLocale);
      }}
    />
  );
}
