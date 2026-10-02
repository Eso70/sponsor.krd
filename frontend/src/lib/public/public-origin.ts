import { resolveLinktreeHost } from "./linktree-host";

/** Canonical authorities come from configuration, never a supplied Host value. */
export function resolvePublicOrigin(host: string, rootDomain: string, appUrl: string) {
  const scope = resolveLinktreeHost(host, rootDomain);
  if (!scope.isPlatformRoot && !scope.subdomain) return null;
  const base = new URL(appUrl);
  if (base.protocol !== "https:" && base.protocol !== "http:") return null;
  const configured = new URL(`${base.protocol}//${rootDomain}`);
  configured.port ||= base.port;
  configured.hostname = scope.subdomain
    ? `${scope.subdomain}.${configured.hostname}` : configured.hostname;
  return { ...scope, origin: configured.origin };
}
