import { createHash } from 'node:crypto';

/** Only the browser receives the bearer token; persistence uses its digest. */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
