import { SESSION_COOKIE_NAMES, isSafeRequestMethod, browserOrigin, isSameOriginSource } from "@linktree/types/request-origin.cjs";

export function isAuthenticatedMutation(
  method: string,
  cookieHeader: string | null,
): boolean {
  if (isSafeRequestMethod(method)) return false;
  return hasAuthenticatedSessionCookie(cookieHeader);
}

export function hasAuthenticatedSessionCookie(
  cookieHeader: string | null,
): boolean {
  // Split rather than match: a name built into a `RegExp` has to be escaped,
  // and a template literal silently eats the `\s` that made the old pattern
  // read as whitespace.
  const present = new Set(
    (cookieHeader || "")
      .split(";")
      .map((pair) => pair.split("=", 1)[0]?.trim())
      .filter(Boolean),
  );
  return SESSION_COOKIE_NAMES.some((cookieName) => present.has(cookieName));
}

export function isSameOriginBrowserRequest(
  requestUrl: string,
  originHeader: string | null,
  refererHeader: string | null,
  hostHeader?: string | null,
  forwardedHostHeader?: string | null,
  forwardedProtoHeader?: string | null,
): boolean {
  try {
    const publicHost = hostHeader || forwardedHostHeader;
    const protocol = browserRequestProtocol(requestUrl, forwardedProtoHeader);
    const expectedOrigin = publicHost
      ? browserOrigin(publicHost, protocol || "")
      : protocol ? new URL(requestUrl).origin : null;
    return isSameOriginSource(originHeader, refererHeader, expectedOrigin);
  } catch {
    return originHeader === null && refererHeader === null;
  }
}

/** The origin check and the upstream request must use the same scheme. */
export function browserRequestProtocol(
  requestUrl: string,
  forwardedProtoHeader?: string | null,
): "http" | "https" | null {
  try {
    const protocol = forwardedProtoHeader === null || forwardedProtoHeader === undefined
      ? new URL(requestUrl).protocol.slice(0, -1)
      : firstForwardedValue(forwardedProtoHeader);
    return protocol === "http" || protocol === "https" ? protocol : null;
  } catch {
    return null;
  }
}

function firstForwardedValue(value: string | null | undefined): string {
  return value?.split(",", 1)[0]?.trim().toLowerCase() || "";
}
