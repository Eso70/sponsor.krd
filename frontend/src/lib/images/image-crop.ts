import { gaussianBlurPixels } from "./gaussian-blur";
import { loadLocalRasterImage } from "./local-raster-image";

export type CropTransform = { zoom: number; x: number; y: number };
export type ImageSize = { width: number; height: number };
export const INITIAL_CROP: CropTransform = { zoom: 1, x: 0, y: 0 };
export const MAX_CROP_ZOOM = 32;
const blurredImages = new WeakMap<HTMLImageElement, HTMLCanvasElement>();

function blurredImage(image: HTMLImageElement): HTMLCanvasElement {
  const cached = blurredImages.get(image);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  const size = cropOutputSize(image.naturalWidth / image.naturalHeight, 96);
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  context.drawImage(image, 0, 0, size.width, size.height);
  const pixels = context.getImageData(0, 0, size.width, size.height);
  pixels.data.set(gaussianBlurPixels(pixels.data, size.width, size.height));
  context.putImageData(pixels, 0, 0);
  blurredImages.set(image, canvas);
  return canvas;
}

/** Coordinates are relative to the crop frame, so resizing never changes the crop. */
export function cropGeometry(
  image: ImageSize,
  frame: ImageSize,
  transform: CropTransform,
  fill: boolean,
) {
  const cover = Math.max(
    frame.width / image.width,
    frame.height / image.height,
  );
  const contain = Math.min(
    frame.width / image.width,
    frame.height / image.height,
  );
  const minZoom = fill ? contain / cover : 1;
  const zoom = Math.max(minZoom, Math.min(MAX_CROP_ZOOM, transform.zoom));
  const width = image.width * cover * zoom;
  const height = image.height * cover * zoom;
  const limitX = fill ? 0.5 : Math.max(0, (width / frame.width - 1) / 2);
  const limitY = fill ? 0.5 : Math.max(0, (height / frame.height - 1) / 2);
  const x = Math.max(-limitX, Math.min(limitX, transform.x));
  const y = Math.max(-limitY, Math.min(limitY, transform.y));
  return {
    width,
    height,
    minZoom,
    left: (frame.width - width) / 2 + x * frame.width,
    top: (frame.height - height) / 2 + y * frame.height,
    transform: { zoom, x, y },
  };
}

export function cropOutputSize(ratio: number, maxEdge = 1440): ImageSize {
  return ratio >= 1
    ? { width: maxEdge, height: Math.max(1, Math.round(maxEdge / ratio)) }
    : { width: Math.max(1, Math.round(maxEdge * ratio)), height: maxEdge };
}

export function drawImageCrop(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  frame: ImageSize,
  transform: CropTransform,
  fill: boolean,
) {
  context.clearRect(0, 0, frame.width, frame.height);
  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  const source = { width: image.naturalWidth, height: image.naturalHeight };
  if (fill) {
    const background = cropGeometry(
      source,
      frame,
      { ...INITIAL_CROP, zoom: 1.15 },
      false,
    );
    context.drawImage(
      blurredImage(image),
      background.left,
      background.top,
      background.width,
      background.height,
    );
  }
  const crop = cropGeometry(source, frame, transform, fill);
  context.drawImage(image, crop.left, crop.top, crop.width, crop.height);
  context.restore();
}

/** Raster-only, local assets. Avoid remote fetches and excessive decoded allocations. */
export const loadCropImage = loadLocalRasterImage;

export async function exportImageCrop(
  image: HTMLImageElement,
  ratio: number,
  transform: CropTransform,
  fill: boolean,
  maxEdge = 1440,
): Promise<File> {
  const frame = cropOutputSize(ratio, maxEdge);
  const canvas = document.createElement("canvas");
  canvas.width = frame.width;
  canvas.height = frame.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  drawImageCrop(context, image, frame, transform, fill);
  const encode = (mime: string) =>
    new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("Unable to encode crop")),
        mime,
        0.92,
      ),
    );
  let blob = await encode("image/png");
  if (blob.size > 5 * 1024 * 1024) blob = await encode("image/webp");
  // Browsers may return PNG when WebP encoding is unavailable. Preserve alpha by
  // reducing the raster rather than converting transparent logos to JPEG.
  if (blob.size > 5 * 1024 * 1024) {
    const smaller = cropOutputSize(ratio, Math.min(maxEdge, 1080));
    canvas.width = smaller.width;
    canvas.height = smaller.height;
    drawImageCrop(context, image, smaller, transform, fill);
    blob = await encode("image/png");
  }
  if (!blob.size || blob.size > 5 * 1024 * 1024)
    throw new Error("Crop too large");
  return new File(
    [blob],
    blob.type === "image/png" ? "crop.png" : "crop.webp",
    { type: blob.type },
  );
}
