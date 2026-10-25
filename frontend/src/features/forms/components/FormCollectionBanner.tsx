"use client";
import { PageListBanner } from "@/components/shared/PageListBanner";
import { PublicImageGallery } from "@/components/shared/PublicImageGallery";
import { imageMediaCopy } from "@/components/shared/image-media-copy";
import type { FormLanguage, FormSummary } from "../types";

/** Saved collection media uses the same carousel as the public form. */
export function FormCollectionBanner({
  form,
  locale,
  compact = false,
}: {
  form: FormSummary;
  locale: FormLanguage;
  compact?: boolean;
}) {
  const images =
    form.bannerEnabled === false
      ? []
      : form.bannerImages?.length
        ? form.bannerImages
        : form.banner
          ? [form.banner]
          : [];
  return form.bannerMode === "carousel" && images.length > 1 ? (
    <PublicImageGallery
      banner
      carousel
      cover
      compact={compact}
      placeholder
      images={images}
      copy={imageMediaCopy(locale)}
    />
  ) : (
    <PageListBanner src={images[0]} compact={compact} />
  );
}
