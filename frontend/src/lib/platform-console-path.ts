/** The configured browser route is shared by routing and installed-app metadata. */
export function platformConsolePath(): string | null {
  const segment = (process.env.PLATFORM_ADMIN_PATH || "")
    .trim().replace(/^\/+|\/+$/g, "");
  if (/^[a-zA-Z0-9_-]{20,}$/.test(segment)) return `/${segment}`;
  return process.env.NODE_ENV === "development" ? "/platform-console" : null;
}
