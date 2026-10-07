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
  it("keeps dashboard login on the business subdomain", async () => {
    const response = await proxy(request("/business/settings"));
    expect(response.headers.get("location")).toBe(
      "https://wafaye.sponsor.krd/business/workspace-entry",
    );
  });
  it.each([
    "/api/auth/profile",
    "/api/platform/businesses",
    "/api/business/domains",
    "/join",
  ])("rejects private route %s", async (path) => {
    expect((await proxy(request(path))).status).toBe(404);
  });
  it("redirects public aliases preserving path and query", async () => {
    resolve.mockResolvedValue({
      hostname: "wafaye.sponsor.krd",
      subdomain: "wafaye",
      primaryHostname: "wafaye.com",
      isCustom: false,
    });
    const response = await proxy(
      request("/linktree/menu?source=qr", "wafaye.sponsor.krd"),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://wafaye.com/linktree/menu?source=qr",
    );
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
    expect(new URL(response.headers.get("location")!).hostname).toBe(
      "wafaye.com",
    );
  });
  it("rejects unknown hosts and distinguishes resolver outages", async () => {
    resolve.mockResolvedValue(null);
    expect((await proxy(request("/"))).status).toBe(404);
    resolve.mockRejectedValue(new Error("offline"));
    expect((await proxy(request("/"))).status).toBe(503);
  });
});
