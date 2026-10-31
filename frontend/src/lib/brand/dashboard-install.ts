import type { Metadata, MetadataRoute } from "next";
import { brandIconUrl } from "./tab-branding";
import { SPONSOR_KRD_APP_ICON, SPONSOR_KRD_APP_ICON_SMALL } from "./brand-assets";

export const BUSINESS_APP_SCOPE = "/business/";
export const BUSINESS_APP_LAUNCH = "/business/launch";
export const BUSINESS_APP_MANIFEST = "/business/manifest.webmanifest";

type AppBranding = {
  name: string;
  logo: string | null;
  favicon: string | null;
  platform: boolean;
};

/** Stable relative identities keep tenant hosts isolated and stay valid across login. */
export function dashboardManifest(branding: AppBranding, base: string): MetadataRoute.Manifest {
  return {
    id: `${base}/`,
    name: `${branding.name} Dashboard`,
    short_name: branding.name,
    start_url: branding.platform ? `${base}/businesses` : BUSINESS_APP_LAUNCH,
    scope: `${base}/`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#25F4EE",
    icons: branding.platform ? [
      { src: SPONSOR_KRD_APP_ICON_SMALL, sizes: "192x192", type: "image/png" },
      { src: SPONSOR_KRD_APP_ICON, sizes: "512x512", type: "image/png" },
    ] : [{ src: branding.logo || brandIconUrl(branding.favicon, branding.logo), sizes: "any" }],
  };
}

export function dashboardInstallMetadata(name: string, base: string): Metadata {
  return {
    manifest: `${base}/manifest.webmanifest`,
    appleWebApp: { capable: true, title: name, statusBarStyle: "default" },
  };
}

export function dashboardManifestResponse(manifest: MetadataRoute.Manifest): Response {
  return Response.json(manifest, { headers: {
    "Content-Type": "application/manifest+json",
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow",
  } });
}
