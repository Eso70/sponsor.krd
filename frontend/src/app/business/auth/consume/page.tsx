"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { AuthenticationCard } from "@/components/shared/AuthenticationCard";
import { AuthenticationShell } from "@/components/shared/AuthenticationShell";
import { LoadingState } from "@/components/shared/LoadingState";
import { BUSINESS_LOGO_PLACEHOLDER } from "@/lib/brand/brand-assets";
import { businessPreAuthCopy } from "@/features/business/i18n/pre-auth-copy";
import { usePreAuthBusinessLocale } from "@/features/business/i18n/usePreAuthBusinessLocale";

export default function ConsumeBusinessAuthPage() {
  const search = useSearchParams();
  const code = search.get("code");
  const started = useRef(false);
  const { locale } = usePreAuthBusinessLocale();
  const copy = businessPreAuthCopy[locale];

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!code) {
      window.location.replace("/business/workspace-entry");
      return;
    }
    window.history.replaceState({}, "", "/business/auth/consume");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8_000);
    void fetch("/api/auth/handoff", {
      method: "POST",
      credentials: "include",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then((response) => {
        if (!response.ok) {
          window.location.replace("/business/workspace-entry");
          return;
        }
        window.location.replace("/business");
      })
      .catch(() => window.location.replace("/business/workspace-entry"))
      .finally(() => window.clearTimeout(timeout));
  }, [code]);

  return (
    <AuthenticationShell
      backHref="/business/workspace-entry"
      brandDescription={copy.consumeDescription}
      brandName={copy.business}
      brandLogo={BUSINESS_LOGO_PLACEHOLDER}
      previewTitle={copy.preview}
      businessTenant
      language={locale}
      backLabel={copy.back}
      themeCopy={{ label: copy.theme, light: copy.lightTheme, dark: copy.darkTheme }}
    >
      <AuthenticationCard
        title={copy.consumeTitle}
        description={copy.consumeHint}
      >
        <LoadingState
          compact
          title={copy.consumeLoading}
          description={copy.consumeWait}
        />
      </AuthenticationCard>
    </AuthenticationShell>
  );
}
