import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { businessMessages } from "@/features/business/i18n/messages";
import { BusinessTikTokDeliveryPage } from "./BusinessTikTokDeliveryPage";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
afterEach(() => vi.unstubAllGlobals());
describe("TikTok delivery evidence", () => {
  it.each(["health", "errors"])("does not claim healthy delivery when %s fails", async (endpoint) => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response(JSON.stringify({ data: url.endsWith("health") ? {
      connections: 1, browserEvents: 0, serverEvents: 0, failed: 0, retrying: 0,
      reconciliation: { internalConversions: 0, serverAcceptedConversions: 0 },
    } : { items: [] } }), { status: url.endsWith(endpoint) ? 500 : 200 })));
    render(<NextIntlClientProvider locale="en" messages={businessMessages.en}><BusinessTikTokDeliveryPage embedded /></NextIntlClientProvider>);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(businessMessages.en.TikTokDelivery.healthy)).not.toBeInTheDocument();
  });
});

describe("delivery notice dismissal", () => {
  it.each(["business", "platform"] as const)("dismisses observed notices through the %s endpoint", async (owner) => {
    let dismissed = false;
    const fetcher = vi.fn(async (url: string, _init?: RequestInit) => {
      if (url.endsWith("/dismiss")) dismissed = true;
      return new Response(JSON.stringify({ data: url.endsWith("health") ? {
        connections: 1, browserEvents: 1, serverEvents: 1, failed: 0, retrying: 1,
        reconciliation: { internalConversions: 1, serverAcceptedConversions: 0 },
      } : { items: dismissed ? [] : [{ dismissThrough: "123", destinationId: "destination", pixelId: "pixel", statusCode: 503, severity: "retrying", message: "<HTML>Service unavailable</HTML>", attempts: 1, events: 1, lastSeenAt: "2026-11-09T10:00:00Z" }] } }));
    });
    vi.stubGlobal("fetch", fetcher);
    render(<NextIntlClientProvider locale="en" messages={businessMessages.en}><BusinessTikTokDeliveryPage embedded owner={owner}/></NextIntlClientProvider>);
    expect(await screen.findByText("TikTok is temporarily unavailable. Retries continue if attempts remain.")).toBeInTheDocument();
    expect(screen.queryByText("<HTML>Service unavailable</HTML>")).not.toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: "Dismiss notices" }));
    await waitFor(() => expect(fetcher).toHaveBeenCalledWith(
      `${owner === "business" ? "/api/analytics/v2/tiktok" : "/api/platform/settings/tiktok"}/errors/dismiss`,
      expect.objectContaining({ method: "POST", body: JSON.stringify({ throughAttemptId: "123" }) }),
    ));
    expect(await screen.findByText("No visible delivery notices")).toBeInTheDocument();
    expect(screen.queryByText(businessMessages.en.TikTokDelivery.healthy)).not.toBeInTheDocument();
  });
});
