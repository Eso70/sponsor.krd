import type { BusinessDomains } from "@linktree/types";
import { buildSubdomainUrl } from "@/lib/subdomain-utils";
import { getAppBaseUrl } from "@/lib/utils/app-url";

/** A host change needs a fresh host-only session on the selected address. */
export function openSelectedBusinessWorkspace(data: BusinessDomains): void {
  const primary = data.domains.find((domain) => domain.isPrimary);
  const base = new URL(getAppBaseUrl());
  const target = primary
    ? new URL("/business/workspace-entry", `https://${primary.hostname}`)
    : buildSubdomainUrl({
        protocol: base.protocol === "http:" ? "http" : "https",
        rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost",
        requestHost: base.host,
        subdomain: data.subdomain,
        path: "/business/workspace-entry",
      });
  if (target.host !== window.location.host)
    window.location.assign(target.toString());
}
