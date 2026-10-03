"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { PublicLanguageToggle } from "@/components/shared/PublicLanguageToggle";
import { rememberRootPublicLocale, type RootPublicLocale } from "./root-public-locale";

type RootPublicLocaleContextValue = {
  locale: RootPublicLocale;
  changeLocale: (locale: RootPublicLocale) => void;
};

const RootPublicLocaleContext = createContext<RootPublicLocaleContextValue | null>(null);

export function RootPublicLocaleProvider({ initialLocale, children }: {
  initialLocale: RootPublicLocale;
  children: ReactNode;
}) {
  const [locale, setLocale] = useState(initialLocale);
  const changeLocale = (next: RootPublicLocale) => {
    rememberRootPublicLocale(next);
    setLocale(next);
  };
  return <RootPublicLocaleContext.Provider value={{ locale, changeLocale }}>{children}</RootPublicLocaleContext.Provider>;
}

export function useRootPublicLocale() {
  const context = useContext(RootPublicLocaleContext);
  if (!context) throw new Error("RootPublicLocaleProvider is required");
  return context;
}

export function useOptionalRootPublicLocale() {
  return useContext(RootPublicLocaleContext);
}

export function RootPublicLanguageToggle() {
  const { locale, changeLocale } = useRootPublicLocale();
  const nextLocale = locale === "ckb" ? "ar" : locale === "ar" ? "en" : "ckb";
  const label = locale === "ckb" ? "گۆڕینی زمان بۆ عەرەبی" : locale === "ar" ? "التبديل إلى الإنجليزية" : "Switch to Kurdish";
  return <PublicLanguageToggle locale={locale} label={label} onClick={() => changeLocale(nextLocale)} />;
}

export function RootPublicLinktreeLanguageToggle({ locale, onChange }: {
  locale: RootPublicLocale;
  onChange: (locale: RootPublicLocale) => void;
}) {
  const nextLocale = locale === "ckb" ? "ar" : locale === "ar" ? "en" : "ckb";
  const label = locale === "ckb" ? "گۆڕینی زمان بۆ عەرەبی" : locale === "ar" ? "التبديل إلى الإنجليزية" : "Switch to Kurdish";
  return <PublicLanguageToggle locale={locale} label={label} onClick={() => {
    rememberRootPublicLocale(nextLocale);
    onChange(nextLocale);
  }} />;
}
