"use client";
import Link from "next/link";
import type { AnalyticsShareBranding } from "@linktree/types";
import { Link2Off } from "lucide-react";
import { AuthenticationShell } from "@/components/shared/AuthenticationShell";
import { AuthenticationCard } from "@/components/shared/AuthenticationCard";
import { AUTHENTICATION_SUBMIT_BUTTON_CLASS } from "@/components/shared/authentication-control-styles";
import { BUSINESS_LOGO_PLACEHOLDER } from "@/lib/brand/brand-assets";
import { sharingCopy, type SharingLocale } from "../sharing-copy";

export function SharedAnalyticsUnavailable({
  locale,
  branding,
}: {
  locale: SharingLocale;
  branding?: Omit<AnalyticsShareBranding, "origin">;
}) {
  const copy = sharingCopy(locale);
  return (
    <AuthenticationShell
      brandDescription={copy.unavailableDescription}
      previewTitle={copy.access}
      language={locale}
      backLabel={copy.back}
      themeCopy={{ label: copy.theme, light: copy.light, dark: copy.dark }}
      businessTenant={branding?.businessTenant}
      brandName={branding?.name}
      brandLogo={
        branding?.businessTenant
          ? branding.logo || BUSINESS_LOGO_PLACEHOLDER
          : branding?.logo
      }
      accentColor={branding?.accentColor}
    >
      <AuthenticationCard
        title={copy.unavailableTitle}
        description={copy.unavailableDescription}
        leading={
          <Link2Off
            aria-hidden
            className="mx-auto mb-4 size-8 text-slate-400"
          />
        }
      >
        <Link href="/" className={AUTHENTICATION_SUBMIT_BUTTON_CLASS}>
          {copy.back}
        </Link>
      </AuthenticationCard>
    </AuthenticationShell>
  );
}
