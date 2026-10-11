import { resolveLinktreeHost } from "@/lib/public/linktree-host";

function getLocalBaseUrl(): string {
  const port = process.env.PORT || 3011;
  return `http://localhost:${port}`;
}

/**
 * The scheme absolute URLs should be built with on the server.
 *
 * Taken from the configured application URL rather than assumed to be https,
 * because local development is served over plain http and a hardcoded https
 * link is simply unreachable there.
 */
function getAppProtocol(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl?.startsWith("http://")) return "http:";
  if (appUrl?.startsWith("https://")) return "https:";
  return process.env.NODE_ENV === "production" ? "https:" : "http:";
}

export function getAppBaseUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    return appUrl;
  }
  return getLocalBaseUrl();
}

/** Never derive platform legal links from a tenant-controlled browser host. */
export function getPlatformLegalUrl(
  kind: "privacy" | "terms",
  language: "ckb" | "ar" | "en",
): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    `${getAppProtocol()}//${process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3011"}`;
  const url = new URL(`/legal/${kind}`, base);
  url.searchParams.set("lang", language);
  return url.href;
}

export function getRootDomain(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost";
  }
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : "";

  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return `localhost${port}`;
  }

  const parts = hostname.split(".");
  if (parts.length >= 2) {
    return `${parts.slice(-2).join(".")}${port}`;
  }
  return `${hostname}${port}`;
}

export function getSubdomainPageUrl(subdomain: string, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (typeof window === "undefined") {
    const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost";
    return `${getAppProtocol()}//${subdomain}.${root}${normalizedPath}`;
  }

  const protocol = window.location.protocol;
  const configuredRoot = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost";
  const scope = resolveLinktreeHost(window.location.host, configuredRoot);
  if (!scope.isPlatformRoot && !scope.subdomain) {
    return `${window.location.origin}${normalizedPath}`;
  }
  const root = getRootDomain();

  return `${protocol}//${subdomain}.${root}${normalizedPath}`;
}

export function getBusinessWorkspaceEntryUrl(subdomain: string): string {
  return getSubdomainPageUrl(subdomain, "/business/workspace-entry");
}

export function getAbsolutePublicUrl(pathPrefix: string, slug: string): string {
  const normalizedPrefix = `/${pathPrefix.replace(/^\/+|\/+$/g, "")}`;
  const path = `${normalizedPrefix}/${encodeURIComponent(slug)}`;
  if (typeof window === "undefined") {
    return `${getAppBaseUrl()}${path}`;
  }
  return `${window.location.origin}${path}`;
}
