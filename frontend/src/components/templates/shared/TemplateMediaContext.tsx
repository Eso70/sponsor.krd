"use client";
import { createContext, useContext } from "react";
import type { LinktreeBanner } from "@linktree/types";
import type { LinktreeSponsor } from "@linktree/types/linktree-sponsor.cjs";
import type { LinktreeSeo } from "@linktree/types/linktree-seo.cjs";

export type TemplateMediaAction = "image-open" | "banner-change";
export const TemplateMediaContext = createContext<{
  banner: LinktreeBanner;
  preview?: boolean;
  seo?: LinktreeSeo;
  sponsor?: LinktreeSponsor;
  onSponsorClick?: (url: string, name: string) => void;
  onAction?: (action: TemplateMediaAction, index: number) => void;
}>({ banner: { enabled: false, mode: "image", images: [] } });
export function useTemplateMedia() {
  const media = useContext(TemplateMediaContext);
  return { ...media, hasBanner: media.banner.enabled && (media.banner.images.length > 0 || media.preview === true) };
}
