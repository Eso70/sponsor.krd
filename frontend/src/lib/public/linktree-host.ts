export type LinktreeHostScope = {
  isPlatformRoot: boolean;
  subdomain: string;
};

/** Separates root-owned pages from tenant subdomains before choosing an API. */
export function resolveLinktreeHost(
  hostname: string,
  rootDomain: string,
): LinktreeHostScope {
  if (!/^[a-z0-9.-]+(?::\d{1,5})?$/i.test(hostname.trim())) {
    return { isPlatformRoot: false, subdomain: "" };
  }
  const host = hostname.trim().toLowerCase().split(":")[0].replace(/\.$/, "");
  const root = rootDomain.trim().toLowerCase().split(":")[0].replace(/\.$/, "");
  const isLocalRoot = root === "localhost" && host === "127.0.0.1";
  const isPlatformRoot = isLocalRoot || host === root || host === `www.${root}`;
  const subdomain =
    !isPlatformRoot && host.endsWith(`.${root}`)
      ? host.slice(0, -(root.length + 1))
      : "";
  return {
    isPlatformRoot,
    subdomain: /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(subdomain)
      ? subdomain : "",
  };
}
