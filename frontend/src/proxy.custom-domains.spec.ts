// @vitest-environment node
import { NextRequest } from "next/server";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
const { resolve } = vi.hoisted(() => ({ resolve: vi.fn() }));
vi.mock("@/lib/public/domain-routing", () => ({
  resolveBusinessHost: resolve,
}));
const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
let proxy: typeof import("./proxy").proxy;
function request(path: string, host = "wafaye.com") {
  return new NextRequest(`https://${host}${path}`, {
    headers: { host, "x-subdomain": "victim" },
  });
}
describe("verified custom-domain routing", () => {
  beforeAll(async () => {
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = "sponsor.krd";
    process.env.NEXT_PUBLIC_APP_URL = "https://sponsor.krd";
    ({ proxy } = await import("./proxy"));
  });
  afterAll(() => {
    if (root === undefined) delete process.env.NEXT_PUBLIC_ROOT_DOMAIN;
    else process.env.NEXT_PUBLIC_ROOT_DOMAIN = root;
    if (appUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = appUrl;
    vi.unstubAllGlobals();
  });
  beforeEach(() => {
    resolve.mockResolvedValue({
      hostname: "wafaye.com",
      subdomain: "wafaye",
      primaryHostname: "wafaye.com",
      isCustom: true,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: { slug: "menu" } }), {
          status: 200,
        }),
      ),
    );
  });
  it("sets the verified business tenant and ignores forged browser headers", async () => {
    const response = await proxy(request("/"));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-request-x-subdomain")).toBe(
      "wafaye",
    );
  });
  it.each(["sponsor.krd", "wafaye.sponsor.krd", "wafaye.com"])(
    "blocks internal endpoints before resolution on %s",
    async (host) => {
      const calls = resolve.mock.calls.length;
      expect(
        (
          await proxy(
            request("/api/internal/domains/resolve?host=victim.com", host),
          )
        ).status,
      ).toBe(404);
      expect(resolve.mock.calls.length).toBe(calls);
    },
  );
  it("serves login on the selected custom host without redirecting", async () => {
    const response = await proxy(request("/business/workspace-entry"));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("cache-control")).toBe("no-store, private");
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
  });
  it.each([
    "/api/platform/businesses",
    "/api/signup/email/request",
    "/api/auth/google/callback",
    "/join",
  ])("rejects private route %s", async (path) => {
    expect((await proxy(request(path))).status).toBe(404);
  });
  it.each([
    "/",
    "/linktree/menu?source=qr",
    "/business/workspace-entry",
    "/api/auth/profile",
  ])("disables the old address without redirecting: %s", async (path) => {
    resolve.mockResolvedValue({
      hostname: "wafaye.sponsor.krd",
      subdomain: "wafaye",
      primaryHostname: "wafaye.com",
      isCustom: false,
    });
    const response = await proxy(request(path, "wafaye.sponsor.krd"));
    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store, private");
    expect(response.headers.get("location")).toBeNull();
  });
  it("does not redirect to an authority supplied in the path", async () => {
    resolve.mockResolvedValue({
      hostname: "wafaye.sponsor.krd",
      subdomain: "wafaye",
      primaryHostname: "wafaye.com",
      isCustom: false,
    });
    const response = await proxy(
      request("//evil.com/path", "wafaye.sponsor.krd"),
    );
    expect(response.status).toBe(404);
    expect(response.headers.get("location")).toBeNull();
  });
  it("rejects unknown hosts and distinguishes resolver outages", async () => {
    resolve.mockResolvedValue(null);
    expect((await proxy(request("/"))).status).toBe(404);
    resolve.mockRejectedValue(new Error("offline"));
    expect((await proxy(request("/"))).status).toBe(503);
  });
  it("keeps the default domain as the only public address until custom activation", async () => {
    resolve.mockResolvedValue({
      hostname: "wafaye.com",
      subdomain: "wafaye",
      primaryHostname: null,
      isCustom: true,
    });
    const response = await proxy(request("/linktree/menu?source=qr"));
    expect(response.status).toBe(404);
    expect(response.headers.get("location")).toBeNull();
    resolve.mockResolvedValue({
      hostname: "wafaye.sponsor.krd",
      subdomain: "wafaye",
      primaryHostname: null,
      isCustom: false,
    });
    expect((await proxy(request("/", "wafaye.sponsor.krd"))).status).toBe(200);
  });
  it("restores the default website and rejects the removed custom mapping", async () => {
    resolve.mockResolvedValue(null);
    const restored = await proxy(
      request("/linktree/menu", "wafaye.sponsor.krd"),
    );
    expect(restored.status).toBe(200);
    expect(restored.headers.get("location")).toBeNull();
    expect((await proxy(request("/"))).status).toBe(404);
  });
  it("does not serve a second public address when domain resolution is unavailable", async () => {
    resolve.mockRejectedValue(new Error("offline"));
    const response = await proxy(request("/", "wafaye.sponsor.krd"));
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(
      (await proxy(request("/business/workspace-entry", "wafaye.sponsor.krd")))
        .status,
    ).toBe(503);
  });
  it.each([
    "/api/auth/profile",
    "/api/business/domains",
    "/api/analytics/v2/dashboard",
    "/api/auth/email/request",
  ])("permits business APIs on the selected host: %s", async (path) => {
    expect((await proxy(request(path))).status).toBe(200);
  });
  it("requires a session before rendering custom-domain settings", async () => {
    expect((await proxy(request("/business/settings"))).status).toBe(404);
    const authenticated = new NextRequest(
      "https://wafaye.com/business/settings",
      {
        headers: { host: "wafaye.com", cookie: "business_session=token" },
      },
    );
    expect((await proxy(authenticated)).status).toBe(200);
  });
});
