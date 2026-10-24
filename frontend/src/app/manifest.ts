import { requestBranding } from "@/lib/brand/request-branding.server";
import { brandIconUrl } from "@/lib/brand/tab-branding";
import type { MetadataRoute } from "next";
import { SPONSOR_KRD_APP_ICON, SPONSOR_KRD_APP_ICON_SMALL } from "@/lib/brand/brand-assets";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const branding = await requestBranding();
  if (!branding.platform) return {name: branding.name, short_name: branding.name, start_url: "/", display: "standalone", icons: [{src: branding.logo || brandIconUrl(branding.favicon, branding.logo), sizes: "any"}]};
  return {
    name: branding.name,
    short_name: branding.name,
    description: "Create and share a branded Linktree with Sponsor.krd",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#25F4EE",
    icons: [
      { src: SPONSOR_KRD_APP_ICON_SMALL, sizes: "192x192", type: "image/png" },
      { src: SPONSOR_KRD_APP_ICON, sizes: "512x512", type: "image/png" },
    ],
  };
}
