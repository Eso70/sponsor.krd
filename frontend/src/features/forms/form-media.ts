import {
  isLocalRasterImage,
  loadLocalRasterImage,
} from "@/lib/images/local-raster-image";

const MAX_BYTES = 5 * 1024 * 1024;
export const isFormImage = isLocalRasterImage;

/** Validate local raster uploads; saving persists them through the owner-scoped API. */
export async function readFormImage(file: File): Promise<string> {
  if (
    !file.size ||
    validateUploadFile(file, {
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      maxBytes: MAX_BYTES,
    })
  )
    throw new Error("image");
  const value = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("image"));
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("image"));
    reader.readAsDataURL(file);
  });
  if (!isFormImage(value)) throw new Error("image");
  await loadLocalRasterImage(value);
  return value;
}
import { validateUploadFile } from "@/lib/api/inline-request-error";

/** Decode a local raster without fetching data: URLs (blocked by connect-src). */
export function formImageBlob(value: string): Blob {
  if (!isFormImage(value) || !value.startsWith("data:image/"))
    throw new Error("Invalid local form image");
  const separator = value.indexOf(",");
  const mime = value.slice(5, value.indexOf(";"));
  const decoded = atob(value.slice(separator + 1));
  if (!decoded.length || decoded.length > MAX_BYTES)
    throw new Error("Invalid local form image size");
  const bytes = Uint8Array.from(decoded, (character) =>
    character.charCodeAt(0),
  );
  return new Blob([bytes], { type: mime });
}
