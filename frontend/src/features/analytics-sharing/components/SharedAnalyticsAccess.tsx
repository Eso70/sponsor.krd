"use client";
import { Loader2 } from "lucide-react";
import { AuthenticationShell } from "@/components/shared/AuthenticationShell";
import { AuthenticationCard } from "@/components/shared/AuthenticationCard";
import { BusinessPreAuthLanguageToggle } from "@/features/business/components/BusinessPreAuthLanguageToggle";
import {
  AUTHENTICATION_CODE_INPUT_CLASS,
  AUTHENTICATION_SUBMIT_BUTTON_CLASS,
} from "@/components/shared/authentication-control-styles";
import { MotionSpinner } from "@/components/motion/MotionPrimitives";
import { sharingCopy, type SharingLocale } from "../sharing-copy";
import type { AnalyticsShareBranding } from "@linktree/types";
import { BUSINESS_LOGO_PLACEHOLDER } from "@/lib/brand/brand-assets";

export function SharedAnalyticsAccess({
  locale,
  onLocaleChange,
  code,
  onCodeChange,
  busy,
  loading,
  failed,
  onSubmit,
  branding,
}: {
  locale: SharingLocale;
  onLocaleChange: (locale: SharingLocale) => void;
  code: string;
  onCodeChange: (code: string) => void;
  busy: boolean;
  loading: boolean;
  failed: boolean;
  onSubmit: () => void;
  branding?: AnalyticsShareBranding;
}) {
  const copy = sharingCopy(locale);
  const pending = busy || loading;
  return (
    <AuthenticationShell
      businessTenant={branding?.businessTenant}
      brandName={branding?.name}
      brandLogo={
        branding?.businessTenant
          ? branding.logo || BUSINESS_LOGO_PLACEHOLDER
          : branding?.logo
      }
      accentColor={branding?.accentColor}
      brandDescription={copy.portalIntro}
      previewTitle={copy.access}
      language={locale}
      backLabel={copy.back}
      themeCopy={{ label: copy.theme, light: copy.light, dark: copy.dark }}
      headerAction={
        <BusinessPreAuthLanguageToggle
          locale={locale}
          onChange={onLocaleChange}
        />
      }
    >
      <AuthenticationCard title={copy.enter} description={copy.portalIntro}>
        <form
          className="space-y-3"
          dir="ltr"
          onSubmit={(event) => {
            event.preventDefault();
            if (!pending) onSubmit();
          }}
        >
          <label className="block space-y-2 text-sm">
            <span>{copy.code}</span>
            <input
              className={AUTHENTICATION_CODE_INPUT_CLASS}
              placeholder="– – – – – –"
              dir="ltr"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              required
              value={code}
              disabled={pending}
              aria-invalid={failed || undefined}
              aria-describedby={failed ? "share-access-error" : undefined}
              onChange={(event) =>
                onCodeChange(
                  event.target.value
                    .replace(/[٠-٩۰-۹]/g, (digit) =>
                      String(
                        digit.charCodeAt(0) - (digit >= "۰" ? 1776 : 1632),
                      ),
                    )
                    .replace(/\D/g, "")
                    .slice(0, 6),
                )
              }
            />
          </label>
          {failed && (
            <p
              id="share-access-error"
              role="alert"
              className="text-xs font-medium text-red-600 dark:text-red-400"
            >
              {copy.unavailable}
            </p>
          )}
          <button
            type="submit"
            className={AUTHENTICATION_SUBMIT_BUTTON_CLASS}
            disabled={pending || code.length !== 6}
            aria-busy={pending}
          >
            {pending ? (
              <>
                <MotionSpinner>
                  <Loader2 aria-hidden className="h-4 w-4" />
                </MotionSpinner>
                <span className="sr-only">{copy.verifying}</span>
              </>
            ) : (
              copy.unlock
            )}
          </button>
        </form>
      </AuthenticationCard>
    </AuthenticationShell>
  );
}
