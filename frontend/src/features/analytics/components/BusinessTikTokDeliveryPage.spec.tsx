import { render, screen } from "@testing-library/react";
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
