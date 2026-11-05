import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { POST } from "../../../platform/tiktok/verify/route";

describe("retired TikTok Ads endpoints", () => {
  afterEach(() => vi.unstubAllGlobals());
  it.each([GET, POST])("rejects requests without provider calls or credential echoes", async (handler) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = handler(new NextRequest("http://localhost/api/auth/tiktok/callback?connected=true&auth_code=secret"));
    expect(response.status).toBe(410);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.has("location")).toBe(false);
    const payload = await response.text();
    expect(payload).toContain("TIKTOK_ADS_UNAVAILABLE");
    expect(payload).not.toContain("secret");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
