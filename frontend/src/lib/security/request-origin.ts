const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Every cookie that authenticates a mutation.
 *
 * A surface missing here is not treated as authenticated, so the proxy skips
 * the same-origin check instead of failing it. Add the cookie when a new
 * session type is introduced; the backend keeps the matching list in
 * `common/request-origin.ts`.
 */
const SESSION_COOKIE_NAMES = [
  "business_session",
  "platform_admin_session",
  "signup_session",
] as const;

export function isAuthenticatedMutation(
  method: string,
  cookieHeader: string | null,
): boolean {
  if (SAFE_METHODS.has(method.toUpperCase())) return false;
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
  const source = originHeader ?? refererHeader;
  if (source === null) return true;
  if (source === "null") return false;

  try {
    const sourceUrl = new URL(source);
    if (sourceUrl.username || sourceUrl.password || sourceUrl.hash ||
      !["http:", "https:"].includes(sourceUrl.protocol) ||
      (originHeader !== null && sourceUrl.origin !== originHeader)) return false;
    const internalUrl = new URL(requestUrl);
    const publicHost =
      hostHeader || forwardedHostHeader;
    const publicProtocol = browserRequestProtocol(requestUrl, forwardedProtoHeader);
    if (!publicProtocol) return false;

    if (
      publicHost &&
      (publicProtocol === "http" || publicProtocol === "https")
    ) {
      return (
        /^[a-z0-9.-]+(?::\d{1,5})?$/i.test(publicHost) &&
        sourceUrl.origin ===
        new URL(`${publicProtocol}://${publicHost}`).origin
      );
    }

    return sourceUrl.origin === internalUrl.origin;
  } catch {
    return false;
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
