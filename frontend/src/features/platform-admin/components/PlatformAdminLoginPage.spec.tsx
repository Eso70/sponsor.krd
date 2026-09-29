import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PlatformAdminLoginPage from "./PlatformAdminLoginPage";
import { PlatformLocaleProvider } from "@/features/platform-admin/i18n/PlatformLocaleProvider";

describe("PlatformAdminLoginPage", () => {
  it("offers Google and email-code platform administrator authentication", () => {
    render(<PlatformLocaleProvider initialLocale="ckb"><PlatformAdminLoginPage /></PlatformLocaleProvider>);
    expect(
      screen.getByRole("link", { name: "بە Google بەردەوام بە" }),
    ).toHaveAttribute("href", "/api/platform/auth/google/start?remember=1");
    expect(
      screen.getByRole("textbox", { name: "ناونیشانی ئیمەیڵ" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "بە ئیمەیڵ بەردەوام بە" })).toBeInTheDocument();
  });

  it("shows Arabic authentication copy", () => {
    render(<PlatformLocaleProvider initialLocale="ar"><PlatformAdminLoginPage /></PlatformLocaleProvider>);
    expect(screen.getByRole("heading", { name: "تسجيل دخول المدير" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "المتابعة باستخدام Google" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "المتابعة بالبريد الإلكتروني" })).toBeInTheDocument();
  });

  it("shows English authentication copy", () => {
    render(<PlatformLocaleProvider initialLocale="en"><PlatformAdminLoginPage /></PlatformLocaleProvider>);
    expect(screen.getByRole("heading", { name: "Administrator login" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Email address" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue with email" })).toBeInTheDocument();
  });
});
