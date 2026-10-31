import "server-only";
import { cache } from "react";
import type { ComponentProps } from "react";
import type { BusinessLanding } from "@/components/business/BusinessLanding";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { PublicLinktreePayload, PublicSitemapPage } from "@linktree/types";
import { getAppBaseUrl } from "@/lib/utils/app-url";
import {
  INTERNAL_PROXY_KEY_HEADER,
  internalProxyKey,
} from "@/lib/security/internal-proxy-key";
import { resolvePublicOrigin } from "./public-origin";
import { resolveBusinessHost } from "./domain-routing";
import { resolveLinktreeHost } from "./linktree-host";
import { classifyUpstreamFailure } from "@/lib/api/upstream-failure";

export const publicRequestContext = cache(async () => {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") || "";
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost";
  const scope = resolveLinktreeHost(host, rootDomain);
  const verified = scope.isPlatformRoot
    ? null
    : await resolveBusinessHost(host);
  const context = resolvePublicOrigin(
    requestHeaders.get("host") || "",
    process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost",
    getAppBaseUrl(),
    verified,
  );
  if (!context) notFound();
  return context;
});

export async function publicFetch(path: string) {
  const context = await publicRequestContext();
  const requestHeaders = await headers();
  return fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}${path}`,
    {
      headers: {
        "x-subdomain": context.subdomain,
        [INTERNAL_PROXY_KEY_HEADER]: internalProxyKey() || "",
        "x-forwarded-for":
          requestHeaders.get("x-forwarded-for") ||
          requestHeaders.get("x-real-ip") ||
          "",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    },
  );
}

/** React cache deduplicates metadata/body/image reads within this request only. */
export const fetchPublicLinktree = cache(async (uid: string) => {
  const context = await publicRequestContext();
  if (!/^[a-z0-9-]{1,50}$/.test(uid)) return null;
  try {
    const endpoint = context.isPlatformRoot ? "platform/linktree" : "linktree";
    const response = await publicFetch(
      `/api/public/${endpoint}/${encodeURIComponent(uid)}`,
    );
    if (
      response.status === 403 ||
      response.status === 404 ||
      response.status === 410
    )
      return null;
    if (!response.ok) {
      console.error("[public-page] Upstream read failed", response.status);
      return response.status === 504
        ? ("gateway-timeout" as const)
        : ("service-unavailable" as const);
    }
    const body = (await response.json()) as { data: PublicLinktreePayload };
    if (!body.data?.linktree) return null;
    return {
      ...body.data,
      analytics: body.data.analytics || { pixelIds: [], actions: {} },
      ...context,
    };
  } catch (error) {
    console.error(
      "[public-page] Upstream unavailable",
      error instanceof Error ? error.name : "Error",
    );
    return classifyUpstreamFailure(error).status === 504
      ? ("gateway-timeout" as const)
      : ("service-unavailable" as const);
  }
});

/** Request-scoped only: settings/default-page changes take effect on the next visit. */
export const fetchBusinessHomepage = cache(async () => {
  const context = await publicRequestContext();
  if (context.isPlatformRoot) return null;
  try {
    const response = await publicFetch("/api/public/business");
    if (response.status === 404 || response.status === 403) return null;
    if (!response.ok) {
      console.error("[business-homepage] Upstream read failed", response.status);
      return response.status === 504 ? "gateway-timeout" as const : "service-unavailable" as const;
    }
    const { data: business } = await response.json() as {
      data?: ComponentProps<typeof BusinessLanding>["business"] & {
        homepage_linktree?: boolean;
        default_linktree_slug?: string | null;
      };
    };
    if (!business) return null;
    const linktree = business.homepage_linktree && business.default_linktree_slug
      ? await fetchPublicLinktree(business.default_linktree_slug)
      : null;
    // A removed/inactive default falls back to the usual homepage. An upstream
    // failure remains visible rather than silently showing different content.
    if (typeof linktree === "string") return linktree;
    return { business, linktree };
  } catch (error) {
    console.error("[business-homepage] Upstream unavailable", error instanceof Error ? error.name : "Error");
    return classifyUpstreamFailure(error).status === 504
      ? "gateway-timeout" as const : "service-unavailable" as const;
  }
});

export async function fetchSitemapPages(
  page: number,
): Promise<{ pages: PublicSitemapPage[]; totalPages: number }> {
  const response = await publicFetch(`/api/public/sitemap?chunk=${page}`);
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error("Sitemap upstream unavailable");
  const body = (await response.json()) as {
    data: { pages: PublicSitemapPage[]; totalPages: number };
  };
  return body.data;
}
