"use client";
import { PublicImageGallery } from "@/components/shared/PublicImageGallery";
import { imageMediaCopy } from "@/components/shared/image-media-copy";
import { usePublicLinktreeLocale } from "@/features/business/i18n/public-linktree";
import { useTemplateMedia } from "./TemplateMediaContext";

/** Full-width banner shared by every template and the drawer preview. */
export function TemplateBanner() {
  const { banner, preview, hasBanner, onAction } = useTemplateMedia();
  const copy = imageMediaCopy(usePublicLinktreeLocale());
  if (!hasBanner) return null;
  return <div data-linktree-banner className="relative w-full">
    <PublicImageGallery banner eager placeholder={preview} images={banner.images}
      carousel={banner.mode === "carousel"} copy={copy}
      onImageOpen={(index) => onAction?.("image-open", index)}
      onSlideChange={(index) => onAction?.("banner-change", index)} />
  </div>;
}
