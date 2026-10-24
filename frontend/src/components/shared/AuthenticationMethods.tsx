"use client";

import { EmailCodeAuthenticationForm } from "@/components/shared/EmailCodeAuthenticationForm";
import { GoogleAuthenticationButton } from "@/components/shared/GoogleAuthenticationButton";

interface AuthenticationMethodsProps {
  googleHref: string;
  requestEndpoint: string;
  verifyEndpoint: string;
  emailPlaceholder?: string;
  emailActionLabel?: string;
  emailCodeTitle?: string;
  emailVerifyActionLabel?: string;
  copy?: Partial<
    Record<
      | "google"
      | "or"
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

export function AuthenticationMethods({
  googleHref,
  requestEndpoint,
  verifyEndpoint,
  emailPlaceholder,
  emailActionLabel,
  emailCodeTitle,
  emailVerifyActionLabel,
  copy,
}: AuthenticationMethodsProps) {
  return (
    <div className="space-y-5">
      <GoogleAuthenticationButton href={googleHref} label={copy?.google} />
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {copy?.or ?? "or"}
        </span>
        <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
      </div>
      <EmailCodeAuthenticationForm
        requestEndpoint={requestEndpoint}
        verifyEndpoint={verifyEndpoint}
        emailPlaceholder={emailPlaceholder}
        actionLabel={emailActionLabel}
        codeTitle={emailCodeTitle}
        verifyActionLabel={emailVerifyActionLabel}
        copy={copy}
      />
    </div>
  );
}
