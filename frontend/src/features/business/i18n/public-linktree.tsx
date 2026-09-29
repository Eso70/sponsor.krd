"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { BusinessLocale } from "./messages";
import { publicLinktreeCopy } from "./public-linktree-copy";

const PublicLinktreeLocaleContext = createContext<BusinessLocale>("ckb");

export function PublicLinktreeLocaleProvider({ locale, children }: { locale: BusinessLocale; children: ReactNode }) {
  return <PublicLinktreeLocaleContext.Provider value={locale}>{children}</PublicLinktreeLocaleContext.Provider>;
}

export function usePublicLinktreeCopy() {
  return publicLinktreeCopy[useContext(PublicLinktreeLocaleContext)];
}
