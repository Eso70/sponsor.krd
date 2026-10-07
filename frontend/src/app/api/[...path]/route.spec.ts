import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

describe("API proxy redirects", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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
});
