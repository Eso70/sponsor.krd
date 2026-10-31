import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PublicLinktreePayload } from "@linktree/types";
import { PublicLinktreeContent } from "./PublicLinktreeContent";

vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-nonce": "fixture" }) }));
vi.mock("./PublicPageStructuredData", () => ({ PublicPageStructuredData: () => null }));
vi.mock("@/components/analytics/TikTokPixelBaseCode", () => ({ TikTokPixelBaseCode: () => <div data-testid="pixel" /> }));
vi.mock("./LinktreePage", () => ({ LinktreePage: ({ enableMarketingTracking, analytics }: { enableMarketingTracking: boolean; analytics: { pixelIds: string[] } }) => <div data-testid="page" data-tracking={enableMarketingTracking} data-pixels={analytics.pixelIds.length} /> }));

describe("shared public Linktree rendering", () => {
  it.each([true, false])("renders the page with explicit marketing boundary: %s", async (enabled) => {
    const result = { linktree: { name: "Example", uid: "default", seo_name: "default", template_config: {} }, links: [], analytics: { pixelIds: ["tenant-pixel"], actions: {} }, origin: "https://one.example" } as unknown as PublicLinktreePayload & { origin: string };
    render(await PublicLinktreeContent({ result, enableMarketingTracking: enabled }));
    expect(screen.getByTestId("page")).toHaveAttribute("data-tracking", String(enabled));
    expect(screen.getByTestId("page")).toHaveAttribute("data-pixels", enabled ? "1" : "0");
    expect(Boolean(screen.queryByTestId("pixel"))).toBe(enabled);
  });
});
