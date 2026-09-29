import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BusinessImpersonationBanner } from "@/components/business/BusinessImpersonationBanner";
import { businessMessages } from "@/features/business/i18n/messages";

vi.mock("@/features/business/api", () => ({
  exitBusinessImpersonation: vi.fn(),
}));

describe("BusinessImpersonationBanner", () => {
  it("keeps the security context visible with explicit dark-mode contrast", () => {
    render(
      <BusinessImpersonationBanner
        businessName="Ismail"
        platformAdminName="Sponsor.krd"
      />,
    );

    const banner = screen.getByRole("status");
    expect(banner).toHaveTextContent("Signed in as Ismail");
    expect(banner).toHaveTextContent("platform administrator Sponsor.krd");
    expect(banner).toHaveClass("dark:bg-[#211b10]/95");
    expect(
      screen.getByRole("button", { name: "Exit impersonation" }),
    ).toHaveClass("dark:bg-amber-200", "dark:text-amber-950");
  });

  it("uses the selected Business language for the impersonation warning", () => {
    render(
      <BusinessImpersonationBanner
        businessName="Example"
        platformAdminName="Sponsor.krd"
        copy={businessMessages.ar.Impersonation}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("سجّلت الدخول بصفتك Example");
    expect(screen.getByRole("status")).toHaveTextContent("تُسجّل جميع الإجراءات");
    expect(screen.getByRole("button", { name: "إنهاء الدخول بالنيابة" })).toBeInTheDocument();
  });
});
