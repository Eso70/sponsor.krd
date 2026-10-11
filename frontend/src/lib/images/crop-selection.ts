import { cropGeometry, type CropTransform, type ImageSize } from "./image-crop";

export type CropFrame = ImageSize & { left: number; top: number };
export type CropEdge = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export function moveCropFrame(
  frame: CropFrame,
  dx: number,
  dy: number,
  bounds: ImageSize,
): CropFrame {
  return {
    ...frame,
    left: clamp(frame.left + dx, 0, bounds.width - frame.width),
    top: clamp(frame.top + dy, 0, bounds.height - frame.height),
  };
}

/** Opposite edges stay anchored; free crops resize independently in both axes. */
export function resizeCropFrame(
  frame: CropFrame,
  edge: CropEdge,
  dx: number,
  dy: number,
  bounds: ImageSize,
  ratio?: number,
): CropFrame {
  const west = edge.includes("w"),
    east = edge.includes("e"),
    north = edge.includes("n"),
    south = edge.includes("s");
  const right = frame.left + frame.width,
    bottom = frame.top + frame.height;
  if (!ratio) {
    const left = west ? clamp(frame.left + dx, 0, right - 24) : frame.left;
    const top = north ? clamp(frame.top + dy, 0, bottom - 24) : frame.top;
    const nextRight = east ? clamp(right + dx, left + 24, bounds.width) : right;
    const nextBottom = south
      ? clamp(bottom + dy, top + 24, bounds.height)
      : bottom;
    return { left, top, width: nextRight - left, height: nextBottom - top };
  }
  const cx = frame.left + frame.width / 2,
    cy = frame.top + frame.height / 2;
  const maxWidth = west
    ? right
    : east
      ? bounds.width - frame.left
      : 2 * Math.min(cx, bounds.width - cx);
  const maxHeight = north
    ? bottom
    : south
      ? bounds.height - frame.top
      : 2 * Math.min(cy, bounds.height - cy);
  const horizontal = frame.width + (west ? -dx : east ? dx : 0);
  const vertical = (frame.height + (north ? -dy : south ? dy : 0)) * ratio;
  const desired =
    west || east
      ? (north || south) && Math.abs(dy * ratio) > Math.abs(dx)
        ? vertical
        : horizontal
      : vertical;
  const maximum = Math.min(maxWidth, maxHeight * ratio);
  const width = clamp(
    desired,
    Math.min(maximum, Math.max(24, 24 * ratio)),
    maximum,
  );
  const height = width / ratio;
  return {
    width,
    height,
    left: west ? right - width : east ? frame.left : cx - width / 2,
    top: north ? bottom - height : south ? frame.top : cy - height / 2,
  };
}

/** Keep the image stationary as its selection frame moves or resizes. */
export function reframeCrop(
  image: ImageSize,
  before: CropFrame,
  after: CropFrame,
  transform: CropTransform,
  fill: boolean,
): CropTransform {
  const previous = cropGeometry(image, before, transform, fill);
  const cover = Math.max(
    after.width / image.width,
    after.height / image.height,
  );
  return cropGeometry(
    image,
    after,
    {
      zoom: previous.width / (image.width * cover),
      x:
        (before.left +
          previous.left -
          after.left -
          (after.width - previous.width) / 2) /
        after.width,
      y:
        (before.top +
          previous.top -
          after.top -
          (after.height - previous.height) / 2) /
        after.height,
    },
    fill,
  ).transform;
}
