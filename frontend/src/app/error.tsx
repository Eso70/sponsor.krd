"use client";

import { useSyncExternalStore } from "react";
import { RuntimeErrorPage } from "@/components/error-pages/RuntimeErrorPage";
import { businessErrorPageCopy } from "@/features/business/i18n/error-copy";
import { BUSINESS_PUBLIC_LOCALE_COOKIE, publicBusinessLocale } from "@/features/business/i18n/public-locale";
import { RootPublicLocaleProvider } from "@/features/public-site/RootPublicLocaleProvider";
import { RootRuntimeErrorPage } from "@/features/public-site/RootErrorPage";
import { ROOT_PUBLIC_LOCALE_COOKIE, parseRootPublicLocale } from "@/features/public-site/root-public-locale";
import type { BusinessLocale } from "@/features/business/i18n/messages";
import { resolveLinktreeHost } from "@/lib/public/linktree-host";

function isBusinessHost() {
  if (typeof window === "undefined") return false;
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost").split(":")[0].toLowerCase();
  return !resolveLinktreeHost(window.location.hostname, rootDomain).isPlatformRoot;
}

function readPublicErrorLocale(): BusinessLocale {
  if (typeof window === "undefined") return "ckb";
  const businessHost = isBusinessHost();
  const cookie = businessHost ? BUSINESS_PUBLIC_LOCALE_COOKIE : ROOT_PUBLIC_LOCALE_COOKIE;
  const saved = document.cookie.split("; ").find((item) => item.startsWith(`${cookie}=`))?.split("=")[1];
  return businessHost ? publicBusinessLocale(saved) : parseRootPublicLocale(saved);
}

function subscribeToLocale() {
  return () => undefined;
}

function readBusinessHost() {
  return isBusinessHost();
}

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const locale = useSyncExternalStore(subscribeToLocale, readPublicErrorLocale, (): BusinessLocale => "ckb");
  const businessHost = useSyncExternalStore(subscribeToLocale, readBusinessHost, () => false);
  if (!businessHost) {
    return <RootPublicLocaleProvider initialLocale={parseRootPublicLocale(locale)}><RootRuntimeErrorPage error={error} reset={reset} /></RootPublicLocaleProvider>;
  }
  return <RuntimeErrorPage context="root" error={error} reset={reset} pageCopy={businessErrorPageCopy(locale, "unexpected")} />;
}
