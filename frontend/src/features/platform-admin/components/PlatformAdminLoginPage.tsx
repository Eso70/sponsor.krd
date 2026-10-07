"use client";

import { useEffect } from "react";
import { AuthenticationCard } from "@/components/shared/AuthenticationCard";
import { AuthenticationMethods } from "@/components/shared/AuthenticationMethods";
import { AuthenticationShell } from "@/components/shared/AuthenticationShell";
import { SPONSOR_KRD_ACCENT_VALUE } from "@/lib/sponsor-krd-theme";
import { applyCursorTheme } from "@/lib/utils/cursor-theme";
import { usePlatformLocale } from "@/features/platform-admin/i18n/PlatformLocaleProvider";

export default function PlatformAdminLoginPage() {
  const { locale } = usePlatformLocale();
  const ar = locale === "ar";
  const en = locale === "en";
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
    <AuthenticationShell
      brandDescription={ar ? "سجّل الدخول لإدارة المنصة" : en ? "Log in to manage the platform" : "بڕۆ ژوورەوە بۆ بەڕێوەبردنی پلاتفۆڕم"}
      previewTitle={ar ? "لوحة المنصة" : en ? "Platform dashboard" : "پانێڵی پلاتفۆڕم"}
      backLabel={ar ? "العودة إلى الرئيسية" : en ? "Back to home" : "گەڕانەوە بۆ سەرەکی"}
      themeCopy={ar ? { label: "تغيير المظهر", light: "الوضع الفاتح", dark: "الوضع الداكن" } : en ? { label: "Toggle appearance", light: "Light mode", dark: "Dark mode" } : { label: "گۆڕینی دۆخی ڕەنگ", light: "دۆخی ڕووناک", dark: "دۆخی تاریک" }}
      language={locale}
    >
      <AuthenticationCard
        title={ar ? "تسجيل دخول المدير" : en ? "Administrator login" : "چوونەژوورەوەی بەڕێوەبەر"}
        description={ar ? "سجّل الدخول باستخدام جوجل أو البريد الإلكتروني" : en ? "Log in with Google or email" : "بە گوگڵ یان ئیمێڵ بڕۆ ژوورەوە"}
      >
        <AuthenticationMethods
          rememberDevice
          googleHref="/api/platform/auth/google/start"
          requestEndpoint="/api/platform/auth/email/request"
          verifyEndpoint="/api/platform/auth/email/verify"
          emailPlaceholder={ar ? "أدخل بريد المدير الإلكتروني" : en ? "Enter the administrator email" : "ئیمەیڵی بەڕێوەبەر بنووسە"}
          emailActionLabel={ar ? "المتابعة بالبريد الإلكتروني" : en ? "Continue with email" : "بە ئیمەیڵ بەردەوام بە"}
          emailCodeTitle={ar ? "أدخل رمز تسجيل الدخول" : en ? "Enter login code" : "کۆدی چوونەژوورەوە بنووسە"}
          emailVerifyActionLabel={ar ? "تسجيل الدخول" : en ? "Log in" : "چوونەژوورەوە"}
          copy={ar ? {
            google: "المتابعة باستخدام جوجل",
            or: "أو",
            remember: "البقاء مسجّلًا على هذا الجهاز",
            changeEmail: "تغيير البريد الإلكتروني",
            codeSent: "أرسلنا رمزًا مكوّنًا من 6 أرقام إلى {email}. تنتهي صلاحيته خلال 10 دقائق.",
            loginCode: "رمز تسجيل الدخول",
            resend: "إعادة الإرسال",
            resendIn: "إعادة الإرسال خلال {seconds} ثانية",
            emailAddress: "البريد الإلكتروني",
            error: "تعذّر إتمام الطلب. حاول مرة أخرى.",
          } : en ? {
            google: "Continue with Google", or: "or", remember: "Remember this device", changeEmail: "Change email", codeSent: "We sent a 6-digit code to {email}. It expires in 10 minutes.", loginCode: "Login code", resend: "Resend", resendIn: "Resend in {seconds} seconds", emailAddress: "Email address", error: "Could not complete the request. Please try again.",
          } : {
            google: "بە گوگڵ بەردەوام بە",
            or: "یان",
            remember: "لەم ئامێرەدا چوونەژوورەوەکەم بهێڵەوە",
            changeEmail: "گۆڕینی ئیمەیڵ",
            codeSent: "کۆدێکی ٦ ژمارەییمان نارد بۆ {email}. کۆدەکە لە ماوەی ١٠ خولەکدا بەسەر دەچێت.",
            loginCode: "کۆدی چوونەژوورەوە",
            resend: "دووبارە کۆد بنێرە",
            resendIn: "دووبارە ناردنەوە لە {seconds} چرکەدا",
            emailAddress: "ناونیشانی ئیمەیڵ",
            error: "داواکارییەکە تەواو نەبوو. دووبارە هەوڵ بدەوە.",
          }}
        />
      </AuthenticationCard>
    </AuthenticationShell>
  );
}
