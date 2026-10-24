"use client";

import { SHARED_CONTROL_CLASS, SHARED_SOFT_BUTTON_CLASS } from "./shared-control-styles";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api/request";
import { MotionSpinner } from "@/components/motion/MotionPrimitives";
import {
  AUTHENTICATION_CODE_INPUT_CLASS,
  AUTHENTICATION_SUBMIT_BUTTON_CLASS,
} from "./authentication-control-styles";

type EmailChallenge = {
  challengeId: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
};

type EmailVerification = {
  authenticated: boolean;
  redirectUrl: string;
};

interface EmailCodeAuthenticationFormProps {
  requestEndpoint: string;
  verifyEndpoint: string;
  emailPlaceholder?: string;
  actionLabel?: string;
  codeTitle?: string;
  verifyActionLabel?: string;
  copy?: Partial<
    Record<
      | "changeEmail"
      | "codeSent"
      | "loginCode"
      | "resend"
      | "resendIn"
      | "emailAddress"
      | "error",
      string
    >
  >;
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The request could not be completed. Try again.";
}

export function EmailCodeAuthenticationForm({
  requestEndpoint,
  verifyEndpoint,
  emailPlaceholder = "Enter your email",
  actionLabel = "Continue with email",
  codeTitle = "Enter your login code",
  verifyActionLabel = "Sign in",
  copy,
}: EmailCodeAuthenticationFormProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<EmailChallenge | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(
      () => setResendIn((current) => Math.max(0, current - 1)),
      1_000,
    );
    return () => window.clearInterval(timer);
  }, [resendIn]);

  async function requestCode(event?: FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest<EmailChallenge>(requestEndpoint, {
        method: "POST",
        json: { email },
      });
      setChallenge(result);
      setCode("");
      setResendIn(result.resendAfterSeconds);
    } catch (cause) {
      setError(copy?.error ?? errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    if (!challenge) return;
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest<EmailVerification>(verifyEndpoint, {
        method: "POST",
        json: { challengeId: challenge.challengeId, code },
      });
      window.location.assign(result.redirectUrl);
    } catch (cause) {
      setError(copy?.error ?? errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  if (challenge) {
    return (
      <form onSubmit={verifyCode} className="space-y-3" dir="ltr">
        <button
          type="button"
          onClick={() => {
            setChallenge(null);
            setCode("");
            setError("");
          }}
          className={`${SHARED_SOFT_BUTTON_CLASS} inline-flex min-h-9 items-center gap-2 px-3 text-xs font-semibold`}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {copy?.changeEmail ?? "Change email"}
        </button>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {codeTitle}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {copy?.codeSent?.replace("{email}", email) ??
              `We sent a 6-digit code to ${email}. It expires in 10 minutes.`}
          </p>
        </div>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          autoFocus
          aria-label={copy?.loginCode ?? "Login code"}
          value={code}
          onChange={(event) =>
            setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
          }
          className={AUTHENTICATION_CODE_INPUT_CLASS}
        />
        {error ? (
          <p
            role="alert"
            className="text-xs font-medium text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy || code.length !== 6}
          className={AUTHENTICATION_SUBMIT_BUTTON_CLASS}
        >
          {busy ? (
            <MotionSpinner>
              <Loader2 className="h-4 w-4" />
            </MotionSpinner>
          ) : (
            verifyActionLabel
          )}
        </button>
        <button
          type="button"
          disabled={busy || resendIn > 0}
          onClick={() => void requestCode()}
          className={`${SHARED_SOFT_BUTTON_CLASS} min-h-10 w-full px-3 text-center text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {resendIn > 0
            ? (copy?.resendIn?.replace("{seconds}", String(resendIn)) ??
              `Send again in ${resendIn}s`)
            : (copy?.resend ?? "Send code again")}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={requestCode} className="space-y-3" dir="ltr">
      <div className="relative">
        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          suppressHydrationWarning
          aria-label={copy?.emailAddress ?? "Email address"}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={emailPlaceholder}
          className={`${SHARED_CONTROL_CLASS} h-12 w-full pl-11 pr-4 text-sm`}
        />
      </div>
      {error ? (
        <p
          role="alert"
          className="text-xs font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className={AUTHENTICATION_SUBMIT_BUTTON_CLASS}
      >
        {busy ? (
          <MotionSpinner>
            <Loader2 className="h-4 w-4" />
          </MotionSpinner>
        ) : (
          actionLabel
        )}
      </button>
    </form>
  );
}
