import type { PlatformLocale } from "./locale";

/** API error messages are not localized. Keep Arabic controls in one language. */
export function platformRequestError(
  message: unknown,
  fallback: string,
  locale: PlatformLocale,
): string {
  return locale !== "ckb" ? fallback : typeof message === "string" && message.trim() ? message : fallback;
}
