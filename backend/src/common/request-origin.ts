const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
/**
 * Every cookie that authenticates a mutation.
 *
 * A surface missing from this list gets no cross-origin rejection at all: the
 * request is not recognised as authenticated, so the same-origin check is
 * skipped rather than failed. Add the cookie here when a new authenticated
 * session type is introduced.
 */
const SESSION_COOKIE_NAMES = [
  'business_session',
  'platform_admin_session',
  'signup_session',
] as const;
type HeaderValue = string | string[] | undefined;

function firstHeaderValue(value: HeaderValue): string | undefined {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue?.split(',', 1)[0]?.trim() || undefined;
}

export function isAuthenticatedMutation(
  method: string,
  cookies: Record<string, string | undefined>,
): boolean {
  if (SAFE_METHODS.has(method.toUpperCase())) return false;
  return hasAuthenticatedSessionCookie(cookies);
}

export function hasAuthenticatedSessionCookie(
  cookies: Record<string, string | undefined>,
): boolean {
  return SESSION_COOKIE_NAMES.some((cookieName) => cookieName in cookies);
}

export function isSameOriginBrowserRequest(
  originHeader: HeaderValue,
  refererHeader: HeaderValue,
  hostHeader: HeaderValue,
  forwardedProtoHeader: HeaderValue,
  requestProtocol: string,
): boolean {
  const source = originHeader ?? refererHeader;
  if (source === undefined) return true;
  if (typeof source !== 'string') return false;
  if (source === 'null') return false;

  const host = typeof hostHeader === 'string' ? hostHeader : undefined;
  const protocol = firstHeaderValue(forwardedProtoHeader) ?? requestProtocol;
  if (
    !host ||
    !/^[a-z0-9.-]+(?::\d{1,5})?$/i.test(host) ||
    (protocol !== 'http' && protocol !== 'https')
  )
    return false;

  try {
    const sourceUrl = new URL(source);
    if (
      sourceUrl.username ||
      sourceUrl.password ||
      sourceUrl.hash ||
      !['http:', 'https:'].includes(sourceUrl.protocol) ||
      (originHeader !== undefined && sourceUrl.origin !== originHeader)
    )
      return false;
    return sourceUrl.origin === new URL(`${protocol}://${host}`).origin;
  } catch {
    return false;
  }
}
