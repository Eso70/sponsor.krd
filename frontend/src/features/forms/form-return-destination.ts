export function formReturnDestination(referrer: string, pageUrl: string) {
  const page = new URL(pageUrl);
  if (referrer) {
    try {
      const source = new URL(referrer);
      if (
        (source.protocol === "https:" || source.protocol === "http:") &&
        !source.username &&
        !source.password &&
        !(source.origin === page.origin && source.pathname === page.pathname)
      ) {
        source.search = "";
        source.hash = "";
        return {
          href: source.href,
          kind:
            source.hostname === "tiktok.com" ||
            source.hostname.endsWith(".tiktok.com")
              ? ("tiktok" as const)
              : ("source" as const),
        };
      }
    } catch {
      /* A missing or unusable referrer uses the success-page fallback. */
    }
  }
  if (page.searchParams.get("utm_source")?.toLowerCase() === "tiktok")
    return { href: "https://www.tiktok.com/", kind: "open-tiktok" as const };
  return null;
}
