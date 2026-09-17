"use client";

import { useEffect } from "react";
import { AuthenticationCard } from "@/components/shared/AuthenticationCard";
import { AuthenticationMethods } from "@/components/shared/AuthenticationMethods";
import { AuthenticationShell } from "@/components/shared/AuthenticationShell";
import { SPONSOR_KRD_ACCENT_VALUE } from "@/lib/sponsor-krd-theme";
import { applyCursorTheme } from "@/lib/utils/cursor-theme";

export default function PlatformAdminLoginPage() {
  useEffect(() => {
    let cancelled = false;
    void applyCursorTheme(
      SPONSOR_KRD_ACCENT_VALUE,
      document.documentElement,
      () => !cancelled,
    ).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthenticationShell brandDescription="بڕۆ ژوورەوە بۆ بەڕێوەبردنی پلاتفۆڕم">
      <AuthenticationCard
        title="چوونەژوورەوەی بەڕێوەبەر"
        description="بە گوگڵ یان ئیمێڵ بڕۆ ژوورەوە"
      >
        <AuthenticationMethods
          rememberDevice
          googleHref="/api/platform/auth/google/start"
          requestEndpoint="/api/platform/auth/email/request"
          verifyEndpoint="/api/platform/auth/email/verify"
          emailPlaceholder="Enter the administrator email"
        />
      </AuthenticationCard>
    </AuthenticationShell>
  );
}
