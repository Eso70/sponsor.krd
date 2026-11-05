import {
  SESSION_COOKIE_NAMES,
  isSafeRequestMethod,
  browserOrigin,
  isSameOriginSource,
} from '@linktree/types/request-origin.cjs';

type HeaderValue = string | string[] | undefined;

function firstHeaderValue(value: HeaderValue): string | undefined {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue?.split(',', 1)[0]?.trim() || undefined;
}

export function isAuthenticatedMutation(
  method: string,
  cookies: Record<string, string | undefined>,
): boolean {
  if (isSafeRequestMethod(method)) return false;
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
  const protocol = firstHeaderValue(forwardedProtoHeader) ?? requestProtocol;
  return isSameOriginSource(
    originHeader,
    refererHeader,
    browserOrigin(hostHeader, protocol),
  );
}
