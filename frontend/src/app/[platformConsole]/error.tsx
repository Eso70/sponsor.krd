"use client";

import { useSyncExternalStore } from "react";
import { RuntimeErrorPage } from "@/components/error-pages/RuntimeErrorPage";
import { platformErrorCopy } from "@/features/platform-admin/i18n/error-copy";
import { PLATFORM_LOCALE_COOKIE, parsePlatformLocale, type PlatformLocale } from "@/features/platform-admin/i18n/locale";

function subscribe() {
  return () => {};
}

function savedLocale(): PlatformLocale {
  const saved = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${PLATFORM_LOCALE_COOKIE}=`))
    ?.split("=")[1];
  return parsePlatformLocale(saved);
}

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const locale = useSyncExternalStore(subscribe, savedLocale, () => "ckb" as const);
  return <RuntimeErrorPage context="platform" error={error} reset={reset} pageCopy={platformErrorCopy("unexpected", locale)} />;
}
