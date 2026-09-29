import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TikTokDeliveryStatusPanel } from "./TikTokDeliveryStatusPanel";

vi.mock("@/features/analytics/api", () => ({
  getTikTokHealth: vi.fn(async () => ({
    connections: 1, browserEvents: 1, serverEvents: 1,
    delivered: 1, retrying: 0, failed: 0, deliveryRate: 1, lastDeliveredAt: null,
  })),
  getTikTokDeliveryErrors: vi.fn(async () => ({ items: [] })),
}));

describe("TikTok delivery status copy", () => {
  it.each([
    { locale: "ckb" as const, title: "دۆخی گەیاندن", healthy: "هیچ هەڵەیەکی گەیاندن نییە." },
    { locale: "ar" as const, title: "حالة التسليم", healthy: "لا توجد أخطاء في التسليم." },
    { locale: "en" as const, title: "Delivery status", healthy: "No delivery errors." },
  ])("shows $locale labels", async ({ locale, title, healthy }) => {
    render(<TikTokDeliveryStatusPanel locale={locale} />);
    expect(await screen.findByText(title)).toBeInTheDocument();
    expect(screen.getByText(healthy)).toBeInTheDocument();
  });
});
