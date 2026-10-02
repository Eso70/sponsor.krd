import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createContentSecurityPolicy } from "@/lib/security/content-security-policy";
import { resolveLinktreeHost } from "@/lib/public/linktree-host";
import { resolvePublicOrigin } from "@/lib/public/public-origin";
import { getAppBaseUrl } from "@/lib/utils/app-url";
import {
  INTERNAL_PROXY_KEY_HEADER,
  internalProxyKey,
} from "@/lib/security/internal-proxy-key";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost";
const PLATFORM_ADMIN_PATH = normalizePrivatePath(
  process.env.PLATFORM_ADMIN_PATH,
);
function normalizePrivatePath(value: string | undefined): string {
  const normalized = (value || "").trim().replace(/^\/+|\/+$/g, "");
  if (!/^[a-zA-Z0-9_-]{20,}$/.test(normalized)) {
    return process.env.NODE_ENV === "development" ? "/platform-console" : "";
  }
  return `/${normalized}`;
}

function isPlatformAdminPath(pathname: string): boolean {
  return (
    !!PLATFORM_ADMIN_PATH &&
    (pathname === PLATFORM_ADMIN_PATH ||
      pathname.startsWith(`${PLATFORM_ADMIN_PATH}/`))
  );
}

function extractSubdomain(hostHeader: string): string {
  return resolveLinktreeHost(hostHeader, ROOT_DOMAIN).subdomain;
}

