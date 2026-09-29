"use client";

import { RuntimeErrorPage } from "@/components/error-pages/RuntimeErrorPage";
import { useSyncExternalStore } from "react";
import { RootPublicLocaleProvider } from "@/features/public-site/RootPublicLocaleProvider";
import { RootRuntimeErrorPage } from "@/features/public-site/RootErrorPage";
import { ROOT_PUBLIC_LOCALE_COOKIE, parseRootPublicLocale } from "@/features/public-site/root-public-locale";
import { resolveLinktreeHost } from "@/lib/public/linktree-host";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const isBusiness = useSyncExternalStore(() => () => undefined, () => {
    const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost").split(":")[0].toLowerCase();
    return !resolveLinktreeHost(window.location.hostname, rootDomain).isPlatformRoot;
  }, () => false);
  const locale = useSyncExternalStore(() => () => undefined, () => {
    const saved = document.cookie.split("; ").find((item) => item.startsWith(`${ROOT_PUBLIC_LOCALE_COOKIE}=`))?.split("=")[1];
    return parseRootPublicLocale(saved);
  }, () => "ckb" as const);
  return (
    <html lang={isBusiness ? "ckb" : locale} dir="rtl">
      <body>
        {isBusiness ? <RuntimeErrorPage context="root" error={error} reset={reset} /> : <RootPublicLocaleProvider initialLocale={locale}><RootRuntimeErrorPage error={error} reset={reset} /></RootPublicLocaleProvider>}
      </body>
    </html>
  );
}
