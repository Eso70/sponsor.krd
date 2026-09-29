"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AuthenticationCard } from "@/components/shared/AuthenticationCard";
import { AuthenticationShell } from "@/components/shared/AuthenticationShell";
import { AuthenticationMethods } from "@/components/shared/AuthenticationMethods";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorPagePanel } from "@/components/error-pages/ErrorPage";
import { ERROR_PAGE_COPY } from "@/components/error-pages/copy";
import { SPONSOR_KRD_ERROR_THEME } from "@/components/error-pages/error-theme";
import { RootPublicLanguageToggle, useRootPublicLocale } from "@/features/public-site/RootPublicLocaleProvider";
import { rootOnboardingCopy } from "../root-onboarding-copy";

export function InvitationEntryPage() {
  const { locale } = useRootPublicLocale();
  const copy = rootOnboardingCopy[locale];
  const search = useSearchParams();
  const [token] = useState(() => search.get("token") || "");
  const [state, setState] = useState<
    "loading" | "valid" | "invalid" | "expired"
  >(token ? "loading" : "invalid");

  useEffect(() => {
    if (!token) return;
    void fetch(`/api/signup/invitation?token=${encodeURIComponent(token)}`, {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        if (response.ok) {
          setState("valid");
          window.history.replaceState({}, "", "/join");
          return;
        }
        setState(
          response.status === 410 && payload?.message === "Invitation expired"
            ? "expired"
            : "invalid",
        );
      })
      .catch(() => setState("invalid"));
  }, [token]);

  if (state === "expired") {
    return (
      <AuthenticationShell brandDescription={copy.brand} previewTitle={copy.preview} backLabel={copy.back} themeCopy={copy.theme} language={locale} headerAction={<RootPublicLanguageToggle />}>
        <ErrorPagePanel
          {...(locale === "ar" ? { code: "410", title: "انتهت صلاحية الدعوة", description: "انتهت المدة الآمنة لهذه الدعوة. اطلب دعوة جديدة من مسؤول Sponsor.krd.", language: "ar", copy: { retry: "حاول مرة أخرى", home: "الصفحة الرئيسية", errorCode: "رمز الخطأ" } } : locale === "en" ? { code: "410", title: "Invitation expired", description: "This invitation's secure period has ended. Request a new invitation from a Sponsor.krd administrator.", language: "en", copy: { retry: "Try again", home: "Home page", errorCode: "Error code" } } : ERROR_PAGE_COPY.invitationExpired)}
          theme={SPONSOR_KRD_ERROR_THEME}
          homeHref="/"
        />
      </AuthenticationShell>
    );
  }

  return (
    <AuthenticationShell brandDescription={copy.brand} previewTitle={copy.preview} backLabel={copy.back} themeCopy={copy.theme} language={locale} headerAction={<RootPublicLanguageToggle />}>
      <AuthenticationCard
        title={copy.title}
        description={copy.entryDescription}
      >
        {state === "loading" ? (
          <LoadingState
            title={copy.verifying}
            description={copy.verifyingDescription}
          />
        ) : state === "invalid" ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-5 text-left dark:border-red-900 dark:bg-red-950/30"
          >
            <ShieldCheck className="h-9 w-9 text-red-500" />
            <h3 className="mt-4 font-bold text-red-700 dark:text-red-300">
              {copy.invalid}
            </h3>
            <p className="mt-2 text-sm leading-6 text-red-600/80 dark:text-red-300/80">
              {copy.invalidDescription}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <AuthenticationMethods
              googleHref={`/api/signup/google/start?invite=${encodeURIComponent(token)}`}
              requestEndpoint={`/api/signup/email/request?invite=${encodeURIComponent(token)}`}
              verifyEndpoint="/api/signup/email/verify"
              emailPlaceholder={copy.emailPlaceholder}
              emailActionLabel={copy.emailAction}
              emailCodeTitle={copy.emailCodeTitle}
              emailVerifyActionLabel={copy.emailVerifyAction}
              copy={copy.auth}
            />
            <p
              className="text-center text-xs leading-5 text-slate-400"
              dir="rtl"
            >
              {copy.consentBefore}{" "}
              <Link
                href="/legal/terms"
                target="_blank"
                className="underline hover:text-slate-600"
              >
                {copy.terms}
              </Link>{" "}
              {copy.and}{" "}
              <Link
                href="/legal/privacy"
                target="_blank"
                className="underline hover:text-slate-600"
              >
                {copy.privacy}
              </Link>{" "}
              {copy.consentAfter}
            </p>
          </div>
        )}
      </AuthenticationCard>
    </AuthenticationShell>
  );
}
