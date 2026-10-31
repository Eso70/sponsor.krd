// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://sponsor.krd"));
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
function request(host: string, token?: string) {
  return new NextRequest(`https://${host}/business/launch`, { headers: {
    host, "x-subdomain": "acme", ...(token ? { cookie: `business_session=${token}` } : {}),
  } });
}
describe("Business installed-app launch", () => {
  it.each(["acme.sponsor.krd", "customer.example"])("launches an authenticated dashboard on %s", async (host) => {
    vi.stubEnv("INTERNAL_PROXY_SECRET", "test-key");
    const fetcher = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ data: { user: { id: "owner" } } }));
    const response = await GET(request(host, "session"));
    expect(response.headers.get("location")).toBe(`https://${host}/business/pages`);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining("/api/auth/session"), expect.objectContaining({ cache: "no-store", headers: { Cookie: "business_session=session", "x-subdomain": "acme", "x-tenant-proxy-key": "test-key" } }));
  });
  it("uses the verified host rather than the internal reverse-proxy URL", async () => {
    const response = await GET(new NextRequest("http://localhost:3011/business/launch", {
      headers: { host: "customer.example", "x-subdomain": "acme" },
    }));
    expect(response.headers.get("location")).toBe("https://customer.example/business/workspace-entry");
  });
  it("opens sign-in without a session and performs no authenticated request", async () => {
    const fetcher = vi.spyOn(globalThis, "fetch");
    const response = await GET(request("customer.example"));
    expect(response.headers.get("location")).toBe("https://customer.example/business/workspace-entry");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([401, 403])("returns expired/invalid sessions to sign-in (%s)", async (status) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status }));
    const response = await GET(request("customer.example", "expired"));
    expect(response.headers.get("location")).toBe("https://customer.example/business/workspace-entry");
    expect(response.headers.get("set-cookie")).toContain("business_session=;");
  });
  it("keeps the session and returns a retryable failure during an outage", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    const response = await GET(request("customer.example", "session"));
    expect(response.status).toBe(503);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("retry-after")).toBe("30");
  });
});
