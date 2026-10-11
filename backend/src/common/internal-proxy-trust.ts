import { timingSafeEqual } from 'crypto';
import type { IncomingHttpHeaders } from 'http';

/**
 * Verifies that a subdomain claimed by an inbound `x-subdomain` header
 * actually came from a trusted internal caller (the Next.js proxy) rather
 * than an external client.
 *
 * `x-subdomain` alone is not a security boundary: Caddy strips it from
 * inbound traffic before forwarding, but that protection lives entirely in
 * infrastructure configuration, not in this process. A client that reaches
 * the backend directly — a misconfigured port, an internal network path, or
 * local development without Caddy in front — could otherwise set
 * `x-subdomain: victim-tenant` and have `BusinessGuard` treat it as
 * authoritative, letting a session issued for one tenant pass the subdomain
 * check for another.
 *
 * The proxy sends this key alongside `x-subdomain` on every forwarded
 * request (see `frontend/src/proxy.ts` and
 * `frontend/src/app/api/[...path]/route.ts`). The header is trusted only
 * when this comparison succeeds; otherwise callers fall back to parsing the
 * `Host` header directly, which cannot be forged into a different tenant
 * without also forging DNS/TLS for that tenant's subdomain.
 *
 * Uses `INTERNAL_PROXY_SECRET` with `SESSION_SECRET` as the rollout fallback.
 */
export function isTrustedInternalProxy(receivedKey: unknown): boolean {
  const expected =
    process.env.INTERNAL_PROXY_SECRET || process.env.SESSION_SECRET || '';
  const received = typeof receivedKey === 'string' ? receivedKey : '';
  if (!expected || !received) return false;

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

/** Header name the internal proxy trust check reads. */
export const INTERNAL_PROXY_KEY_HEADER = 'x-tenant-proxy-key';

/** Fetch runtimes may replace Host with the upstream authority. */
export const INTERNAL_PROXY_HOST_HEADER = 'x-tenant-proxy-host';

/** False means authenticated host metadata is malformed and must be rejected. */
export function restoreTrustedProxyHost(request: {
  headers: IncomingHttpHeaders;
}): boolean {
  // Legacy internal calls need no override; never trust unsigned metadata.
  if (request.headers[INTERNAL_PROXY_HOST_HEADER] === undefined) return true;
  if (!isTrustedInternalProxy(request.headers[INTERNAL_PROXY_KEY_HEADER]))
    return true;
  const authority = request.headers[INTERNAL_PROXY_HOST_HEADER];
  if (
    typeof authority !== 'string' ||
    authority.length > 260 ||
    !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.?(?::\d{1,5})?$/i.test(
      authority,
    )
  )
    return false;
  try {
    // Reject invalid ports and URL syntax; preserve explicit browser ports.
    new URL(`http://${authority}`);
    request.headers.host = authority.toLowerCase();
    return true;
  } catch {
    return false;
  }
}
