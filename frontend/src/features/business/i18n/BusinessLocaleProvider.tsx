"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api/request";
import { businessMessages, type BusinessLocale } from "./messages";
import { rememberBusinessLocale } from "./locale-cookie";

interface BusinessLocaleContextValue {
  locale: BusinessLocale;
  saving: boolean;
  canChangeLocale: boolean;
  changeLocale: (locale: BusinessLocale) => Promise<void>;
}

const BusinessLocaleContext = createContext<BusinessLocaleContextValue | null>(null);

export function useBusinessLocale(): BusinessLocaleContextValue {
  const context = useContext(BusinessLocaleContext);
  if (!context) throw new Error("Business locale provider is missing");
  return context;
}

export function BusinessLocaleProvider({
  initialLocale,
  canChangeLocale = true,
  children,
}: {
  initialLocale: BusinessLocale;
  canChangeLocale?: boolean;
  children: ReactNode;
}) {
  const [locale, setLocale] = useState(initialLocale);
  const [saving, setSaving] = useState(false);
  useEffect(() => rememberBusinessLocale(initialLocale), [initialLocale]);
  const changeLocale = useCallback(async (nextLocale: BusinessLocale) => {
    if (!canChangeLocale || nextLocale === locale || saving) return;
    const previousLocale = locale;
    setLocale(nextLocale);
    setSaving(true);
    try {
      await apiRequest<{ locale: BusinessLocale }>("/api/auth/preferred-locale", {
        method: "PATCH",
        json: { locale: nextLocale },
      });
      rememberBusinessLocale(nextLocale);
    } catch {
      setLocale(previousLocale);
      toast.error(businessMessages[previousLocale].Language.saveFailed);
    } finally {
      setSaving(false);
    }
  }, [canChangeLocale, locale, saving]);

  return (
    <BusinessLocaleContext.Provider value={{ locale, saving, canChangeLocale, changeLocale }}>
      <NextIntlClientProvider locale={locale} messages={businessMessages[locale]} timeZone="Asia/Baghdad">
        <div lang={locale} dir="ltr">{children}</div>
      </NextIntlClientProvider>
    </BusinessLocaleContext.Provider>
  );
}