function withCsp(response: NextResponse, csp: string): NextResponse {
  response.headers.set("Content-Security-Policy", csp);
  if (response.status >= 400) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

function createRedirect(
  request: NextRequest,
  loginPath: string,
  cookieName: string,
  csp: string,
): NextResponse {
  const loginUrl = new URL(loginPath, request.url);
  const response = NextResponse.redirect(loginUrl);

  response.cookies.set(cookieName, "", {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

  return withCsp(response, csp);
}

function rewriteNotFound(
  request: NextRequest,
  targetPath: string,
  requestHeaders: Headers,
  csp: string,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = targetPath;
  url.search = "";
  return withCsp(
    NextResponse.rewrite(url, {
      status: 404,
      request: { headers: requestHeaders },
    }),
    csp,
  );
}

/**
 * Checks page-request subdomains; backend guards validate API tenants directly.
 * Result is NOT cached — each request to an business-prefixed route validates it.
 * This is a lightweight single-row DB lookup on an indexed column.
 */
async function isRegisteredSubdomain(
  backendUrl: string,
  subdomain: string,
): Promise<boolean | null> {
  if (!subdomain) return false;
  try {
    const res = await fetch(`${backendUrl}/api/auth/subdomain-check`, {
      headers: {
        "x-subdomain": subdomain,
        [INTERNAL_PROXY_KEY_HEADER]: internalProxyKey() || "",
        "x-middleware-check": "1",
      },
      // No cache - we need live data so deleted businesses are locked out immediately
      cache: "no-store",
      signal: AbortSignal.timeout(2_500),
    });
    if (res.ok) return true;
    if (res.status === 404) return false;
    return null;
  } catch {
    // A transient backend failure is not proof that the business disappeared.
    // Let the authenticated layout perform the definitive session check.
    return null;
  }
}

async function publicPageAvailability(backendUrl: string, subdomain: string, identifier: string, clientIp: string): Promise<{ status: number; slug?: string }> {
  try {
    const response = await fetch(`${backendUrl}/api/public/linktree-status/${encodeURIComponent(identifier)}`, {
      headers: { "x-subdomain": subdomain, [INTERNAL_PROXY_KEY_HEADER]: internalProxyKey() || "", "x-forwarded-for": clientIp },
      cache: "no-store", signal: AbortSignal.timeout(5_000),
    });
    if (response.ok) {
      const body = await response.json() as { data?: { slug?: string } };
      return { status: 200, slug: body.data?.slug };
    }
    return { status: [400, 403, 404, 410].includes(response.status) ? 404 : 503 };
  } catch { return { status: 503 }; }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const nonce = crypto.randomUUID();
  const csp = createContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-subdomain");
  requestHeaders.delete(INTERNAL_PROXY_KEY_HEADER);
  requestHeaders.set("x-public-path", pathname);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  if (
    pathname.startsWith("/__public-not-found") ||
    pathname.startsWith("/__root-not-found")
  ) {
    return withCsp(
      NextResponse.next({ request: { headers: requestHeaders } }),
      csp,
    );
  }

  // Extract subdomain
  const subdomain = extractSubdomain(host);
  const scope = resolveLinktreeHost(host, ROOT_DOMAIN);
  if (!scope.isPlatformRoot && !scope.subdomain) {
    return rewriteNotFound(request, "/__root-not-found", requestHeaders, csp);
  }
  const rootHostname = ROOT_DOMAIN.split(":")[0].toLowerCase().replace(/\.$/, "");
  if (host.split(":")[0].toLowerCase().replace(/\.$/, "") === `www.${rootHostname}`) {
    const context = resolvePublicOrigin(host, ROOT_DOMAIN, getAppBaseUrl());
    if (context) return withCsp(NextResponse.redirect(new URL(`${pathname}${request.nextUrl.search}`, context.origin), 308), csp);
  }

  // Block unregistered subdomains entirely
  if (
    subdomain &&
    subdomain !== "www" &&
    pathname !== "/api" &&
    !pathname.startsWith("/api/")
  ) {
    const registered = await isRegisteredSubdomain(backendUrl, subdomain);
    if (registered === false) {
      return rewriteNotFound(
        request,
        "/__public-not-found",
        requestHeaders,
        csp,
      );
    }
  }

  // Set subdomain header for downstream handlers
  if (subdomain) {
    requestHeaders.set("x-subdomain", subdomain);
    const proxyKey = internalProxyKey();
    if (proxyKey) {
      requestHeaders.set(INTERNAL_PROXY_KEY_HEADER, proxyKey);
    }
  }

  if (subdomain && isPlatformAdminPath(pathname)) {
    return rewriteNotFound(request, "/__public-not-found", requestHeaders, csp);
  }

  const publicPageMatch = pathname.match(/^\/linktree\/([a-z0-9-]{1,50})(?:\/share-image)?\/?$/);
  if ((pathname === "/linktree" || pathname.startsWith("/linktree/")) && !publicPageMatch) {
    return rewriteNotFound(request, "/__public-not-found", requestHeaders, csp);
  }
  if (publicPageMatch) {
    const availability = await publicPageAvailability(backendUrl, subdomain, publicPageMatch[1],
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "");
    const { status, slug } = availability;
    if (status === 404) return rewriteNotFound(request, "/__public-not-found", requestHeaders, csp);
    if (status === 503) {
      const url = request.nextUrl.clone(); url.pathname = "/status/unavailable"; url.search = "";
      const response = NextResponse.rewrite(url, { status: 503, request: { headers: requestHeaders } });
      response.headers.set("Retry-After", "60");
      response.headers.set("Cache-Control", "no-store");
      return withCsp(response, csp);
    }
    if (slug && /^[a-z0-9-]{1,50}$/.test(slug) && slug !== publicPageMatch[1]) {
      const context = resolvePublicOrigin(host, ROOT_DOMAIN, getAppBaseUrl());
      if (context) {
        const suffix = /\/share-image\/?$/.test(pathname) ? "/share-image" : "";
        return withCsp(NextResponse.redirect(new URL(`/linktree/${slug}${suffix}${request.nextUrl.search}`, context.origin), 308), csp);
      }
    }
  }

  // ── Route blocking: root domain (no subdomain) + /business/* → 404 ──────────
  if (!subdomain && pathname.startsWith("/business")) {
    return rewriteNotFound(request, "/__root-not-found", requestHeaders, csp);
  }

  // ── Business routes on a subdomain ──────────────────────────────────────────
  if (subdomain && pathname.startsWith("/business")) {
    // Only the explicit workspace entry and the single-use OAuth handoff are
    // public. Protected routes disclose nothing when no session is present.
    if (
      pathname !== "/business/workspace-entry" &&
      !pathname.startsWith("/business/auth/consume")
    ) {
      const sessionToken = request.cookies.get("business_session")?.value;
      if (!sessionToken) {
        return rewriteNotFound(
          request,
          "/__public-not-found",
          requestHeaders,
          csp,
        );
      }
      // Session validity is enforced by BusinessGuard on the backend for every API call.
      // The session polling in BusinessDashboard handles the kicked-out-while-active case.
    }
  }

  if (!subdomain && pathname.startsWith("/join")) {
    if (
      pathname.startsWith("/join/application") &&
      !request.cookies.get("signup_session")?.value
    ) {
      return rewriteNotFound(request, "/__root-not-found", requestHeaders, csp);
    }
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set("Cache-Control", "no-store, private");
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return withCsp(response, csp);
  }

  // Protect and internally rewrite the configured platform console route.
  if (!subdomain && isPlatformAdminPath(pathname)) {
    const isLoginPath = pathname === `${PLATFORM_ADMIN_PATH}/login`;
    const sessionToken = request.cookies.get("platform_admin_session")?.value;

    if (!isLoginPath) {
      if (!sessionToken) {
        return createRedirect(
          request,
          `${PLATFORM_ADMIN_PATH}/login`,
          "platform_admin_session",
          csp,
        );
      }

      try {
        const res = await fetch(`${backendUrl}/api/platform/auth/profile`, {
          headers: {
            Cookie: `platform_admin_session=${sessionToken}`,
            "x-subdomain": "",
          },
        });
        if (!res.ok)
          return createRedirect(
            request,
            `${PLATFORM_ADMIN_PATH}/login`,
            "platform_admin_session",
            csp,
          );
      } catch {
        return createRedirect(
          request,
          `${PLATFORM_ADMIN_PATH}/login`,
          "platform_admin_session",
          csp,
        );
      }
    }

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set("Cache-Control", "no-store, private");
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return withCsp(response, csp);
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (pathname.startsWith("/business") || pathname.startsWith("/api") ||
      (subdomain && pathname === "/") || pathname.startsWith("/advertising")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  return withCsp(response, csp);
}

export const config = {
  matcher: [
    "/business/:path*",
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|images|fonts|cursors).*)",
  ],
};
