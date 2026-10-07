import type { ResolvedBusinessDomain } from "@linktree/types";
import {
  INTERNAL_PROXY_KEY_HEADER,
  internalProxyKey,
} from "@/lib/security/internal-proxy-key";

/** Mapping comes from the backend database, never from a browser tenant header. */
export async function resolveBusinessHost(
  host: string,
): Promise<ResolvedBusinessDomain | null> {
  const key = internalProxyKey();
  if (!key) throw new Error("Domain resolution is not configured");
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/internal/domains/resolve?host=${encodeURIComponent(host)}`,
    {
      headers: { [INTERNAL_PROXY_KEY_HEADER]: key },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    },
  );
  if (!response.ok) throw new Error("Domain resolution unavailable");
  const body = (await response.json()) as {
    data: ResolvedBusinessDomain | null;
  };
  return body.data;
}
