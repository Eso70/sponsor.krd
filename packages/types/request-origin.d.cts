export const SESSION_COOKIE_NAMES: readonly string[];
export function isSafeRequestMethod(method: string): boolean;
export function browserOrigin(host: unknown, protocol: string): string | null;
export function isSameOriginSource(
  origin: unknown, referer: unknown, expectedOrigin: string | null,
): boolean;
