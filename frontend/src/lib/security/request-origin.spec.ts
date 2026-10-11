import { describe, expect, it } from "vitest";
import {
  isAuthenticatedMutation,
  hasAuthenticatedSessionCookie,
  isSameOriginBrowserRequest,
  browserRequestProtocol,
} from "@/lib/security/request-origin";

describe("request origin protection", () => {
  it("uses the same HTTPS scheme for checking and forwarding proxy chains", () => {
    expect(browserRequestProtocol("http://localhost:3011/api/test", "HTTPS, http")).toBe("https");
    expect(isSameOriginBrowserRequest("http://localhost:3011/api/test", "https://sponsor.krd", null,
      "sponsor.krd", null, "HTTPS, http")).toBe(true);
    expect(browserRequestProtocol("http://localhost:3011/api/test", "invalid")).toBeNull();
  });
  it.each(["", "https://tenant.example.com/", "https://tenant.example.com/path", "https://user@tenant.example.com",
    "https://tenant.example.com, https://evil.example", "https://tenant.example.com#fragment"])("rejects malformed Origin %s instead of matching a parsed prefix", (source) => {
    expect(isSameOriginBrowserRequest("https://tenant.example.com/api/test", source, "https://tenant.example.com/page")).toBe(false);
  });
  it("continues accepting a same-origin Referer with a page path", () => {
    expect(isSameOriginBrowserRequest("https://tenant.example.com/api/test", null, "https://tenant.example.com/page?tab=1")).toBe(true);
  });
  it("recognizes authenticated read cookies independently of method for origin enforcement", () => {
    expect(hasAuthenticatedSessionCookie("business_session=token")).toBe(true);
    expect(hasAuthenticatedSessionCookie("not_business_session=token")).toBe(
      false,
    );
  });
  it("identifies authenticated state-changing requests", () => {
    expect(isAuthenticatedMutation("POST", "business_session=token")).toBe(
      true,
    );
    expect(
      isAuthenticatedMutation("PATCH", "other=x; platform_admin_session=token"),
    ).toBe(true);
    expect(isAuthenticatedMutation("GET", "business_session=token")).toBe(
      false,
    );
    expect(isAuthenticatedMutation("POST", null)).toBe(false);
  });

  it("recognises every session cookie that can authenticate a mutation", () => {
    expect(isAuthenticatedMutation("PATCH", "signup_session=token")).toBe(true);
    expect(isAuthenticatedMutation("GET", "signup_session=token")).toBe(false);
    expect(isAuthenticatedMutation("PUT", "business_session=token")).toBe(true);
    expect(
      isAuthenticatedMutation(
        "DELETE",
        "theme=dark; platform_admin_session=token",
      ),
    ).toBe(true);
    expect(isAuthenticatedMutation("GET", "business_session=token")).toBe(
      false,
    );
  });

  /** A name that merely ends with a known one is a different cookie. */
  it("matches whole cookie names only", () => {
    expect(isAuthenticatedMutation("POST", "not_business_session=token")).toBe(
      false,
    );
    expect(isAuthenticatedMutation("POST", "xbusiness_session=token")).toBe(
      false,
    );
    expect(isAuthenticatedMutation("POST", "business_session_hint=1")).toBe(
      false,
    );
  });

  it("accepts same-origin browser requests and server requests without origin headers", () => {
    expect(
      isSameOriginBrowserRequest(
        "https://tenant.example.com/api/test",
        "https://tenant.example.com",
        null,
      ),
    ).toBe(true);
    expect(
      isSameOriginBrowserRequest(
        "https://tenant.example.com/api/test",
        null,
        null,
      ),
    ).toBe(true);
  });

  it("uses the browser-facing host when Next.js has an internal request URL", () => {
    expect(
      isSameOriginBrowserRequest(
        "http://localhost:3011/api/platform/auth/login",
        "http://lvh.me:3011",
        null,
        "lvh.me:3011",
      ),
    ).toBe(true);

    expect(
      isSameOriginBrowserRequest(
        "http://localhost:3011/api/platform/auth/login",
        "https://example.com",
        null,
        "localhost:3011",
        "app.example.com",
        "https",
      ),
    ).toBe(false);
  });

  it("honors a forwarded HTTPS protocol for reverse-proxied requests", () => {
    expect(
      isSameOriginBrowserRequest(
        "http://localhost:3011/api/test",
        "https://app.example.com",
        null,
        "app.example.com",
        null,
        "https",
      ),
    ).toBe(true);
  });

  it("rejects cross-origin, opaque, and malformed browser origins", () => {
    expect(
      isSameOriginBrowserRequest(
        "https://tenant.example.com/api/test",
        "https://evil.example",
        null,
      ),
    ).toBe(false);
    expect(
      isSameOriginBrowserRequest(
        "https://tenant.example.com/api/test",
        "null",
        null,
      ),
    ).toBe(false);
    expect(
      isSameOriginBrowserRequest(
        "https://tenant.example.com/api/test",
        "not-a-url",
        null,
      ),
    ).toBe(false);
  });
});
