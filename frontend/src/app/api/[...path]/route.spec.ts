import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
const { resolveDomain } = vi.hoisted(() => ({ resolveDomain: vi.fn() }));
vi.mock("@/lib/public/domain-routing", () => ({
  resolveBusinessHost: resolveDomain,
}));

describe("API proxy redirects", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resolveDomain.mockReset();
    resolveDomain.mockResolvedValue(null);
  });
  it.each([
    ["internal", "domains", "resolve"],
    ["internal/domains/tls"],
    ["internal%2fdomains%2fresolve"],
    ["signup", "..", "internal", "domains", "resolve"],
  ])(
    "does not forward internal endpoints or attach internal credentials: %j",
    async (...path) => {
      const fetchMock = vi.spyOn(globalThis, "fetch");
      const response = await GET(
        new NextRequest("http://localhost:3011/api/internal/domains/resolve"),
        {
          params: Promise.resolve({ path }),
        },
      );
      expect(response.status).toBe(404);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("returns backend OAuth redirects to the browser without following them", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: "https://accounts.google.com/o/oauth2/v2/auth" },
      }),
    );

    const response = await GET(
      new NextRequest(
        "http://localhost:3011/api/signup/google/start?invite=token",
      ),
      { params: Promise.resolve({ path: ["signup", "google", "start"] }) },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/signup/google/start?invite=token",
      expect.objectContaining({ redirect: "manual" }),
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
  });
  it("rejects cross-origin signup mutations before forwarding", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const response = await POST(
      new NextRequest("https://sponsor.krd/api/signup/application/submit", {
        method: "POST",
        headers: {
          host: "sponsor.krd",
          cookie: "signup_session=token",
          origin: "https://attacker.sponsor.krd",
        },
      }),
      {
        params: Promise.resolve({ path: ["signup", "application", "submit"] }),
      },
    );
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("forwards the custom hostname and verified tenant for business APIs", async () => {
    resolveDomain.mockResolvedValue({
      hostname: "zhirsaz.com",
      primaryHostname: "zhirsaz.com",
      subdomain: "eso",
      isCustom: true,
    });
    const upstream = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));
    const response = await GET(
      new NextRequest("https://zhirsaz.com/api/auth/profile", {
        headers: {
          host: "zhirsaz.com",
          "x-subdomain": "victim",
          cookie: "business_session=token",
        },
      }),
      { params: Promise.resolve({ path: ["auth", "profile"] }) },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store, private");
    const headers = upstream.mock.calls[0][1]?.headers as Headers;
    expect(headers.get("host")).toBe("zhirsaz.com");
    expect(headers.get("x-subdomain")).toBe("eso");
    expect(headers.get("cookie")).toBe("business_session=token");
    expect(headers.get("x-forwarded-proto")).toBe("https");
  });
  it.each([
    "platform/businesses",
    "signup/email/request",
    "auth/google/callback",
  ])(
    "blocks %s on customer and default tenant hosts before forwarding",
    async (path) => {
      resolveDomain.mockResolvedValue({
        hostname: "zhirsaz.com",
        primaryHostname: "zhirsaz.com",
        subdomain: "eso",
        isCustom: true,
      });
      const upstream = vi.spyOn(globalThis, "fetch");
      for (const host of ["zhirsaz.com", "eso.localhost"]) {
        const response = await GET(
          new NextRequest(`https://${host}/api/${path}`, { headers: { host } }),
          { params: Promise.resolve({ path: path.split("/") }) },
        );
        expect(response.status).toBe(404);
        expect(response.headers.get("cache-control")).toBe("no-store, private");
      }
      expect(upstream).not.toHaveBeenCalled();
    },
  );
  it("rejects cross-origin custom dashboard mutations before resolving or forwarding", async () => {
    const upstream = vi.spyOn(globalThis, "fetch");
    const response = await POST(
      new NextRequest("https://zhirsaz.com/api/auth/logout", {
        method: "POST",
        headers: {
          host: "zhirsaz.com",
          origin: "https://evil.com",
          cookie: "business_session=token",
        },
      }),
      { params: Promise.resolve({ path: ["auth", "logout"] }) },
    );
    expect(response.status).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
    expect(resolveDomain).not.toHaveBeenCalled();
  });
  it("rejects cross-origin authenticated reads despite an admitted customer CORS origin", async () => {
    const upstream = vi.spyOn(globalThis, "fetch");
    const response = await GET(
      new NextRequest("https://zhirsaz.com/api/auth/profile", {
        headers: {
          host: "zhirsaz.com",
          origin: "https://another-business.com",
          cookie: "business_session=token",
        },
      }),
      { params: Promise.resolve({ path: ["auth", "profile"] }) },
    );
    expect(response.status).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
    expect(resolveDomain).not.toHaveBeenCalled();
  });
});
