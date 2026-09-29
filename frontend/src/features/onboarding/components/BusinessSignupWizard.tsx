"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Loader2, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/api/request";
import { getBusinessWorkspaceEntryUrl, getRootDomain } from "@/lib/utils/app-url";
import { AuthenticationCard } from "@/components/shared/AuthenticationCard";
import { AuthenticationShell } from "@/components/shared/AuthenticationShell";
import { AuthenticationRefreshButton } from "@/components/shared/AuthenticationRefreshButton";
import { EditorField } from "@/components/shared/EditorField";
import { LanguagePreferenceSelect } from "@/components/shared/LanguagePreferenceSelect";
import { InlineRequestError } from "@/components/shared/InlineRequestError";
import { MotionSpinner } from "@/components/motion/MotionPrimitives";
import { LoadingState } from "@/components/shared/LoadingState";
import { modalInputClass } from "@/features/link-editor/modal-input-styles";
import { toast } from "sonner";
import { RootPublicLanguageToggle, useRootPublicLocale } from "@/features/public-site/RootPublicLocaleProvider";
import { parseRootPublicLocale, type RootPublicLocale } from "@/features/public-site/root-public-locale";
import { rootOnboardingCopy } from "../root-onboarding-copy";
import {
  buildSignupApplicationPayload,
  validateSignupApplication,
  type SignupApplicationForm,
  type SignupFieldErrors,
} from "@/features/onboarding/signup-application";

type Application = {
  status: string;
  ownerEmail: string;
  businessName: string | null;
  phone: string | null;
  requestedSubdomain: string | null;
  preferredLocale?: RootPublicLocale;
  reviewReason?: string | null;
};

function slug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

