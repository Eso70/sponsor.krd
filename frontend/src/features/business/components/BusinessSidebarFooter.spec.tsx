import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import { BusinessSidebarFooter } from "@/features/business/components/BusinessSidebarFooter";
import { businessMessages } from "@/features/business/i18n/messages";

describe("BusinessSidebarFooter", () => {
  it("shows the current plan and upgrade action for upgradeable plans", () => {
    const onUpgrade = vi.fn();

    render(
      <NextIntlClientProvider locale="ckb" messages={businessMessages.ckb}>
        <BusinessSidebarFooter
          collapsed={false}
          planCode="basic"
          planName="Basic"
          onSupport={vi.fn()}
          onUpgrade={onUpgrade}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("Basic")).toBeInTheDocument();
    fireEvent.click(screen.getByText("پلانەکەت بەرز بکەرەوە"));
    expect(onUpgrade).toHaveBeenCalledTimes(1);
  });

  it("does not offer an upgrade for the highest plan", () => {
    render(
      <NextIntlClientProvider locale="ckb" messages={businessMessages.ckb}>
        <BusinessSidebarFooter
          collapsed
          planCode="ultra"
          planName="Ultra"
          onSupport={vi.fn()}
          onUpgrade={vi.fn()}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("Ultra")).toBeInTheDocument();
    expect(
      screen.queryByText("پلانەکەت بەرز بکەرەوە"),
    ).not.toBeInTheDocument();
  });

  it("uses Arabic wording when Arabic is selected", () => {
    render(
      <NextIntlClientProvider locale="ar" messages={businessMessages.ar}>
        <BusinessSidebarFooter
          collapsed={false}
          planCode="basic"
          planName="Basic"
          onSupport={vi.fn()}
          onUpgrade={vi.fn()}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("الخطة الحالية")).toBeInTheDocument();
    expect(screen.getByText("ترقية خطتك")).toBeInTheDocument();
    expect(screen.getByText("المساعدة والدعم")).toBeInTheDocument();
  });
});
