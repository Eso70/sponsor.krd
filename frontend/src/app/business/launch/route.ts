import { getAppBaseUrl } from "@/lib/utils/app-url";
import { NextRequest, NextResponse } from "next/server";
import { INTERNAL_PROXY_KEY_HEADER, internalProxyKey } from "@/lib/security/internal-proxy-key";

/** Public entry only; BusinessGuard verifies the host-bound session before launch. */
export async function GET(request: NextRequest) {
  const token = request.cookies.get("business_session")?.value;
  let target = "/business/workspace-entry";
  if (token) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/auth/session`, {
        headers: {
          Cookie: `business_session=${token}`,
          "x-subdomain": request.headers.get("x-subdomain") || "",
          [INTERNAL_PROXY_KEY_HEADER]: internalProxyKey() || "",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) target = "/business/pages";
      else if (response.status !== 401 && response.status !== 403) {
        console.error("[dashboard-launch] Session service unavailable", response.status);
        return unavailable();
      }
    } catch {
      console.error("[dashboard-launch] Session service unreachable");
      return unavailable();
    }
  }
  // Next's route URL may contain the internal server hostname behind a proxy.
  // The routing proxy has already verified Host and the tenant's selected domain.
  const protocol = new URL(getAppBaseUrl()).protocol;
  const host = request.headers.get("host") || new URL(request.url).host;
  const destination = new URL(target, `${protocol}//${host}`);
  const response = NextResponse.redirect(destination, 307);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  if (token && target.endsWith("workspace-entry")) response.cookies.delete("business_session");
  return response;
}

function unavailable() {
  return new Response("Dashboard temporarily unavailable. Please try again.", {
    status: 503,
    headers: { "Cache-Control": "private, no-store", "Retry-After": "30", "X-Robots-Tag": "noindex, nofollow" },
  });
}
