"use client";

import { RuntimeErrorPage } from "@/components/error-pages/RuntimeErrorPage";
import { businessErrorPageCopy } from "@/features/business/i18n/error-copy";
import { usePreAuthBusinessLocale } from "@/features/business/i18n/usePreAuthBusinessLocale";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const { locale } = usePreAuthBusinessLocale();
  return <RuntimeErrorPage context="business" error={error} reset={reset} pageCopy={businessErrorPageCopy(locale, "unexpected")} />;
}
