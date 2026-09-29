"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api/request";
import { PLATFORM_LOCALE_COOKIE, type PlatformLocale } from "./locale";

type PlatformLocaleContextValue = {
  locale: PlatformLocale;
  saving: boolean;
  changeLocale: (locale: PlatformLocale) => Promise<void>;
  syncLocale: (locale: PlatformLocale) => void;
};

const PlatformLocaleContext = createContext<PlatformLocaleContextValue | null>(
  null,
);

function rememberLocale(locale: PlatformLocale) {
  document.cookie = `${PLATFORM_LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function PlatformLocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: PlatformLocale;
  children: ReactNode;
}) {
  const [locale, setLocale] = useState(initialLocale);
  const [saving, setSaving] = useState(false);

  const syncLocale = useCallback((next: PlatformLocale) => {
    setLocale(next);
    rememberLocale(next);
  }, []);

  const changeLocale = useCallback(
    async (next: PlatformLocale) => {
      if (saving || next === locale) return;
      setSaving(true);
      syncLocale(next);
      try {
        await apiRequest("/api/platform/auth/preferred-locale", {
          method: "PATCH",
          json: { locale: next },
        });
      } catch {
        syncLocale(locale);
        toast.error(
          locale === "ar"
            ? "تعذّر تغيير اللغة. حاول مرة أخرى"
            : locale === "en" ? "Could not change language. Please try again" : "گۆڕینی زمان سەرکەوتوو نەبوو. دووبارە هەوڵ بدەوە",
        );
      } finally {
        setSaving(false);
      }
    },
    [locale, saving, syncLocale],
  );

  return (
    <PlatformLocaleContext.Provider
      value={{ locale, saving, changeLocale, syncLocale }}
    >
      {children}
    </PlatformLocaleContext.Provider>
  );
}

export function usePlatformLocale() {
  const context = useContext(PlatformLocaleContext);
  if (!context) throw new Error("PlatformLocaleProvider is required");
  return context;
}
