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
  it("shows and saves both Pixel groups without a primary selection", async () => {
    const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
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
