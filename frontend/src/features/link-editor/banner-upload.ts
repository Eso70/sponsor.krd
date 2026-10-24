import { readLinktreeBanner } from "@linktree/types";
import { formImageBlob, isFormImage } from "@/features/forms/form-media";

/** Shared local-raster persistence for logos, banners and backgrounds. */
export async function uploadLinktreeDraftImage(image: string, upload: (file: File) => Promise<string | null>): Promise<string> {
  if (!image.startsWith("data:")) return image;
  const blob = formImageBlob(image);
  if (!["image/png", "image/jpeg"].includes(blob.type)) throw new Error("Unsupported image");
  const url = await upload(new File([blob], `banner.${blob.type === "image/jpeg" ? "jpg" : "png"}`, { type: blob.type }));
  if (!url) throw new Error("Image upload failed");
  return url;
}

/** Upload each unique draft source once, retaining untouched stored images. */
export async function uploadLinktreeBanner(
  value: unknown,
  upload: (file: File) => Promise<string | null>,
) {
  const banner = readLinktreeBanner(value, isFormImage);
  const uploads = new Map<string, Promise<string>>();
  const images = await Promise.all(banner.images.map((image) => {
    if (!image.startsWith("data:")) return image;
    if (!uploads.has(image)) uploads.set(image, uploadLinktreeDraftImage(image, upload));
    return uploads.get(image)!;
  }));
  return { ...banner, images };
}
