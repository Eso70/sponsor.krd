"use client";

import { useEffect, useState } from "react";
import type { BusinessLocale } from "./messages";
import { readBusinessLocaleCookie, rememberBusinessLocale } from "./locale-cookie";

export function usePreAuthBusinessLocale() {
  const [locale, setLocale] = useState<BusinessLocale>("ckb");
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setLocale(readBusinessLocaleCookie(document.cookie)));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function changeLocale(next: BusinessLocale) {
    setLocale(next);
    rememberBusinessLocale(next);
  }

  return { locale, changeLocale };
}
