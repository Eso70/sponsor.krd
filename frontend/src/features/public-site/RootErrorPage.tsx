"use client";

import { ErrorPage } from "@/components/error-pages/ErrorPage";
import { SPONSOR_KRD_ERROR_THEME } from "@/components/error-pages/error-theme";
import { RuntimeErrorPage } from "@/components/error-pages/RuntimeErrorPage";
import { RootPublicLanguageToggle, useRootPublicLocale } from "./RootPublicLocaleProvider";
import { rootErrorPageCopy } from "./root-error-copy";

export function RootNotFoundPage() {
  const { locale } = useRootPublicLocale();
  return <ErrorPage {...rootErrorPageCopy(locale, "notFound")} theme={SPONSOR_KRD_ERROR_THEME} homeHref="/" languageControl={<RootPublicLanguageToggle compact />} />;
}

export function RootPublicLinktreeError({ kind }: { kind: "serviceUnavailable" | "badGateway" | "gatewayTimeout" | "gone" | "inactive" }) {
  const { locale } = useRootPublicLocale();
  return <ErrorPage {...rootErrorPageCopy(locale, kind)} theme={SPONSOR_KRD_ERROR_THEME} homeHref="/" showRetry={kind !== "gone" && kind !== "inactive"} languageControl={<RootPublicLanguageToggle compact />} />;
}

export function RootRuntimeErrorPage({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { locale } = useRootPublicLocale();
  return <RuntimeErrorPage context="root" error={error} reset={reset} pageCopy={{ ...rootErrorPageCopy(locale, "unexpected"), languageControl: <RootPublicLanguageToggle compact /> }} />;
}
