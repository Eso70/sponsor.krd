import type { MetadataRoute } from "next";
import { SPONSOR_KRD_APP_ICON, SPONSOR_KRD_APP_ICON_SMALL } from "@/lib/brand/brand-assets";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sponsor.krd",
    short_name: "Sponsor.krd",
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
