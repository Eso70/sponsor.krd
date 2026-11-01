import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { businessMessages } from "@/features/business/i18n/messages";
import { BusinessTikTokPixelConfigPage } from "./BusinessTikTokPixelConfigPage";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const originalGroups = [
  { id: "first", pixel_id: "PIXEL_ONE", has_events_token: false },
  { id: "second", pixel_id: "PIXEL_TWO", has_events_token: false },
];

afterEach(() => vi.unstubAllGlobals());

describe.each([
  ["business", "/api/auth/settings", "PATCH"],
  ["platform", "/api/platform/settings/tiktok", "PUT"],
] as const)("%s TikTok settings", (owner, endpoint, method) => {
  it("loads the shared owner-scoped page picker once for all Pixel groups", async () => {
    const pagesEndpoint = owner === "business" ? "/api/analytics/v2/tiktok/test-pages" : "/api/platform/settings/tiktok/test-pages";
    const fetchMock = vi.fn(async (url: string) => new Response(JSON.stringify({ data:
      url === pagesEndpoint ? { items: [{ id: "page", name: "Published page", pageType: "linktree", url: "https://example.com/linktree/page" }], nextCursor: null }
      : { tiktok_configs: originalGroups, entitlements: { "limit.tiktok_pixels": 3 } },
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<BusinessTikTokPixelConfigPage owner={owner} copy={businessMessages.en.TikTokPixel} />);
    await screen.findByDisplayValue("PIXEL_ONE");
    expect(fetchMock.mock.calls.filter(([url]) => url === pagesEndpoint)).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Page" })).toHaveLength(2);
  });

  it("composes embedded content before one final Save action without a second page heading", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data: { items: [], nextCursor: null,
      tiktok_configs: originalGroups,
      entitlements: { "limit.tiktok_pixels": 3 },
    } }), { status: 200 })));
    render(<BusinessTikTokPixelConfigPage owner={owner} embedded managementTitle="TikTok management" copy={businessMessages.en.TikTokPixel}>
      <div data-testid="delivery-content">Delivery status</div>
    </BusinessTikTokPixelConfigPage>);
    await screen.findByDisplayValue("PIXEL_ONE");
    expect(screen.getByRole("heading", { name: "TikTok management" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: businessMessages.en.TikTokPixel.title })).not.toBeInTheDocument();
    const save = screen.getByRole("button", { name: "Save" });
    expect(screen.getAllByRole("button", { name: "Save" })).toHaveLength(1);
    expect(screen.getByTestId("delivery-content").compareDocumentPosition(save) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it("shows and saves both Pixel groups without a primary selection", async () => {
    const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
      if (input.includes('/test-pages')) return new Response(JSON.stringify({ data: { items: [], nextCursor: null } }), { status: 200 });
      if (input === "/api/auth/effective-access") {
        return new Response(JSON.stringify({ data: { entitlements: { "limit.tiktok_pixels": 3 } } }), { status: 200 });
      }
      if (input === endpoint && init?.method === method) {
        return new Response(JSON.stringify({ data: { tiktok_configs: originalGroups } }), { status: 200 });
      }
      if (input === endpoint) {
        return new Response(JSON.stringify({ data: { tiktok_configs: originalGroups } }), { status: 200 });
      }
      throw new Error(`Unexpected request: ${input}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<BusinessTikTokPixelConfigPage owner={owner} copy={businessMessages.en.TikTokPixel} />);
    await screen.findByDisplayValue("PIXEL_ONE");
    expect(screen.getByDisplayValue("PIXEL_TWO")).toBeInTheDocument();
    expect(screen.queryByText("Primary Pixel")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Make primary" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      const saveCall = fetchMock.mock.calls.find(
        ([input, init]) => input === endpoint && init?.method === method,
      );
      expect(saveCall).toBeDefined();
      const payload = JSON.parse(saveCall?.[1]?.body as string) as {
        tiktok_configs: Array<{ pixel_id: string }>;
      };
      expect(payload.tiktok_configs.map((group) => group.pixel_id)).toEqual([
        "PIXEL_ONE", "PIXEL_TWO",
      ]);
    });
  });
});
