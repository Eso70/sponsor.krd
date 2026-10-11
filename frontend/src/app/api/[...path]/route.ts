import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const configuredMaxFileSizeMb = Number(process.env.MAX_FILE_SIZE_MB || 10);
const MAX_REQUEST_BYTES =
  (Number.isFinite(configuredMaxFileSizeMb) && configuredMaxFileSizeMb > 0
    ? configuredMaxFileSizeMb
    : 10) *
  1024 *
  1024;
import {
  isAuthenticatedMutation,
  hasAuthenticatedSessionCookie,
  isSameOriginBrowserRequest,
  browserRequestProtocol,
} from "@/lib/security/request-origin";
import { extractSubdomain } from "@/lib/subdomain-utils";
import { resolveBusinessHost } from "@/lib/public/domain-routing";
import { resolveLinktreeHost } from "@/lib/public/linktree-host";
import { classifyUpstreamFailure } from "@/lib/api/upstream-failure";
import {
  INTERNAL_PROXY_KEY_HEADER,
  INTERNAL_PROXY_HOST_HEADER,
  internalProxyKey,
} from "@/lib/security/internal-proxy-key";

/**
 * Catch-all API proxy route handler.
 * Forwards all /api/* requests to the NestJS backend with proper headers:
 * - Forwards cookies (business_session, platform_admin_session)
 * - Adds x-subdomain header extracted from host
 * - Passes through Set-Cookie headers from backend responses
 */

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const pathname = `/api/${path.join("/")}`;
  const url = new URL(pathname + request.nextUrl.search, BACKEND_URL);
  // Normalize before checking: decoded route parameters can contain encoded
  // slashes or dot segments. Never lend internal proxy credentials to a browser.
  let normalizedPath: string;
  try {
    normalizedPath = new URL(decodeURIComponent(url.pathname), BACKEND_URL)
      .pathname;
  } catch {
    return NextResponse.json({ message: "Not Found" }, { status: 404 });
  }
  if (
    !normalizedPath.startsWith("/api/") ||
    /^\/api\/internal(?:\/|$)/.test(normalizedPath)
  ) {
    return NextResponse.json({ message: "Not Found" }, { status: 404 });
  }

  const host = request.headers.get("host") || request.nextUrl.host;
  const publicProtocol = browserRequestProtocol(request.url, request.headers.get("x-forwarded-proto"));
  if (!publicProtocol) {
    return NextResponse.json({ message: "Invalid request protocol" }, { status: 400 });
  }
  const cookieHeader = request.headers.get("cookie");
  if (
    (isAuthenticatedMutation(request.method, cookieHeader) ||
      (!!request.headers.get("origin") &&
        hasAuthenticatedSessionCookie(cookieHeader))) &&
    !isSameOriginBrowserRequest(
      request.url,
      request.headers.get("origin"),
      request.headers.get("referer"),
      host,
      request.headers.get("x-forwarded-host"),
      request.headers.get("x-forwarded-proto"),
    )
  ) {
    return NextResponse.json(
      { message: "Invalid request origin" },
      { status: 403 },
    );
  }
  let subdomain = extractSubdomain(
    host,
    undefined,
    process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost",
  );
  const scope = resolveLinktreeHost(
    host,
    process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost",
  );
  if (!scope.isPlatformRoot) {
    if (
      /^\/api\/(?:platform|signup)(?:\/|$)/.test(normalizedPath) ||
      normalizedPath === "/api/auth/google/callback"
    )
      return NextResponse.json({ message: "Not Found" }, { status: 404 });
    try {
      const domain = await resolveBusinessHost(host);
      if (domain?.isCustom) {
        if (domain.primaryHostname !== domain.hostname)
          return NextResponse.json({ message: "Not Found" }, { status: 404 });
        subdomain = domain.subdomain;
      } else if (!scope.subdomain || domain?.primaryHostname) {
        return NextResponse.json({ message: "Not Found" }, { status: 404 });
      }
    } catch {
      return NextResponse.json(
        { message: "Temporarily unavailable" },
        { status: 503 },
      );
    }
  }
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return payloadTooLargeResponse();
  }

  // Build headers to forward
  const headers = new Headers();
  headers.set("host", host);
  headers.set("x-forwarded-proto", publicProtocol);
  for (const name of ["origin", "referer"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("x-subdomain", subdomain);
  const proxyKey = internalProxyKey();
  if (proxyKey) {
    headers.set(INTERNAL_PROXY_KEY_HEADER, proxyKey);
    headers.set(INTERNAL_PROXY_HOST_HEADER, host);
  }
  headers.set(
    "x-forwarded-for",
    request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1",
  );
  headers.set("user-agent", request.headers.get("user-agent") || "");

  // Forward content-type if present
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }

  // Forward cookies
  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  // Build fetch options
  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
  };

  // Forward body for non-GET/HEAD requests
  if (request.method !== "GET" && request.method !== "HEAD") {
    const body = await request.arrayBuffer();
    if (body.byteLength > MAX_REQUEST_BYTES) {
      return payloadTooLargeResponse();
    }
    fetchOptions.body = body;
  }

  const controller = new AbortController();
  const isAuthenticationRequest =
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/signup/") ||
    pathname.startsWith("/api/platform/auth/");
  const timeout = setTimeout(
    () => controller.abort(),
    isAuthenticationRequest ? 8_000 : 30_000,
  );

  try {
    console.log(
      `[API PROXY] ${request.method} ${pathname} -> subdomain: "${subdomain}", has cookie: ${!!cookieHeader}`,
    );

    const backendRes = await fetch(url.toString(), {
      ...fetchOptions,
      signal: controller.signal,
      redirect: "manual",
    });

    if (backendRes.status === 401) {
      console.log(`[API PROXY] 401 Unauthorized for ${pathname}`);
    }

    // Build response
    const responseBody = await backendRes.arrayBuffer();
    const response = new NextResponse(responseBody, {
      status: backendRes.status,
      statusText: backendRes.statusText,
    });

    // Copy response headers
    backendRes.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "transfer-encoding") {
        response.headers.set(key, value);
      }
    });
    // Forward Set-Cookie headers
    const setCookieHeaders = backendRes.headers.getSetCookie();
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      // Clear any existing set-cookie header first
      response.headers.delete("set-cookie");
      for (const cookie of setCookieHeaders) {
        response.headers.append("set-cookie", cookie);
      }
    }

    return response;
  } catch (error) {
    console.error("[API PROXY] Error:", error);
    const failure = classifyUpstreamFailure(error);
    return NextResponse.json(
      { message: failure.message },
      { status: failure.status },
    );
  } finally {
    clearTimeout(timeout);
  }
}

function payloadTooLargeResponse() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Request body exceeds the allowed size",
      },
      statusCode: 413,
      code: "PAYLOAD_TOO_LARGE",
      message: "Request body exceeds the allowed size",
    },
    { status: 413 },
  );
}

async function handleRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const response = await proxyRequest(request, context);
  // Also protect failures generated before any upstream response exists.
  response.headers.set("Cache-Control", "no-store, private");
  return response;
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
