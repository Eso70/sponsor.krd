import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { businessMessages } from "@/features/business/i18n/messages";
import { BusinessTikTokConfigPage } from "./BusinessTikTokConfigPage";

vi.mock("./BusinessTikTokPixelConfigPage", () => ({
  BusinessTikTokPixelConfigPage: ({ embedded, children }: { embedded?: boolean; children?: ReactNode }) => <section aria-label="Pixel configuration" data-embedded={embedded}>{children}</section>,
}));
vi.mock("./BusinessTikTokDeliveryPage", () => ({
  BusinessTikTokDeliveryPage: ({ embedded }: { embedded?: boolean }) => <section aria-label="Delivery diagnostics" data-embedded={embedded} />,
}));

afterEach(() => vi.unstubAllGlobals());

describe.each(["en", "ckb", "ar"] as const)("combined TikTok settings (%s)", (locale) => {
  it.each([true, false])("keeps setup visible and gates diagnostics (allowed=%s)", async (allowed) => {
    const fetchMock = vi.fn(async (url: string) => {
      const data = url.endsWith("effective-access")
        ? { subscription: { planCode: allowed ? "max" : "basic" }, permissions: {
          "business:analytics:tiktok-health-read": { outcome: allowed ? "allow" : "deny" },
        } }
        : url.endsWith("settings")
          ? { tiktok_configs: [{ pixel_id: "PIXEL_ONE", has_events_token: true }] }
          : { delivered: 8, deliveryRate: 80 };
      return new Response(JSON.stringify({ data }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<NextIntlClientProvider locale={locale} messages={businessMessages[locale]}>
      <BusinessTikTokConfigPage />
    </NextIntlClientProvider>);

    expect(await screen.findByRole("region", { name: "Pixel configuration" })).toBeInTheDocument();
    const setup = screen.getByRole("region", { name: "Pixel configuration" });
    expect(setup).toHaveAttribute("data-embedded", "true");
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    if (allowed) {
      expect(setup).toContainElement(screen.getByRole("region", { name: "Delivery diagnostics" }));
      expect(screen.getByRole("region", { name: "Delivery diagnostics" })).toHaveAttribute("data-embedded", "true");
      expect(screen.getByRole("region", { name: "Delivery diagnostics" })).toBeInTheDocument();
      expect(screen.getByText("80.0٪")).toBeInTheDocument();
    } else {
      expect(screen.queryByRole("region", { name: "Delivery diagnostics" })).not.toBeInTheDocument();
      expect(screen.getByText(businessMessages[locale].TikTokPage.lockedTitle)).toBeInTheDocument();
      expect(fetchMock.mock.calls.some(([url]) => url.endsWith("/health"))).toBe(false);
    }
  });
});
