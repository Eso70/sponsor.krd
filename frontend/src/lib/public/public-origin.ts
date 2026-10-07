import { resolveLinktreeHost, type LinktreeHostScope } from "./linktree-host";
import type { ResolvedBusinessDomain } from "@linktree/types";

/** Canonical authorities come from configuration, never a supplied Host value. */
export function resolvePublicOrigin(
  host: string,
  rootDomain: string,
  appUrl: string,
  verified?: ResolvedBusinessDomain | null,
): (LinktreeHostScope & { origin: string }) | null {
  if (verified?.isCustom || verified?.primaryHostname) {
    if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(verified.subdomain))
      return null;
    if (!verified.primaryHostname)
      return resolvePublicOrigin(
        `${verified.subdomain}.${rootDomain}`,
        rootDomain,
        appUrl,
      );
    const hostname = verified.primaryHostname;
    if (!/^[a-z0-9.-]+$/.test(hostname)) return null;
    return {
      isPlatformRoot: false,
      subdomain: verified.subdomain,
      origin: `https://${hostname}`,
    };
  }
  const scope = resolveLinktreeHost(host, rootDomain);
  if (!scope.isPlatformRoot && !scope.subdomain) return null;
  const base = new URL(appUrl);
  if (base.protocol !== "https:" && base.protocol !== "http:") return null;
  const configured = new URL(`${base.protocol}//${rootDomain}`);
  configured.port ||= base.port;
  configured.hostname = scope.subdomain
    ? `${scope.subdomain}.${configured.hostname}`
    : configured.hostname;
  return { ...scope, origin: configured.origin };
}
