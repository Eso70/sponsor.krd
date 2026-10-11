const MAX_BYTES = 5 * 1024 * 1024;
export function isFormImage(value: string): boolean {
  return (
    /^\/images\/upload\/[a-zA-Z0-9_./-]+$/.test(value) ||
    (value.length <= 7_000_000 &&
      /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value))
  );
}

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
  await new Promise<void>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () =>
      image.naturalWidth > 0 &&
      image.naturalHeight > 0 &&
      image.naturalWidth * image.naturalHeight <= 40_000_000
        ? resolve()
        : reject(new Error("image"));
    image.onerror = () => reject(new Error("image"));
    image.src = value;
  });
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
