// @vitest-environment node

import { NextRequest } from "next/server";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("@/lib/public/domain-routing", () => ({
  resolveBusinessHost: vi.fn().mockResolvedValue(null),
}));

const originalRootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
let proxy: typeof import("./proxy").proxy;

function request(path: string, session?: string) {
  return new NextRequest(`http://acme.localhost:3011${path}`, {
    headers: {
      host: "acme.localhost:3011",
      ...(session ? { cookie: `business_session=${session}` } : {}),
    },
  });
}

describe("business route protection", () => {
  beforeAll(async () => {
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = "localhost";
    vi.resetModules();
    ({ proxy } = await import("./proxy"));
  });

  afterAll(() => {
    if (originalRootDomain === undefined) {
      delete process.env.NEXT_PUBLIC_ROOT_DOMAIN;
    } else {
      process.env.NEXT_PUBLIC_ROOT_DOMAIN = originalRootDomain;
    }
    vi.resetModules();
  });

  afterEach(() => vi.restoreAllMocks());
  it("keeps shared analytics private and allows registered tenant domains", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null));
    const path = "/analytics-share/11111111-1111-4111-8111-111111111111";
    const root = await proxy(
      new NextRequest(`http://localhost:3011${path}`, {
        headers: { host: "localhost:3011" },
      }),
    );
    expect(root.status).toBe(200);
    expect(root.headers.get("cache-control")).toContain("no-store");
    expect(root.headers.get("x-robots-tag")).toContain("noindex");
    expect(root.headers.get("referrer-policy")).toBe("no-referrer");
    const tenant = await proxy(request(path));
    expect(tenant.status).toBe(200);
    expect(tenant.headers.get("cache-control")).toContain("no-store");
    expect(tenant.headers.get("x-middleware-request-x-subdomain")).toBe("acme");
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(null, { status: 404 }),
    );
    expect((await proxy(request(path))).status).toBe(404);
  });

  it.each(["/business", "/business/pages", "/business/settings"])(
    "conceals unauthenticated route %s with a 404",
    async (path) => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null));

      const response = await proxy(request(path));

      expect(response.status).toBe(404);
      expect(response.headers.get("x-middleware-rewrite")).toContain(
        "/__public-not-found",
      );
      expect(response.headers.get("location")).toBeNull();
    },
  );

  it.each(["/advertising", "/advertising/video-code", "/business/advertising"])(
    "returns a real 404 for retired service path %s",
    async (path) => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null));
      const response = await proxy(request(path, "session"));
      expect(response.status).toBe(404);
      expect(response.headers.get("x-robots-tag")).toContain("noindex");
    },
  );

  it("keeps only the workspace entry route publicly reachable", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null));

    const response = await proxy(request("/business/workspace-entry"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
  });
  it.each([
    "/linktree/INVALID",
    "/linktree/" + "a".repeat(51),
    "/linktree/good/unknown",
  ])("rejects malformed public path %s before streaming", async (path) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null));
    const response = await proxy(request(path));
    expect(response.status).toBe(404);
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
  });
  it.each(["/form/INVALID", "/form/" + "a".repeat(81), "/form/good/unknown"])(
    "rejects malformed form path %s before streaming",
    async (path) => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null));
      expect((await proxy(request(path))).status).toBe(404);
    },
  );
  it.each([404, 403, 410])(
    "conceals unavailable public forms (%s) before streaming",
    async (status) => {
      const fetch = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(new Response(null))
        .mockResolvedValueOnce(new Response(null, { status }));
      const result = await proxy(request("/form/contact"));
      expect(result.status).toBe(404);
      expect(fetch).toHaveBeenLastCalledWith(
        expect.stringContaining("/api/public/forms/contact/status"),
        expect.objectContaining({ cache: "no-store" }),
      );
      expect(result.headers.get("x-robots-tag")).toContain("noindex");
    },
  );
  it("allows a published form and returns 503 for transient availability failures", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null))
      .mockResolvedValueOnce(Response.json({ data: { slug: "contact" } }));
    expect((await proxy(request("/form/contact"))).status).toBe(200);
    fetch
      .mockResolvedValueOnce(new Response(null))
      .mockResolvedValueOnce(new Response(null, { status: 500 }));
    expect((await proxy(request("/form/contact"))).status).toBe(503);
  });
  it("preserves the image suffix when redirecting a trailing-slash alias", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null))
      .mockResolvedValueOnce(Response.json({ data: { slug: "canonical" } }));
    const response = await proxy(request("/linktree/alias/share-image/"));
    expect(response.status).toBe(308);
    expect(new URL(response.headers.get("location")!).pathname).toBe(
      "/linktree/canonical/share-image",
    );
  });
});