export function BusinessSignupWizard() {
  const { locale } = useRootPublicLocale();
  const copy = rootOnboardingCopy[locale];
  const [application, setApplication] = useState<Application | null>(null);
  const [form, setForm] = useState<SignupApplicationForm>({
    businessName: "",
    phone: "",
    requestedSubdomain: "",
    preferredLocale: "en",
  });
  const [subdomainTouched, setSubdomainTouched] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<SignupFieldErrors>({});
  const [errorsLocale, setErrorsLocale] = useState(locale);
  const visibleErrors = errorsLocale === locale || Object.keys(errors).length === 0
    ? errors
    : validateSignupApplication(form, available, locale);
  const displayedError = error === "SIGNUP_SESSION_EXPIRED" ? copy.sessionExpired
    : error === "SIGNUP_SUBMIT_FAILED" ? copy.submitFailed
    : error === "SIGNUP_REFRESH_FAILED" ? copy.refreshFailed : error;

  useEffect(() => {
    void apiRequest<Application>("/api/signup/application")
      .then((data) => {
        setApplication(data);
        setForm({
          businessName: data.businessName || "",
          phone: data.phone || "",
          requestedSubdomain: data.requestedSubdomain || "",
          preferredLocale: data.preferredLocale ? parseRootPublicLocale(data.preferredLocale) : "en",
        });
      })
      .catch(() =>
        setError("SIGNUP_SESSION_EXPIRED"),
      )
      .finally(() => setLoading(false));
  }, []);

  async function refreshStatus() {
    setRefreshing(true);
    setError("");
    try {
      const latest = await apiRequest<Application>("/api/signup/application");
      setApplication(latest);
      if (latest.status === "pending") {
        toast.info(copy.stillPending);
      } else {
        toast.success(copy.statusUpdated);
      }
    } catch {
      const message = copy.refreshFailed;
      setError("SIGNUP_REFRESH_FAILED");
      toast.error(message);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!form.requestedSubdomain) return;
    const timer = window.setTimeout(() => {
      void apiRequest<{ available: boolean }>(
        `/api/signup/subdomain-availability?value=${encodeURIComponent(form.requestedSubdomain)}`,
      )
        .then((result) => setAvailable(result.available))
        .catch(() => setAvailable(false));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [form.requestedSubdomain]);

  async function submit() {
    const nextErrors = validateSignupApplication(form, available, locale);
    setErrors(nextErrors);
    setErrorsLocale(locale);
    if (Object.keys(nextErrors).length > 0) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest("/api/signup/application", {
        method: "PATCH",
        json: buildSignupApplicationPayload(form),
      });
      setApplication(
        await apiRequest<Application>("/api/signup/application/submit", {
          method: "POST",
        }),
      );
    } catch {
      setError("SIGNUP_SUBMIT_FAILED");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !application) {
    return (
      <AuthenticationShell brandDescription={copy.wizardBrand} backLabel={copy.back} previewTitle={copy.preview} themeCopy={copy.theme} language={locale} headerAction={<RootPublicLanguageToggle />}>
        <AuthenticationCard
          title={loading ? copy.preparing : copy.unavailable}
          description={loading ? copy.loadingData : displayedError}
        >
          {loading ? (
            <LoadingState
              title={copy.loadingData}
              description={copy.preparingDescription}
            />
          ) : null}
        </AuthenticationCard>
      </AuthenticationShell>
    );
  }

  if (["pending", "approved", "rejected"].includes(application.status)) {
    const approved = application.status === "approved";
    const pending = application.status === "pending";
    return (
      <AuthenticationShell
        brandDescription={copy.wizardReviewBrand}
        backLabel={copy.back}
        previewTitle={copy.preview}
        themeCopy={copy.theme}
        language={locale}
        headerAction={
          <div className="flex items-center gap-2">
            <RootPublicLanguageToggle />
            {pending ? (
            <AuthenticationRefreshButton
              refreshing={refreshing}
              onRefresh={() => void refreshStatus()}
              label={copy.refreshStatus}
            />
            ) : null}
          </div>
        }
      >
        <AuthenticationCard
          title={
            pending
              ? copy.pendingTitle
              : approved
                ? copy.approvedTitle
                : copy.rejectedTitle
          }
          description={
            application.reviewReason ||
            (pending
              ? copy.pendingDescription
              : approved
                ? copy.approvedDescription
                : copy.rejectedDescription)
          }
        >
          <div className="flex justify-center py-3">
            {pending ? (
              <Clock3 className="h-12 w-12 text-amber-500" />
            ) : approved ? (
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            ) : (
              <ShieldCheck className="h-12 w-12 text-red-500" />
            )}
          </div>
          {approved && application.requestedSubdomain ? (
            <button
              type="button"
              onClick={() => {
                const subdomain = application.requestedSubdomain;
                if (!subdomain) return;
                window.location.href = getBusinessWorkspaceEntryUrl(subdomain);
              }}
              className="mt-4 h-12 w-full rounded-xl bg-[var(--sponsor-krd-accent)] text-sm font-bold text-[var(--sponsor-krd-accent-ink)]"
            >
              {copy.businessLogin}
            </button>
          ) : null}
        </AuthenticationCard>
      </AuthenticationShell>
    );
  }

  return (
    <AuthenticationShell brandDescription={copy.wizardFormBrand} backLabel={copy.back} previewTitle={copy.preview} themeCopy={copy.theme} language={locale} headerAction={<RootPublicLanguageToggle />}>
      <AuthenticationCard
        title={copy.title}
        description={copy.formDescription}
      >
        <div className="space-y-4" dir="ltr">
          {error ? (
            <InlineRequestError
              error={{
                code: "SIGNUP_ERROR",
                status: null,
                title: copy.submitFailed,
                message: displayedError,
              }}
            />
          ) : null}
          {application.reviewReason ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
              {application.reviewReason}
            </div>
          ) : null}
          <EditorField label={copy.businessName} required error={visibleErrors.businessName}>
            <input
              autoFocus
              className={modalInputClass(Boolean(visibleErrors.businessName))}
              aria-invalid={Boolean(visibleErrors.businessName)}
              value={form.businessName}
              placeholder={copy.namePlaceholder}
              onChange={(event) => {
                const businessName = event.target.value;
                setAvailable(null);
                setForm((current) => ({
                  ...current,
                  businessName,
                  requestedSubdomain: subdomainTouched
                    ? current.requestedSubdomain
                    : slug(businessName),
                }));
              }}
            />
          </EditorField>
          <EditorField label={copy.phone} required error={visibleErrors.phone}>
            <input
              type="tel"
              autoComplete="tel"
              className={modalInputClass(Boolean(visibleErrors.phone))}
              aria-invalid={Boolean(visibleErrors.phone)}
              value={form.phone}
              placeholder={copy.phonePlaceholder}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
            />
          </EditorField>
          <EditorField
            label={copy.subdomain}
            required
            hint={
              available === null ? "" : available ? copy.available : copy.unavailableSubdomain
            }
            error={visibleErrors.requestedSubdomain || visibleErrors.subdomainAvailability}
          >
            <div className="flex items-center gap-2">
              <input
                className={modalInputClass(
                  available === false ||
                    Boolean(
                      visibleErrors.requestedSubdomain || visibleErrors.subdomainAvailability,
                    ),
                )}
                aria-invalid={Boolean(
                  visibleErrors.requestedSubdomain || visibleErrors.subdomainAvailability,
                )}
                value={form.requestedSubdomain}
                placeholder={copy.subdomainPlaceholder}
                onChange={(event) => {
                  setSubdomainTouched(true);
                  setAvailable(null);
                  setForm({
                    ...form,
                    requestedSubdomain: slug(event.target.value),
                  });
                }}
              />
              <span className="shrink-0 text-xs text-slate-400">.{getRootDomain().split(":")[0]}</span>
            </div>
          </EditorField>
          <LanguagePreferenceSelect
            label={copy.defaultLanguage}
            hint={copy.languageHint}
            value={form.preferredLocale}
            onChange={(preferredLocale) => setForm((current) => ({ ...current, preferredLocale }))}
            disabled={busy}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[var(--sponsor-krd-accent)] px-5 text-sm font-bold text-[var(--sponsor-krd-accent-ink)] transition hover:brightness-95 disabled:opacity-50"
          >
            {busy ? (
              <MotionSpinner>
                <Loader2 className="h-5 w-5" />
              </MotionSpinner>
            ) : (
              copy.submit
            )}
          </button>
          <p
            className="text-center text-[11px] leading-5 text-slate-400"
            dir="rtl"
          >
            {copy.submitConsentBefore}{" "}
            <Link href="/legal/terms" target="_blank" className="underline">
              {copy.terms}
            </Link>{" "}
            {copy.and}{" "}
            <Link href="/legal/privacy" target="_blank" className="underline">
              {copy.privacy}
            </Link>{" "}
            {copy.consentAfter}
          </p>
        </div>
      </AuthenticationCard>
    </AuthenticationShell>
  );
}
