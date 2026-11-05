"use strict";

const SESSION_COOKIE_NAMES = Object.freeze([
  "business_session", "platform_admin_session", "signup_session",
]);
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function isSafeRequestMethod(method) {
  return SAFE_METHODS.has(method.toUpperCase());
}

function browserOrigin(host, protocol) {
  if (typeof host !== "string" || !/^[a-z0-9.-]+(?::\d{1,5})?$/i.test(host) ||
      (protocol !== "http" && protocol !== "https")) return null;
  try { return new URL(`${protocol}://${host}`).origin; } catch { return null; }
}

function isSameOriginSource(origin, referer, expectedOrigin) {
  const source = origin ?? referer;
  if (source === undefined || source === null) return true;
  if (typeof source !== "string" || !expectedOrigin) return false;
  try {
    const parsed = new URL(source);
    return !parsed.username && !parsed.password && !parsed.hash &&
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      (origin == null || parsed.origin === origin) &&
      parsed.origin === expectedOrigin;
  } catch { return false; }
}

module.exports = { SESSION_COOKIE_NAMES, isSafeRequestMethod, browserOrigin, isSameOriginSource };
