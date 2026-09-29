"use client";

import { ErrorPage } from "@/components/error-pages/ErrorPage";
import { platformErrorTheme } from "@/components/error-pages/error-theme";
import { platformErrorCopy } from "@/features/platform-admin/i18n/error-copy";
import type { PlatformLocale } from "@/features/platform-admin/i18n/locale";

type PlatformAdminErrorKind =
  | "notFound"
  | "badGateway"
  | "serviceUnavailable"
  | "gatewayTimeout"
  | "forbidden";

interface PlatformAdminErrorPageProps {
  kind: PlatformAdminErrorKind;
  branding?: {
    name?: string | null;
    logo?: string | null;
    accentColor?: string;
    accentBackground?: string;
    accentInk?: string;
  };
  onReset?: () => void;
  locale?: PlatformLocale;
}

export function PlatformAdminErrorPage({
  kind,
  branding,
  onReset,
  locale = "ckb",
}: PlatformAdminErrorPageProps) {
  return (
    <ErrorPage
      {...platformErrorCopy(kind, locale)}
      theme={platformErrorTheme(branding)}
      homeHref="/"
      onReset={onReset}
    />
  );
}
